import Phaser from 'phaser';
import { Music } from '../audio/Music';
import { DEPTH, GAME_W } from '../config';
import { IDLE_KEY, RUNNER } from '../player/animation';
import { sfx } from '../audio/Sfx';
import { Decor } from '../entities/Decor';
import { PICKUP_COLORS } from '../gfx/props';
import { Background } from '../systems/Background';
import { POWER_LABELS } from '../systems/PowerUps';
import { CameraRig } from '../camera/CameraRig';
import { loadBest } from '../systems/Storage';
import { TrackRenderer } from '../track/TrackRenderer';
import { iconTexture, logoTexture } from '../gfx/ui';
import { HudPill, Modal, UiButton } from '../ui/components';
import { UI, formatNumber, sunFill, uiText } from '../ui/theme';

export class MenuScene extends Phaser.Scene {
  private proj!: CameraRig;
  private background!: Background;
  private track!: TrackRenderer;
  private hero!: Phaser.GameObjects.Image;
  private decor: Decor[] = [];
  private drift = 0;
  /** The open Settings / How to Play panel, if any. */
  private modal?: Modal;
  private starting = false;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.starting = false;
    this.drift = 0;
    this.modal = undefined;
    this.proj = new CameraRig();
    this.background = new Background(this);
    this.track = new TrackRenderer(this);
    this.decor = [];
    for (let z = 2; z < 70; z += 3.2) {
      this.decor.push(new Decor(this, 'palm', (z % 2 > 1 ? -1 : 1) * Phaser.Math.FloatBetween(2.3, 4), z));
    }

    const ground = this.proj.project(0, 0, 0);
    this.add.image(ground.x, ground.y, 'shadow').setDepth(DEPTH.shadow).setAlpha(0.55);
    this.hero = this.add
      .image(ground.x, ground.y, IDLE_KEY)
      .setOrigin(RUNNER.originX, RUNNER.originY)
      .setScale(RUNNER.scale)
      .setDepth(DEPTH.player);

    // Tint the top so the logo reads over the bright sky.
    const shade = this.add.graphics().setDepth(DEPTH.hud - 1);
    shade.fillGradientStyle(0x03283f, 0x03283f, 0x03283f, 0x03283f, 0.55, 0.55, 0, 0);
    shade.fillRect(0, 0, GAME_W, 380);

    this.buildLogo();
    this.buildMenu();

    // Music (merged from the music branch): pointerdown is a user gesture, so the
    // title theme can start; the RUN tap then switches to the run playlist.
    this.input.on('pointerdown', () => {
      if (!this.starting) Music.of(this).playMenu();
    });

