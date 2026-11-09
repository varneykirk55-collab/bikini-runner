import Phaser from 'phaser';
import { CameraRig } from '../camera/CameraRig';
import { PICKUP_COLORS } from '../gfx/props';
import { PickupKind } from '../types';
import { TrackEntity } from './TrackEntity';

const BASIC_TEXTURES = ['pickup_star_a', 'pickup_star_b', 'pickup_star_c'];

export function pickupTexture(kind: PickupKind): string {
  return kind === 'basic' ? Phaser.Utils.Array.GetRandom(BASIC_TEXTURES) : `pickup_${kind}`;
}

export function pickupColor(kind: PickupKind): number {
  return Phaser.Display.Color.HexStringToColor(PICKUP_COLORS[kind]).color;
}

/** A collectible: basic score star, or one of the four power-ups. */
export class Pickup extends TrackEntity {
  readonly kind: PickupKind;
  collected = false;
  private phase = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, kind: PickupKind, lane: number, z: number, elev: number) {
    super(scene, pickupTexture(kind), lane, z, elev, 0.5);
    this.kind = kind;
    this.baseScale = kind === 'basic' ? 0.8 : 1;
  }

  render(proj: CameraRig): void {
    // Spin like a coin and float gently.
    const spin = Math.max(0.3, Math.abs(Math.cos(this.t * 3 + this.phase)));
    super.render(proj, Math.sin(this.t * 4 + this.phase) * 0.05, spin);
  }
}
