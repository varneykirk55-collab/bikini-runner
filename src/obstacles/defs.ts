import { ObstacleDef, ObstacleKind } from '../types';

/**
 * Obstacle table. Hitboxes, approach speeds and avoid rules are carried over
 * unchanged from Valhalla Run (rock→sandcastle, spikes→urchin, fallenTree→limboPole,
 * raven→seagull, draugr→crab) so the gameplay is identical; only the art differs.
 * Phaser-free on purpose: difficulty and collision tests import this directly.
 */
export const OBSTACLES: Record<ObstacleKind, ObstacleDef> = {
  sandcastle: { frames: ['sandcastle'], frameRate: 0, elev: 0, originY: 1, span: [0, 0.6], hitDepth: 0.45, approach: 0, avoid: 'jump' },
  urchin: { frames: ['urchin'], frameRate: 0, elev: 0, originY: 1, span: [0, 0.55], hitDepth: 0.4, approach: 0, avoid: 'jump' },
  // A banner strung between two posts: slide under it.
  limboPole: { frames: ['limboPole'], frameRate: 0, elev: 0, originY: 1, span: [0.55, 1.1], hitDepth: 0.45, approach: 0, avoid: 'slide' },
  // Feet sit above the road; the painted macaw's body fills the slide span.
  seagull: { frames: ['seagull0', 'seagull1'], frameRate: 7, elev: 0.78, originY: 1, span: [0.75, 1.35], hitDepth: 0.4, approach: 4, avoid: 'slide' },
  // Two-frame shuffle, alternating slowly.
  crab: { frames: ['crab', 'crab1'], frameRate: 3.5, elev: 0, originY: 1, span: [0, 1.3], hitDepth: 0.4, approach: 2.5, avoid: 'lane' },
};
