import Phaser from 'phaser';
import { DEPTH, GAME_H, GAME_W, HORIZON_Y } from '../config';
import { CameraRig } from '../camera/CameraRig';

/**
 * PLACEHOLDER palette: warm resort paving, sandy shoulders, low hedge walls.
 * Keys keep their roles from Valhalla Run (gap/planks = grout/tiles, sandA/B = ground,
 * hedge* = wall, foam = edge) so the geometry code below is untouched.
 */
const COLORS = {
  gap: 0xb98a5e,
  planks: [0xf2d2a2, 0xeac592, 0xf6dcb4, 0xe6bd88],
  farPlank: 0xeccb9c,
  sandA: 0xfbe9b9,
  sandB: 0xf5dca0,
  laneLine: 0xb07a45,
  // path containment: a sandstone footing one step lighter than the paving, hedge walls on top
  wallFace: 0xe8c48f,
  wallFaceShade: 0xd9b27a,
  wallBase: 0xa8763f,
  hedgeA: 0x2fb36e,
  hedgeB: 0x27a05f,
  hedgeGlint: 0x7fe6a4,
  hedgeStreak: 0x4fcf86,
  hedgeSeam: 0x1b7a47,
  hedgeTop: 0xff6fa5,
  foam: 0xffffff,
  edgeShade: 0x9a6a38,
};

/** Sandstone footing topped by a jagged flowering hedge, either side of the path (heights in units). */
const WALL = { inner: 1.82, outer: 2.25, seg: 2.4, footMin: 0.14, footMax: 0.22, minH: 0.6, maxH: 1.0 };

const SEG = 1.2; // depth of one row of tiles, world units
const STONE_W = 0.5; // two tiles per lane
const DETAIL_Z = 45; // beyond this, rows are drawn as flat bands (too small to read)
const FAR = 90;
const NEAR = -2.8;

/** Stable per-tile variation, tied to world position so tiles don't flicker. */
function hash(a: number, b: number): number {
  return (Math.imul(a, 73856093) ^ Math.imul(b + 17, 19349663)) >>> 0;
}

/**
 * Track GEOMETRY and drawing: the sandy ground and the 3-lane paved path, redrawn each
 * frame in perspective. This class knows only how to draw a straight run of path from
 * a distance; it does not decide where obstacles go (obstacles/Spawner) or where the
 * course turns (track/TrackPath). A future turn-capable renderer replaces this class.
 */
