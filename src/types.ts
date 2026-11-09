export type Lane = -1 | 0 | 1;

/** Beach-themed obstacle kinds. How each is passed is data (obstacles/defs.ts), not code. */
export type ObstacleKind = 'sandcastle' | 'urchin' | 'limboPole' | 'seagull' | 'crab';

export type PowerKind = 'shield' | 'magnet' | 'double' | 'flight';

export type PickupKind = 'basic' | PowerKind;

/** How the player gets past an obstacle. */
export type Avoid = 'jump' | 'slide' | 'lane';

export interface ObstacleDef {
  frames: string[];
  frameRate: number;
  /** Elevation of the sprite anchor (units). */
  elev: number;
  /** Sprite origin y: 1 = feet on the ground, 0.5 = centred. */
  originY: number;
  /** Vertical hitbox [bottom, top] in units above ground. */
  span: [number, number];
  /** Half-depth of the hitbox along z. */
  hitDepth: number;
  /** Extra speed toward the player (creatures charge at you). */
  approach: number;
  avoid: Avoid;
}

export interface RunResult {
  score: number;
  distance: number;
  pickups: number;
  best: number;
  newBest: boolean;
}
