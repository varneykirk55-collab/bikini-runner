import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, HORIZON_Y, depthForZ } from '../config';
import { CameraRig } from '../camera/CameraRig';

/**
 * Painted jungle road. The same asphalt, white edge lines and roadside foliage
 * repeat for every segment of the run, near and far. The distant cliffs, falls
 * and sunset are the loaded backdrop, not drawn here.
 */
const ASPHALT_PATCH = 0x2c2e34;
const EDGE = 0xf4f1ea;

const ROAD = 1.52; // half-width of the asphalt, in lanes
const ROAD_FAR = 420;
const NEAR = -2.8;
const ASPHALT_COLOR = 0x1c1e22;

/** How many overlapping foliage strips each shoulder gets, and how many copies sit side by side. */
const WALL_SLICES = 24;
const WALL_NEAR = -1.6;
const WALL_FAR = 18;
/** World length of one seamless repeat of the wall texture. */
const WALL_TILE_Z = 7;
/** Fraction of the texture shown in each strip, so plants stay plants instead of smeared rows. */
const WALL_WINDOW = 0.55;

function wallZ(i: number): number {
  const t = i / (WALL_SLICES - 1);
  return WALL_NEAR + (WALL_FAR - WALL_NEAR) * t;
}

/** Stable variation tied to world position so the road doesn't flicker as it scrolls. */
function hash(a: number, b: number): number {
  return (Math.imul(a, 73856093) ^ Math.imul(b + 17, 19349663)) >>> 0;
}

/**
 * Track geometry: dark asphalt with white edge lines, and jungle crowding both
 * shoulders. Redrawn each frame from a distance along the path. Obstacle placement
 * and course shape live elsewhere; a future turn renderer can replace this class
 * and keep the same palette.
 */
export class TrackRenderer {
  private readonly g: Phaser.GameObjects.Graphics;
  /** Left wall slices, then right wall slices. */
  private readonly walls: Phaser.GameObjects.Image[];
  private readonly ground: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.ground = scene.add
      .image(0, HORIZON_Y, 'sandfield')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_W, GAME_H - HORIZON_Y + 80)
      .setDepth(DEPTH.sandfield);
    this.g = scene.add.graphics().setDepth(DEPTH.ground);
    this.walls = [];
    for (let i = 0; i < WALL_SLICES * 2; i++) {
      const key = i < WALL_SLICES ? 'roadside_left' : 'roadside_right';
      this.walls.push(scene.add.image(0, 0, key).setVisible(false));
    }
  }

  draw(proj: CameraRig, distance: number): void {
    const top = HORIZON_Y + proj.lift;
    this.ground.y = top;

    const g = this.g;
    g.clear();
    const quad = (l0: number, l1: number, z0: number, z1: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillPoints([proj.project(l0, z0), proj.project(l1, z0), proj.project(l1, z1), proj.project(l0, z1)], true);
    };

    // Jungle green under the foliage, so a missed strip is leaves, not the black underlay.
    for (const side of [-1, 1] as const) {
      quad(side * (ROAD - 0.04), side * 8, NEAR, 90, 0x12341c);
    }
    quad(-ROAD, ROAD, NEAR, ROAD_FAR, ASPHALT_COLOR);

    // A few gravel specks scroll with the run. Small enough that they don't read as stripes.
    const speck = distance % 2.2;
    const speckBase = Math.floor(distance / 2.2);
    for (let i = 0; i < 28; i++) {
      const z = NEAR + i * 2.2 - speck;
      if (z < 0.4 || z > 40) continue;
      const h = hash(speckBase + i, 4);
      const x = -1.15 + (h % 100) / 100 * 2.3;
      quad(x, x + 0.05, z, z + 0.28, ASPHALT_PATCH, 0.55);
    }

    for (const side of [-1, 1]) {
      quad(side * (ROAD - 0.07), side * (ROAD - 0.02), NEAR, ROAD_FAR, EDGE);
    }

    this.drawWalls(proj, distance);
  }

  /**
   * Overlapping foliage strips on both shoulders. Each strip shows a tall window of
   * the seamless texture (not a one-pixel row), so the plants don't smear into stripes.
   * The road-facing edge of the art sits on the white line; the other edge runs past
   * the screen. Left art is not flipped: its transparent edge is the right side.
   */
  private drawWalls(proj: CameraRig, distance: number): void {
    const sample = this.walls[0];
    if (!sample || sample.texture.key === '__MISSING') return;
    const src = sample.texture.getSourceImage();
    const srcH = src.height || 1024;
    const srcW = src.width || 512;
    // Skip the transparent fringe so foliage meets the white line.
    const leftCropX = 0;
    const leftCropW = Math.round(srcW * 0.9);
    const rightCropX = Math.round(srcW * 0.08);
    const rightCropW = srcW - rightCropX;
    const windowPx = Math.max(8, Math.floor(srcH * WALL_WINDOW));

    for (let i = 0; i < WALL_SLICES; i++) {
      const z = wallZ(i);
      const zCloser = i === 0 ? -1.8 : wallZ(i - 1);
      const yNear = proj.project(0, zCloser, 0).y;
      const yFar = proj.project(0, z, 0).y;
      const h = Math.max(12, (yNear - yFar) * 1.8);
      const midY = (yNear + yFar) / 2;
      let v = ((distance + z) / WALL_TILE_Z) % 1;
      if (v < 0) v += 1;
      const cropY = Math.min(srcH - windowPx, Math.floor(v * (srcH - windowPx)));
      const depth = depthForZ(Math.max(0.2, z)) - 40;
      // Anchor on the nearer (wider) white line and stretch to past the screen,
      // so the shoulder is foliage rather than a staircase of short tiles.
      const pL = proj.project(-(ROAD - 0.02), zCloser, 0);
      const left = this.walls[i];
      left
        .setOrigin(1, 0.5)
        .setCrop(leftCropX, cropY, leftCropW, windowPx)
        .setPosition(pL.x, midY)
        .setDisplaySize(Math.max(24, pL.x + 64), h)
        .setDepth(depth)
        .setVisible(true);

      const pR = proj.project(ROAD - 0.02, zCloser, 0);
      const right = this.walls[WALL_SLICES + i];
      right
        .setOrigin(0, 0.5)
        .setCrop(rightCropX, cropY, rightCropW, windowPx)
        .setPosition(pR.x, midY)
        .setDisplaySize(Math.max(24, GAME_W + 64 - pR.x), h)
        .setDepth(depth)
        .setVisible(true);
    }
  }
}
