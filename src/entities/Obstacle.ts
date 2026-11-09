import Phaser from 'phaser';
import { sfx } from '../audio/Sfx';
import { CameraRig } from '../camera/CameraRig';
import { OBSTACLES } from '../obstacles/defs';
import { ObstacleDef, ObstacleKind } from '../types';
import { TrackEntity } from './TrackEntity';

// Re-exported so existing imports of the table keep working.
export { OBSTACLES };

/** View + per-frame behaviour for one obstacle. Hit rules live in collision/ and obstacles/defs. */
export class Obstacle extends TrackEntity {
  readonly kind: ObstacleKind;
  readonly def: ObstacleDef;
  /** Already resolved against the player (hit or smashed): never test again. */
  hit = false;
  private frame = 0;
  /** The crab clicks once per approach. */
  private alerted = false;

  constructor(scene: Phaser.Scene, kind: ObstacleKind, lane: number, z: number) {
    super(scene, OBSTACLES[kind].frames[0], lane, z, OBSTACLES[kind].elev, OBSTACLES[kind].originY);
    this.kind = kind;
    this.def = OBSTACLES[kind];
    this.approach = this.def.approach;
    this.t = Math.random() * 2;
  }

  update(dt: number, speed: number): void {
    super.update(dt, speed);
    // SFX: creature proximity cue, once, when it closes within ~4.5 units (only runs while alive).
    // The recipe is Valhalla's synthesised growl, kept as a PLACEHOLDER sound for the crab.
    if (this.kind === 'crab' && !this.alerted && !this.hit && this.z < 4.5 && this.z > 0) {
      this.alerted = true;
      sfx(this.sprite.scene).growl();
    }
  }

  render(proj: CameraRig): void {
    const { frames, frameRate } = this.def;
    if (frames.length > 1) {
      const f = Math.floor(this.t * frameRate) % frames.length;
      if (f !== this.frame) {
        this.frame = f;
        this.sprite.setTexture(frames[f]);
      }
    }

    let bob = 0;
    if (this.kind === 'seagull') bob = Math.sin(this.t * 5) * 0.06;
    if (this.kind === 'crab') {
      bob = Math.abs(Math.sin(this.t * 7)) * 0.03;
      this.sprite.setRotation(Math.sin(this.t * 3.5) * 0.02);
    }
    super.render(proj, bob);
  }
}
