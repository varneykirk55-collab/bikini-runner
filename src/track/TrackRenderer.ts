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

/** Painted foliage strips, spaced from the foreground out to the horizon. */
const WALL_SLICES = 22;
const WALL_NEAR = 0.18;
const WALL_FAR = 7.5;
/** World length of one seamless repeat of the wall texture. */
const WALL_TILE_Z = 8;

function wallZ(i: number): number {
  const t = i / (WALL_SLICES - 1);
  return WALL_NEAR * Math.pow(WALL_FAR / WALL_NEAR, t);
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
  private readonly fog: Phaser.GameObjects.Image;

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
      const img = scene.add.image(0, 0, key).setVisible(false);
      this.walls.push(img);
    }
    this.fog = scene.add.image(0, HORIZON_Y - 24, 'fog').setOrigin(0, 0).setDisplaySize(GAME_W, 150).setAlpha(0.22).setDepth(DEPTH.sandfield - 0.2);
  }

  draw(proj: CameraRig, distance: number): void {
    const top = HORIZON_Y + proj.lift;
    this.ground.y = top;
    this.fog.y = top - 30;

    const g = this.g;
    g.clear();
    const quad = (l0: number, l1: number, z0: number, z1: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillPoints([proj.project(l0, z0), proj.project(l1, z0), proj.project(l1, z1), proj.project(l0, z1)], true);
    };

    // Asphalt is one surface out to the horizon. The shoulders are the jungle-floor
    // gradient (sandfield) plus the bushes and plant sprites, so they aren't a flat fill.
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
   * Painted foliage strips along both white lines. Each slice is scaled by depth
   * (narrow far away, wide up close) and shows the next band of the seamless texture,
   * so the plants scroll with the run. The road-facing edge stays on the white line.
   * Left art is not flipped: its transparent edge is the right side of the image.
   */
  private drawWalls(proj: CameraRig, distance: number): void {
    const sample = this.walls[0];
    if (!sample || !sample.texture || sample.texture.key === '__MISSING') return;
    const srcH = sample.texture.getSourceImage().height || 1024;
    const srcW = sample.texture.getSourceImage().width || 512;

    for (let i = 0; i < WALL_SLICES; i++) {
      const z = wallZ(i);
      const zCloser = i === 0 ? 0.02 : wallZ(i - 1);
      const yNear = proj.project(0, zCloser, 0).y;
      const yFar = proj.project(0, z, 0).y;
      const h = Math.max(1, (yNear - yFar) * 1.35);
      let v = ((distance + z) / WALL_TILE_Z) % 1;
      if (v < 0) v += 1;
      const vSpan = Math.min(Math.max(0.02, (z - zCloser) / WALL_TILE_Z), 1 - v);
      const cropY = Math.min(srcH - 1, Math.floor(v * srcH));
      const cropH = Math.max(1, Math.min(srcH - cropY, Math.floor(vSpan * srcH)));
      const midY = (yNear + yFar) / 2;

      const left = this.walls[i];
      const pL = proj.project(-(ROAD - 0.05), z, 0);
      const wL = Math.max(12, Math.abs(-24 - pL.x));
      left.setOrigin(1, 0.5).setCrop(0, cropY, srcW, cropH).setPosition(pL.x, midY).setDisplaySize(wL, h).setDepth(depthForZ(z) - 40).setVisible(true);

      const right = this.walls[WALL_SLICES + i];
      const pR = proj.project(ROAD - 0.05, z, 0);
      const wR = Math.max(12, Math.abs(GAME_W + 24 - pR.x));
      right.setOrigin(0, 0.5).setCrop(0, cropY, srcW, cropH).setPosition(pR.x, midY).setDisplaySize(wR, h).setDepth(depthForZ(z) - 40).setVisible(true);
    }
  }
}
