import Phaser from 'phaser';
import { sfx } from '../audio/Sfx';
import { CameraRig } from '../camera/CameraRig';
import { DEPTH } from '../config';
import { Span } from '../collision/collision';
import { STRIDE_EVENT } from '../systems/Effects';
import { IDLE_KEY, RUNNER, SHEET_KEYS } from './animation';
import { PlayerMotion } from './PlayerMotion';

/**
 * The runner on screen: a Phaser view over `PlayerMotion`. Movement, physics and
 * animation selection live in PlayerMotion; this class only draws what it says.
 * Public surface matches Valhalla Run's Player so GameScene logic is unchanged.
 */
export class Player {
  readonly motion: PlayerMotion;
  private lastStride = -1;
  /** While set, render keeps the standing frame (grounded pause). Cleared on resume. */
  private holdStanding = false;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly aura: Phaser.GameObjects.Image;
  private readonly canopy: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene) {
    this.motion = new PlayerMotion({
      onLane: (dir) => sfx(scene).lane(dir), // SFX: lane change
      onJump: () => sfx(scene).jump(), // SFX: jump / take-off
      onLand: () => sfx(scene).land(), // SFX: land
      onSlide: () => sfx(scene).slide(), // SFX: slide start
    });
    this.shadow = scene.add.image(0, 0, 'shadow').setDepth(DEPTH.shadow);
    this.aura = scene.add
      .image(0, 0, 'aura')
      .setDepth(DEPTH.aura)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0x7fe8ff)
      .setVisible(false);
    this.canopy = scene.add.image(0, 0, 'parasail').setDepth(DEPTH.player - 0.5).setVisible(false);
    this.sprite = scene.add
      .image(0, 0, SHEET_KEYS.run, 0)
      .setOrigin(RUNNER.originX, RUNNER.originY)
      .setScale(RUNNER.scale)
      .setDepth(DEPTH.player);
  }

  // ---- Motion facade ---------------------------------------------------------
  get x(): number {
    return this.motion.x;
  }
  get h(): number {
    return this.motion.h;
  }
  get invuln(): number {
    return this.motion.invuln;
  }
  set invuln(v: number) {
    this.motion.invuln = v;
  }
  get sliding(): boolean {
    return this.motion.sliding;
  }
  moveLeft(): void {
    this.motion.moveLeft();
  }
  moveRight(): void {
    this.motion.moveRight();
  }
  jump(): void {
    this.motion.jump();
  }
  slide(): void {
    this.motion.slide();
  }
  setFlying(on: boolean): void {
    this.motion.setFlying(on);
  }
  update(dt: number, speed: number): void {
    this.motion.update(dt, speed);
  }
  span(): Span {
    return this.motion.span();
  }

  /**
   * Stand still. Used when a pause catches her with her feet on the ground.
   * Airborne and slide poses are left alone: a stand would float or pop her upright.
   * Applied immediately, and again from render(), because this frame's update can
   * still run after the key or pointer that paused the scene.
   */
  holdForPause(): void {
    const m = this.motion;
    if (!m.alive || m.airborne || m.sliding || m.h > 0.02) return;
    this.holdStanding = true;
    this.showIdleFrame();
    this.sprite.setScale(RUNNER.scale).setRotation(0);
  }

  releaseHold(): void {
    this.holdStanding = false;
  }

  // ---- View ---------------------------------------------------------------------
  render(proj: CameraRig, shieldOn: boolean): void {
    const m = this.motion;
    const ground = proj.project(m.x, 0, 0);
    this.shadow
      .setPosition(ground.x, ground.y)
      .setScale(Math.max(0.45, 1 - m.h * 0.3))
      .setAlpha(Math.max(0.15, 0.6 - m.h * 0.2));

    if (!m.alive) return; // crash tween owns the sprite now

    // Foot puffs: emit once per foot plant (two per run cycle), only while running on the ground.
    const stride = m.stride;
    if (stride !== this.lastStride) {
      this.lastStride = stride;
      if (!this.holdStanding && !m.airborne && !m.sliding) this.scene.events.emit(STRIDE_EVENT, ground.x, ground.y);
    }

    const p = proj.project(m.x, 0, m.h);
    if (this.holdStanding) {
      this.showIdleFrame();
    } else {
      const pose = m.pose();
      const key = SHEET_KEYS[pose.key];
      const frameName = String(pose.frame);
      if (this.sprite.texture.key !== key || this.sprite.frame.name !== frameName) {
        this.sprite.setTexture(key, pose.frame);
      }
    }

    // The baked run already bounces. Keep the feet planted on the ground anchor.
    // Slide uses the same scale as run: every sheet was baked with one camera.
    // Full brightness unless the post-hit blink is on. No tint and no additive blend.
    const blinking = m.invuln > 0 && Math.floor(m.invuln * 20) % 2 === 0;
    this.sprite
      .setPosition(p.x, p.y)
      .setRotation(this.holdStanding ? 0 : (m.lane - m.x) * 0.25)
      .setScale(this.holdStanding ? RUNNER.scale : m.sliding ? RUNNER.slideScale : RUNNER.scale)
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setAlpha(blinking ? 0.35 : 1);
    if (!blinking) this.sprite.clearTint();

    this.canopy.setVisible(m.flying);
    if (m.flying) {
      const body = this.sprite.displayHeight * this.sprite.originY;
      const flap = 1 + Math.sin(m.runClock * 0.9) * 0.18;
      this.canopy.setPosition(p.x, p.y - body * 1.05).setScale(1.4, 1.4 * flap);
    }

    this.aura.setVisible(shieldOn);
    if (shieldOn) {
      const pulse = 1.05 + Math.sin(m.runClock * 0.8) * 0.06;
      const body = this.sprite.displayHeight * this.sprite.originY;
      this.aura.setPosition(p.x, p.y - body * (m.sliding ? 0.32 : 0.5)).setScale(pulse * (m.sliding ? 0.82 : 1));
    }
  }

  /** Death animation: standing pose, knocked back and tumbling. */
  crash(): { x: number; y: number } {
    this.holdStanding = false;
    this.motion.alive = false;
    this.aura.setVisible(false);
    this.canopy.setVisible(false);
    this.showIdleFrame();
    this.sprite.setScale(RUNNER.scale).setRotation(0).setTint(0xff9a8a).setAlpha(1);
    const x = this.sprite.x;
    const y = this.sprite.y;
    this.scene.tweens.add({
      targets: this.sprite,
      angle: Phaser.Math.Between(0, 1) ? 82 : -82,
      y: y + 18,
      duration: 480,
      ease: 'Quad.easeOut',
    });
    return { x, y: y - 50 };
  }

  private showIdleFrame(): void {
    if (this.sprite.texture.key !== IDLE_KEY) {
      this.sprite.setTexture(IDLE_KEY).setOrigin(RUNNER.originX, RUNNER.originY);
    }
  }
}
