/**
 * The shape of the course, as a function of distance travelled.
 *
 * Today's game runs on a straight path, but nothing outside this file should
 * assume that. Spawning, scoring and difficulty all work in *distance along the
 * path* (arc length); obstacle and pickup positions are path-relative (lane,
 * distance ahead). A future Temple Run-style track implements `TrackPath` with
 * turns and junctions, and the camera reads `headingAt` to rotate with it.
 *
 * Reserved for that expansion and deliberately NOT implemented now: turns,
 * junctions, procedural segments.
 */
export interface PathSample {
  /** Arc length along the path (metres). */
  distance: number;
  /** Direction of travel in radians. 0 = straight ahead of the original start. */
  heading: number;
  /** World-plane position at this distance (x lateral, z forward). */
  x: number;
  z: number;
}

export interface UpcomingTurn {
  direction: 'left' | 'right';
  /** Arc length at which the corner begins. */
  at: number;
}

export interface TrackPath {
  readonly kind: string;
  sample(distance: number): PathSample;
  headingAt(distance: number): number;
  /** The next turn within `lookahead` metres of `distance`, or null. */
  turnAhead(distance: number, lookahead: number): UpcomingTurn | null;
}

/** The only path implemented in Phase 1: a straight line. */
export class StraightPath implements TrackPath {
  readonly kind = 'straight';

  sample(distance: number): PathSample {
    return { distance, heading: 0, x: 0, z: distance };
  }

  headingAt(_distance: number): number {
    return 0;
  }

  turnAhead(_distance: number, _lookahead: number): UpcomingTurn | null {
    return null;
  }
}
