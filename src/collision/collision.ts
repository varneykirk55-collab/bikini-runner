import { PLAYER } from '../config';
import { ObstacleDef } from '../types';

/** Vertical extent [bottom, top] in units above the ground. */
export type Span = [number, number];

export interface ObstacleBody {
  lane: number;
  z: number;
  /** z on the previous frame: collisions test the swept interval so nothing tunnels at high speed. */
  prevZ: number;
  def: Pick<ObstacleDef, 'hitDepth' | 'span'>;
}

export interface PickupBody {
  lane: number;
  z: number;
  prevZ: number;
  elev: number;
}

/**
 * Obstacle hit test, extracted unchanged from Valhalla Run's GameScene.checkObstacles.
 * Pure function of numbers: no Phaser, no track shape. `lane` is the lateral offset
 * relative to the path and `z` the distance ahead along it, so a future winding
 * track only has to feed path-relative coordinates in.
 */
export function hitsObstacle(playerX: number, playerSpan: Span, o: ObstacleBody): boolean {
  const [lo, hi] = playerSpan;
  const d = o.def.hitDepth;
  if (o.z > d || o.prevZ < -d) return false; // swept z overlap
  if (Math.abs(o.lane - playerX) > PLAYER.laneHitRadius) return false;
  if (hi <= o.def.span[0] || lo >= o.def.span[1]) return false;
  return true;
}

/** Pickup overlap test, extracted unchanged from GameScene.collectRunes. */
export function touchesPickup(playerX: number, playerSpan: Span, p: PickupBody): boolean {
  const [lo, hi] = playerSpan;
  if (p.z > 0.7 || p.prevZ < -0.7) return false; // swept z overlap
  if (Math.abs(p.lane - playerX) > 0.6) return false;
  if (p.elev < lo - 0.35 || p.elev > hi + 0.45) return false;
  return true;
}