    // Keyboard: Space / Enter start the run (ignored while a panel is open).
    const keyStart = () => !this.modal && this.begin();
    this.input.keyboard?.on('keydown-SPACE', keyStart);
    this.input.keyboard?.on('keydown-ENTER', keyStart);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-SPACE', keyStart);
      this.input.keyboard?.off('keydown-ENTER', keyStart);
    });
  }

  // ---- Menu UI (PLACEHOLDER art) -------------------------------------------------

  /** Sunset badge with the BIKINI RUNNER wordmark (placeholder logo); floats gently, side glows pulse. */
  private buildLogo(): void {
    const cx = GAME_W / 2;
    const plate = this.add.image(0, 0, logoTexture(this)).setOrigin(0.5, 0);
    const word = sunFill(uiText(this, 0, 138, 'BIKINI', 72, { stroke: '#7a2a10', strokeThickness: 10 }).setOrigin(0.5));
    const run = sunFill(uiText(this, 0, 208, 'RUNNER', 64, { stroke: '#7a2a10', strokeThickness: 10 }).setOrigin(0.5));
    const tag = uiText(this, 0, 262, 'PLACEHOLDER ART', 18, { color: UI.sunLight, stroke: '#7a2a10', strokeThickness: 4 }).setOrigin(0.5);
    const glows = [-1, 1].map((side) =>
      this.add
        .image(side * 131, 178, 'spark')
        .setDisplaySize(64, 90)
        .setTint(0xfff0a0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.25),
    );
    const logo = this.add.container(cx, 26, [...glows, plate, word, run, tag]).setDepth(DEPTH.hud);
    this.tweens.add({ targets: glows, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: logo, y: 32, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private buildMenu(): void {
    const cx = GAME_W / 2;
    const best = loadBest();
    const star = this.add.image(0, 0, iconTexture(this, 'star', 34));
    const bestPill = new HudPill(this, cx, 362, 250, star, UI.sun).setDepth(DEPTH.hud);
    bestPill.value.setText(best > 0 ? `BEST ${formatNumber(best)}` : 'BEST —');

    new UiButton(this, cx, 454, {
      variant: 'primary',
      width: 380,
      height: 100,
      label: 'RUN',
      fontSize: 54,
      sound: 'none', // begin() plays the confirm
      pulse: true,
      onClick: () => this.begin(),
    }).setDepth(DEPTH.hud);

    new UiButton(this, cx, 550, {
      variant: 'secondary',
      width: 330,
      height: 72,
      label: 'SETTINGS',
      icon: 'gear',
      onClick: () => this.openSettings(),
    }).setDepth(DEPTH.hud);

    new UiButton(this, cx, 634, {
      variant: 'secondary',
      width: 330,
      height: 72,
      label: 'HOW TO PLAY',
      icon: 'book',
      onClick: () => this.openHowTo(),
    }).setDepth(DEPTH.hud);
  }

  private openSettings(): void {
    if (this.modal) return;
    const H = 400;
    const top = -H / 2;
    const modal = new Modal(this, { title: 'SETTINGS', width: 420, height: H, depth: DEPTH.overlay, onClose: () => (this.modal = undefined) });
    const soundLabel = () => (sfx(this).muted ? 'SOUND: OFF' : 'SOUND: ON');
    const sound = new UiButton(this, 0, top + 180, {
      variant: 'secondary',
      width: 300,
      height: 70,
      label: soundLabel(),
      icon: sfx(this).muted ? 'soundOff' : 'soundOn',
      onClick: () => {
        sfx(this).toggleMute();
        sound.setLabel(soundLabel()).setIcon(sfx(this).muted ? 'soundOff' : 'soundOn');
      },
    });
    const hint = uiText(this, 0, top + 250, 'Desktop: press M to mute', 18, { color: UI.muted }).setOrigin(0.5);
    const done = new UiButton(this, 0, top + 326, {
      variant: 'primary',
      width: 240,
      height: 76,
      label: 'DONE',
      sound: 'confirm',
      onClick: () => modal.close(),
    });
    modal.add(sound, hint, done);
    this.modal = modal;
  }

  private openHowTo(): void {
    if (this.modal) return;
    const H = 720;
    const top = -H / 2;
    const modal = new Modal(this, { title: 'HOW TO PLAY', width: 470, height: H, depth: DEPTH.overlay, onClose: () => (this.modal = undefined) });
    const left = -190;
    const label = (y: number, str: string) => uiText(this, left, top + y, str, 20, { color: UI.sun, align: 'left' }).setOrigin(0, 0.5);
    const line = (y: number, str: string, color: string = UI.white, size = 19) =>
      uiText(this, left, top + y, str, size, { color, align: 'left', strokeThickness: 3 }).setOrigin(0, 0.5);

    const items: Phaser.GameObjects.GameObject[] = [
      label(136, 'CONTROLS'),
      line(168, 'Swipe left / right: change lane'),
      line(196, 'Swipe up: jump   ·   Swipe down: slide'),
      line(224, 'Keys: arrows / WASD / space   ·   Esc: pause', UI.muted, 16),
      label(268, 'DANGERS'),
      line(300, 'Jump over sandcastles and sea urchins'),
      line(328, 'Slide under limbo banners and seagulls'),
      line(356, 'Change lane to dodge giant crabs'),
      label(400, 'PICKUPS'),
    ];
    const pickups: Array<[string, string, string]> = [
      ['pickup_star_a', 'Star: +10 score', PICKUP_COLORS.basic],
      ['pickup_shield', `${POWER_LABELS.shield}: blocks one hit`, PICKUP_COLORS.shield],
      ['pickup_magnet', `${POWER_LABELS.magnet}: pulls stars in`, PICKUP_COLORS.magnet],
      ['pickup_double', POWER_LABELS.double, PICKUP_COLORS.double],
      ['pickup_flight', `${POWER_LABELS.flight}: soar over everything`, PICKUP_COLORS.flight],
    ];
    pickups.forEach(([key, text, color], i) => {
      const y = 440 + i * 42;
      items.push(this.add.image(left + 20, top + y, key).setScale(0.45));
      items.push(line(y, text, color, 19).setX(left + 50));
    });
    items.push(
      new UiButton(this, 0, top + 660, {
        variant: 'primary',
        width: 240,
        height: 76,
        label: 'GOT IT',
        sound: 'confirm',
        onClick: () => modal.close(),
      }),
    );
    modal.add(...items);
    this.modal = modal;
  }

  private begin(): void {
    if (this.starting) return;
    this.starting = true;
    sfx(this).uiConfirm();
    Music.of(this).playRun();
    this.cameras.main.fadeOut(260, 6, 46, 70);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Game'));
  }

  update(_t: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;
    // The beach keeps scrolling; she holds the standing pose.
    this.drift += dt * 5;
    for (const d of this.decor) {
      d.update(dt, 5);
      if (d.z < -3) d.z += 70;
      d.render(this.proj);
    }
    this.background.update(dt, this.proj, 3);
    this.track.draw(this.proj, this.drift);
    // She waits in the standing pose. The track drift above keeps the beach moving.
  }
}
