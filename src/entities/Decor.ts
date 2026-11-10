import Phaser from 'phaser';
import { TrackEntity } from './TrackEntity';

export type DecorKind = 'palm' | 'monstera' | 'fern' | 'hibiscus' | 'tikiTorch';

const SCALE: Record<DecorKind, [number, number]> = {
  palm: [0.95, 1.45],
  monstera: [1.15, 1.85],
  fern: [0.85, 1.25],
  hibiscus: [0.95, 1.45],
  tikiTorch: [0.9, 1.15],
};

/** Non-colliding roadside jungle. The same plants repeat for the whole run. */
export class Decor extends TrackEntity {
  constructor(scene: Phaser.Scene, kind: DecorKind, laneX: number, z: number) {
    super(scene, kind, laneX, z, 0, 1);
    const [lo, hi] = SCALE[kind];
    this.baseScale = Phaser.Math.FloatBetween(lo, hi);
    if (Math.random() < 0.5) this.sprite.setFlipX(true);
  }
}