export class TrackRenderer {
  private readonly g: Phaser.GameObjects.Graphics;
  /** Hedge walls get their own layer above roadside palms (which stand behind them), still under the runner. */
  private readonly walls: Phaser.GameObjects.Graphics;
  private readonly sand: Phaser.GameObjects.Image;
  private readonly fog: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.sand = scene.add
      .image(0, HORIZON_Y, 'sandfield')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_W, GAME_H - HORIZON_Y + 80)
      .setDepth(DEPTH.sandfield);
    this.g = scene.add.graphics().setDepth(DEPTH.ground);
    this.walls = scene.add.graphics().setDepth(DEPTH.shadow - 5);
    this.fog = scene.add.image(0, HORIZON_Y - 24, 'fog').setOrigin(0, 0).setDisplaySize(GAME_W, 150).setDepth(DEPTH.fog);
  }

  draw(proj: CameraRig, distance: number): void {
    const top = HORIZON_Y + proj.lift;
    this.sand.y = top;
    this.fog.y = top - 30;

    const g = this.g;
    g.clear();
    const quad = (l0: number, l1: number, z0: number, z1: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillPoints([proj.project(l0, z0), proj.project(l1, z0), proj.project(l1, z1), proj.project(l0, z1)], true);
    };

    // Rows scroll toward the camera; each row's look comes from its world index.
    const offset = distance % SEG;
    const base = Math.floor(distance / SEG);
    for (let i = 0; ; i++) {
      const z0 = NEAR + i * SEG - offset;
      if (z0 > FAR) break;
      const z1 = z0 + SEG;
      const row = base + i;
      const h = hash(row, 0);

      // sandy shoulders
      quad(-1.8, -1.5, z0, z1, (row & 1) === 0 ? COLORS.sandA : COLORS.sandB);
      quad(1.5, 1.8, z0, z1, (row & 1) === 0 ? COLORS.sandB : COLORS.sandA);

      if (z0 > DETAIL_Z) {
        quad(-1.5, 1.5, z0, z1, COLORS.farPlank);
        continue;
      }

      quad(-1.5, 1.5, z0, z1, COLORS.gap);
      // Running bond: every other row is offset by half a tile.
      const shift = (row & 1) === 1 ? STONE_W / 2 : 0;
      const gapX = 0.035;
      const gapZ = 0.08;
      for (let k = -1; k < 6; k++) {
        const l0 = Math.max(-1.5, -1.5 + k * STONE_W + shift);
        const l1 = Math.min(1.5, -1.5 + (k + 1) * STONE_W + shift);
        if (l1 - l0 < 0.05) continue;
        const color = COLORS.planks[hash(row, k + 2) % COLORS.planks.length];
        quad(l0 + gapX, l1 - gapX, z0 + gapZ, z1 - gapZ, color);
      }

      // drifted sand creeping onto the path edges
      if (h % 3 === 0) quad(-1.5, -1.5 + 0.1 + (h % 7) * 0.02, z0 + 0.15, z1 - 0.1, COLORS.sandA);
      if ((h >> 3) % 3 === 0) quad(1.5 - 0.1 - ((h >> 5) % 7) * 0.02, 1.5, z0 + 0.1, z1 - 0.15, COLORS.sandA);
    }

    // Faint lane grooves keep the three lanes readable.
    for (const l of [-0.5, 0.5]) quad(l - 0.025, l + 0.025, NEAR, FAR, COLORS.laneLine, 0.3);

    // Foam edge where the paving meets the sand: a shaded lip on the path side, a bright edge on the sand side.
    for (const side of [-1, 1]) {
      quad(side * 1.46, side * 1.5, NEAR, FAR, COLORS.edgeShade, 0.6);
      quad(side * 1.5, side * 1.58, NEAR, FAR, COLORS.foam);
    }

    this.drawWalls(proj, distance);
  }

  /**
   * Hedge walls both sides on a low sandstone footing, drawn far → near so nearer hedge
   * overlaps farther. Heights come from each segment's world index, so the jagged
   * top edge is stable as it scrolls.
   */
  private drawWalls(proj: CameraRig, distance: number): void {
    const g = this.walls;
    g.clear();
    const fill = (pts: Array<{ x: number; y: number }>, color: number) => {
      g.fillStyle(color, 1);
      g.fillPoints(pts, true);
    };
    const rand = (k: number, salt: number) => (hash(k, salt) % 1000) / 1000;
    const hedgeH = (k: number) => WALL.minH + rand(k, 99) * (WALL.maxH - WALL.minH);
    const footH = (k: number) => WALL.footMin + rand(k, 7) * (WALL.footMax - WALL.footMin);

    const offset = distance % WALL.seg;
    const base = Math.floor(distance / WALL.seg);
    const count = Math.ceil((FAR - NEAR) / WALL.seg) + 1;
    for (let i = count; i >= 0; i--) {
      const z0 = NEAR + i * WALL.seg - offset;
      const z1 = z0 + WALL.seg;
      const zm = (z0 + z1) / 2;
      const k = base + i;
      const h0 = hedgeH(k);
      const h1 = hedgeH(k + 1);
      const r0 = footH(k);
      const r1 = footH(k + 1);
      const even = (k & 1) === 0;
      for (const side of [-1, 1]) {
        const x = side * WALL.inner;
        const outer = side * WALL.outer;
        const P = (z: number, e: number) => proj.project(x, z, e);
        // sandstone footing
        fill([P(z0, 0), P(z1, 0), P(z1, r1), P(z0, r0)], even ? COLORS.wallFace : COLORS.wallFaceShade);
        fill([P(z0, 0), P(z1, 0), P(z1, 0.05), P(z0, 0.05)], COLORS.wallBase);
        // hedge face
        fill([P(z0, r0), P(z1, r1), P(z1, h1), P(z0, h0)], even ? COLORS.hedgeA : COLORS.hedgeB);
        fill([P(z0, r0), P(z1, r1), P(z1, r1 + 0.03), P(z0, r0 + 0.03)], COLORS.hedgeSeam);
        // a vertical streak and a glint band near the top read as leafy highlights
        const s0 = zm - 0.18;
        const s1 = zm + 0.06;
        const top = (z: number) => h0 + ((h1 - h0) * (z - z0)) / WALL.seg;
        fill([P(s0, r0 + 0.08), P(s1, r1 + 0.08), P(s1, top(s1) - 0.12), P(s0, top(s0) - 0.18)], COLORS.hedgeStreak);
        fill([P(z0, h0 - 0.1), P(z1, h1 - 0.1), P(z1, h1), P(z0, h0)], COLORS.hedgeGlint);
        // flowering top
        fill([P(z0, h0), P(z1, h1), proj.project(outer, z1, h1 * 0.9), proj.project(outer, z0, h0 * 0.9)], COLORS.hedgeTop);
      }
    }
  }
}
