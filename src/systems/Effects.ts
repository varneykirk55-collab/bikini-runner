import Phaser from 'phaser';
import { DEPTH, FONT, GAME_W, HORIZON_Y } from '../config';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/** Scene event Player emits on each foot plant: (x, y) = ground point under the runner. */
export const STRIDE_EVENT = 'player-stride';

/** Particle bursts, floating score text and ambient drifting petals. */
export class Effects {
  private readonly bursts = new Map<number, Emitter>();
  private readonly confettiBits: Emitter;
  private readonly sparks: Emitter;
  private readonly footPuffs: Emitter;

  constructor(private readonly scene: Phaser.Scene) {
    this.confettiBits = scene.add
      .particles(0, 0, 'confetti', {
        speed: { min: 160, max: 440 },
        angle: { min: 200, max: 340 },
        gravityY: 900,
        rotate: { min: 0, max: 360 },
        scale: { min: 0.8, max: 1.8 },
        lifespan: 900,
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(DEPTH.fx);

    this.sparks = scene.add
      .particles(0, 0, 'spark', {
        speed: { min: 60, max: 240 },
        lifespan: 700,
        scale: { start: 1.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xff7a59, 0xffd23f, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(DEPTH.fx);

    // Foot puffs: a couple of soft sand/spray specks kicked up on every stride.
    this.footPuffs = scene.add
      .particles(0, 0, 'petal', {
        speedX: { min: -35, max: 35 },
        speedY: { min: -55, max: -15 },
        gravityY: 160, // kicked up, then drifting back down toward the camera
        scale: { start: 1.6, end: 0.5 },
        alpha: { start: 0.75, end: 0 },
        tint: [0x2a2a2a, 0x5c4030],
        lifespan: { min: 280, max: 420 },
        emitting: false,
      })
      .setDepth(DEPTH.player + 1);
    const onStride = (x: number, y: number) => this.footPuffs.explode(Phaser.Math.Between(1, 2), x, y - 4);
    scene.events.on(STRIDE_EVENT, onStride);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(STRIDE_EVENT, onStride));

    scene.add
      .particles(0, 0, 'petal', {
        x: { min: -20, max: GAME_W + 20 },
        y: { min: HORIZON_Y + 8, max: HORIZON_Y + 80 },
        lifespan: 7000,
        speedY: { min: 50, max: 130 },
        speedX: { min: -25, max: 15 },
        scale: { min: 0.45, max: 1.1 },
        alpha: { min: 0.3, max: 0.7 },
        frequency: 260,
        advance: 4000,
      })
      .setDepth(DEPTH.fx - 1);
  }

  private burst(color: number): Emitter {
    let e = this.bursts.get(color);
    if (!e) {
      e = this.scene.add
        .particles(0, 0, 'spark', {
          speed: { min: 80, max: 280 },
          lifespan: { min: 300, max: 650 },
          scale: { start: 1.3, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: color,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false,
        })
        .setDepth(DEPTH.fx);
      this.bursts.set(color, e);
    }
    return e;
  }

  collect(x: number, y: number, color: number, big = false): void {
    this.burst(color).explode(big ? 34 : 14, x, y);
  }

  crash(x: number, y: number): void {
    this.confettiBits.explode(22, x, y);
    this.sparks.explode(26, x, y);
  }

  smash(x: number, y: number): void {
    this.confettiBits.explode(26, x, y);
    this.burst(0xc79bff).explode(30, x, y);
  }

  floatText(x: number, y: number, text: string, color: string, size = 26): void {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: '900',
        color,
        stroke: '#0b2a3a',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.fx + 1);
    this.scene.tweens.add({
      targets: t,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
