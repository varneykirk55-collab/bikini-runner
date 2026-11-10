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

/** How many overlapping foliage strips each shoulder gets, sampled at perspective scale. */
const WALL_SLICES = 24;
const WALL_NEAR = -1.6;
const WALL_FAR = 18;
/** World length of one seamless repeat of the wall texture. */
const WALL_TILE_Z = 7;
/** Uniform texture scale at the player; viewport width only changes the tiled area. */
const WALL_SCALE = 0.6;

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
  private readonly walls: Phaser.GameObjects.TileSprite[];
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
      this.walls.push(scene.add.tileSprite(0, 0, 1, 1, key).setVisible(false));
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

  /** Sample the foliage at uniform perspective scale; fill the shoulders by
   * repeating the art rather than stretching a cropped image to the viewport.
   * TileSprite dimensions are a sampling area, independent of texture scale.
   */
  private drawWalls(proj: CameraRig, distance: number): void {
    for (let i = 0; i < WALL_SLICES; i++) {
      const z = wallZ(i);
      const zCloser = i === 0 ? -1.8 : wallZ(i - 1);
      const yNear = proj.project(0, zCloser).y;
      const yFar = proj.project(0, z).y;
      const h = Math.max(12, (yNear - yFar) * 1.8);
      const midY = (yNear + yFar) / 2;
      const scale = WALL_SCALE * proj.scale(z);
      const depth = depthForZ(Math.max(0.2, z)) - 40;
      for (const side of [-1, 1] as const) {
        const wall = this.walls[(side < 0 ? 0 : WALL_SLICES) + i];
        const edge = proj.project(side * (ROAD - 0.02), zCloser).x;
        const width = Math.max(24, side < 0 ? edge + 64 : GAME_W + 64 - edge);
        wall.setOrigin(side < 0 ? 1 : 0, 0.5)
          .setPosition(edge, midY)
          .setSize(Math.ceil(width), Math.ceil(h))
          .setTileScale(scale, scale)
          .setDepth(depth)
          .setVisible(true);
        // Anchor sampling to the road-facing edge, keeping the outer fill tiled.
        const src = wall.texture.getSourceImage();
        wall.tilePositionX = side < 0 ? src.width - width / scale : 0;
        wall.tilePositionY = ((distance + z) / WALL_TILE_Z) * src.height;
      }
    }
  }
}
