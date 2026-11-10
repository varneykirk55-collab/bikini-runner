import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, HORIZON_Y } from '../config';
import { CameraRig } from '../camera/CameraRig';

/**
 * Painted jungle road. The same asphalt, white edge lines and roadside foliage
 * repeat for every segment of the run, near and far. The distant cliffs, falls
 * and sunset are the loaded backdrop, not drawn here.
 */
const ASPHALT_PATCH = 0x2c2e34;
const EDGE = 0xf4f1ea;
const BUSH = [0x0e3d24, 0x166b38, 0x1f8a44, 0x0a321c, 0x248a3c];
const BUSH_HI = 0x6fbf55;
const BLOOM = [0xd0122c, 0xff4b3a, 0xf2c14e];

const ROAD = 1.52; // half-width of the asphalt, in lanes
const BUSH_SEG = 1.15;
/** Bushes are only drawn while they're large enough to read. The road itself runs to the horizon. */
const BUSH_FAR = 80;
const ROAD_FAR = 420;
const NEAR = -2.8;
const ASPHALT_COLOR = 0x1c1e22;

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
  /** Roadside foliage, above the road and the horizon haze, still under the plants and the runner. */
  private readonly bushes: Phaser.GameObjects.Graphics;
  private readonly ground: Phaser.GameObjects.Image;
  private readonly fog: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.ground = scene.add
      .image(0, HORIZON_Y, 'sandfield')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_W, GAME_H - HORIZON_Y + 80)
      .setDepth(DEPTH.sandfield);
    this.g = scene.add.graphics().setDepth(DEPTH.ground);
    this.bushes = scene.add.graphics().setDepth(DEPTH.fog + 1);
    this.fog = scene.add.image(0, HORIZON_Y - 24, 'fog').setOrigin(0, 0).setDisplaySize(GAME_W, 150).setDepth(DEPTH.fog);
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

    this.drawBushes(proj, distance);
  }

  /**
   * Overlapping foliage masses along both shoulders. Heights come from the world
   * index, so the skyline of the jungle stays put as it scrolls. Plant sprites
   * (palms, monstera, hibiscus) sit on top of this mass.
   */
  private drawBushes(proj: CameraRig, distance: number): void {
    const g = this.bushes;
    g.clear();
    const rand = (k: number, salt: number) => (hash(k, salt) % 1000) / 1000;

    const offset = distance % BUSH_SEG;
    const base = Math.floor(distance / BUSH_SEG);
    const count = Math.ceil((BUSH_FAR - NEAR) / BUSH_SEG) + 1;
    for (let i = count; i >= 0; i--) {
      const z0 = NEAR + i * BUSH_SEG - offset;
      if (z0 > BUSH_FAR) continue;
      const zm = z0 + BUSH_SEG * 0.5;
      const k = base + i;
      for (const side of [-1, 1]) {
        // Two overlapping masses per side, sized in world units so the far shoulders stay covered.
        const lane = side * (ROAD + 0.42 + rand(k, side + 3) * 0.7);
        const p = proj.project(lane, zm, 0);
        if (p.s < 0.02) continue;
        const w = (1.05 + rand(k, 11) * 0.6) * 144 * p.s;
        const h = (0.75 + rand(k, 19) * 0.9) * 144 * p.s;
        g.fillStyle(BUSH[hash(k, side + 5) % BUSH.length], 1);
        g.fillEllipse(p.x, p.y - h * 0.42, w, h, 8);
        g.fillStyle(BUSH_HI, 0.4);
        g.fillEllipse(p.x + side * w * 0.08, p.y - h * 0.72, w * 0.4, h * 0.28, 8);
        if (hash(k, 23) % 4 === 0) {
          const bloom = BLOOM[hash(k, 29) % BLOOM.length];
          const bx = p.x - side * w * 0.15;
          const by = p.y - h * 0.85;
          g.fillStyle(bloom, 0.95);
          g.fillEllipse(bx, by, Math.max(4, p.s * 16), Math.max(4, p.s * 16), 8);
          g.fillStyle(0xffe08a, 1);
          g.fillEllipse(bx, by, Math.max(2, p.s * 6), Math.max(2, p.s * 6), 6);
        }
      }
    }
  }
}
