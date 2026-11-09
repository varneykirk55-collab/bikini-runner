import { FOCAL, GAME_W, GROUND_Y, HORIZON_Y, LANE_PX, UNIT_PX } from '../config';

export interface Projected {
  x: number;
  y: number;
  /** Perspective scale: 1 at the player, → 0 at the horizon. */
  s: number;
}

/**
 * Camera following and orientation. Maps path-relative world space (lane,
 * z = distance ahead, elev = height) to the screen.
 *
 * The "camera" is two smoothed offsets: camX follows the player's lane, lift rises
 * a little when the player jumps. `heading` is RESERVED for the Temple Run-style
 * expansion: the direction of travel in radians (see track/TrackPath). It is
 * always 0 today and nothing reads it yet; a future turn-capable camera will
 * rotate the view by it. Keeping the camera behind its own interface means
 * track geometry and obstacle placement never touch camera maths.
 */
export class CameraRig {
  camX = 0;
  lift = 0;
  /** Reserved: direction of travel (radians). Always 0 until turns exist. */
  heading = 0;

  scale(z: number): number {
    return FOCAL / (FOCAL + Math.max(z, -FOCAL + 0.6));
  }

  project(lane: number, z: number, elev = 0): Projected {
    const s = this.scale(z);
    return {
      x: GAME_W / 2 + (lane - this.camX) * LANE_PX * s,
      y: HORIZON_Y + (GROUND_Y - HORIZON_Y) * s - elev * UNIT_PX * s + this.lift,
      s,
    };
  }

  /** Smoothly track the player. Call once per frame. */
  follow(playerX: number, playerH: number, dt: number): void {
    this.camX += (playerX * 0.7 - this.camX) * Math.min(1, dt * 6);
    // Capped so flight (cruising high) lifts the view like a big jump, not further.
    this.lift += (Math.min(playerH, 1.5) * UNIT_PX * 0.22 - this.lift) * Math.min(1, dt * 5);
  }
}
