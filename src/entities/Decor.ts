import Phaser from 'phaser';
import { TrackEntity } from './TrackEntity';

export type DecorKind = 'palm' | 'youngPalm' | 'monstera' | 'fern' | 'hibiscus' | 'banana' | 'heliconia' | 'tikiTorch';

/** Painted sprites are large; these scales keep a foreground plant about a lane or two wide. */
const SCALE: Record<DecorKind, [number, number]> = {
  palm: [0.26, 0.4],
  youngPalm: [0.28, 0.42],
  monstera: [0.32, 0.5],
  fern: [0.28, 0.42],
  hibiscus: [0.38, 0.58],
  banana: [0.3, 0.46],
  heliconia: [0.28, 0.44],
  tikiTorch: [0.24, 0.34],
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
