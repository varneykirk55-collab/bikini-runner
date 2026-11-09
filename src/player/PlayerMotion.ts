import { PLAYER, SPEED } from '../config';
import { Span } from '../collision/collision';
import { Pose, RUNNER } from './animation';

/** Side effects the motion model raises (sound, particles). All optional. */
export interface MotionEvents {
  onLane?: (dir: -1 | 1) => void;
  onJump?: () => void;
  onLand?: () => void;
  onSlide?: () => void;
}

/**
 * Player movement and animation selection with no rendering and no Phaser.
 *
 * Extracted from Valhalla Run's Player with identical formulas: three-lane
 * switching, jump physics, slide timer, queued slam-slide, flight, invulnerability,
 * and the run/jump/slide frame choice. `Player` (the Phaser object) feeds it
 * `update(dt, speed)` and draws whatever `pose()` returns.
 */
export class PlayerMotion {
  /** Target lane (-1, 0, 1) and the smoothed lateral position used for rendering and hits. */
  lane = 0;
  x = 0;
  /** Height of the feet above ground (units) and vertical velocity. */
  h = 0;
  vh = 0;
  airborne = false;
  alive = true;
  invuln = 0;
  /** Flight power-up: cruising above every obstacle. */
  flying = false;

  private slideTimer = 0;
  private slideQueued = false;
  /** Phase clock for decorations (flight flap, shield pulse). */
  private _runClock = 0;
  /** Seconds of run-cycle playback, scaled with forward speed. */
  private animTime = 0;
  /** Seconds since leaving the ground. Drives the jump sheet. */
  private jumpTime = 0;

  constructor(private readonly events: MotionEvents = {}) {}

  get sliding(): boolean {
    return this.slideTimer > 0;
  }

  get runClock(): number {
    return this._runClock;
  }

  /** Half-cycle index of the run; a change means a foot just planted. */
  get stride(): number {
    return Math.floor((this.animTime / RUNNER.runCycle) * 2);
  }

  moveLeft(): void {
    if (this.lane > -1) {
      this.lane--;
      this.events.onLane?.(-1);
    }
  }

  moveRight(): void {
    if (this.lane < 1) {
      this.lane++;
      this.events.onLane?.(1);
    }
  }

  jump(): void {
    if (this.airborne) return;
    this.airborne = true;
    this.vh = PLAYER.jumpVelocity;
    this.jumpTime = 0;
    this.slideTimer = 0;
    this.slideQueued = false;
    this.events.onJump?.();
  }

  /** Start or end flight. Ending drops the runner back down with a short grace period. */
  setFlying(on: boolean): void {
    if (on === this.flying || !this.alive) return;
    this.flying = on;
    if (on) {
      this.airborne = true;
      this.vh = 0;
      this.slideTimer = 0;
      this.slideQueued = false;
      this.events.onJump?.(); // take-off
    } else {
      this.vh = 0;
      this.invuln = Math.max(this.invuln, PLAYER.flightLandingGrace);
    }
  }

  /** On the ground: slide. In the air: slam down and slide on landing. */
  slide(): void {
    if (this.flying) return;
    if (this.airborne) {
      this.vh = Math.min(this.vh, PLAYER.fastFallVelocity);
      this.slideQueued = true;
    } else {
      if (!this.sliding) this.events.onSlide?.(); // not on re-swipe mid-slide
      this.slideTimer = PLAYER.slideTime;
    }
  }

  update(dt: number, speed: number): void {
    this.x += (this.lane - this.x) * Math.min(1, dt * PLAYER.laneSpeed);
    if (Math.abs(this.lane - this.x) < 0.002) this.x = this.lane;

    if (this.flying) {
      this.h += (PLAYER.flightHeight - this.h) * Math.min(1, dt * PLAYER.flightClimb);
    } else if (this.airborne) {
      this.vh -= PLAYER.gravity * dt;
      this.h += this.vh * dt;
      if (this.h <= 0) {
        this.h = 0;
        this.vh = 0;
        this.airborne = false;
        this.events.onLand?.();
        if (this.slideQueued) {
          this.slideQueued = false;
          this.slideTimer = PLAYER.slideTime;
          this.events.onSlide?.(); // queued slam-slide
        }
      }
    }
    if (this.slideTimer > 0) this.slideTimer -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    const rate = speed / SPEED.start;
    this._runClock += dt * 9 * rate;
    this.animTime += dt * rate;
    if (this.airborne) this.jumpTime += dt;
    else this.jumpTime = 0;
  }

  /** Which sheet and frame to show. Jump playback follows airtime, not the clip's own hop. */
  pose(): Pose {
    if (this.flying) return { key: 'jump', frame: Math.floor(RUNNER.jumpFrames / 2) };
    if (this.airborne) {
      const airtime = (2 * PLAYER.jumpVelocity) / PLAYER.gravity;
      let u = Math.min(0.999, this.jumpTime / airtime);
      if (this.vh < 0) u = Math.max(u, 0.5);
      return { key: 'jump', frame: Math.min(RUNNER.jumpFrames - 1, Math.floor(u * RUNNER.jumpFrames)) };
    }
    if (this.sliding) {
      // Play the 8-frame slide once across the slide window.
      const u = 1 - this.slideTimer / PLAYER.slideTime;
      const frame = Math.min(RUNNER.slideFrames - 1, Math.max(0, Math.floor(u * RUNNER.slideFrames)));
      return { key: 'slide', frame };
    }
    const frame = Math.floor((this.animTime / RUNNER.runCycle) * RUNNER.runFrames) % RUNNER.runFrames;
    return { key: 'run', frame };
  }

  /** Vertical hitbox [bottom, top] in units. */
  span(): Span {
    return [this.h, this.h + (this.sliding ? PLAYER.slideHeight : PLAYER.standHeight)];
  }
}
