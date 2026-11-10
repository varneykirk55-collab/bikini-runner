import Phaser from 'phaser';
import { Music } from '../audio/Music';
import { sfx } from '../audio/Sfx';
import { UiButton, Modal } from '../ui/components';

/** Registry key: loop time of the last resume, so the same key press can't re-pause instantly. */
export const RESUMED_AT = 'resumedAt';

/**
 * Overlay launched on top of the paused Game scene. RESUME returns to the run,
 * SOUND toggles SFX, MAIN MENU abandons the run. Esc / P also resume.
 */
export class PauseScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('Pause');
  }

  create(): void {
    this.leaving = false;
    const modal = new Modal(this, { title: 'PAUSED', width: 420, height: 470, depth: 10 });
    const top = -470 / 2;

    const resume = new UiButton(this, 0, top + 190, {
      variant: 'primary',
      width: 330,
      height: 88,
      label: 'RESUME',
      sound: 'confirm',
      pulse: true,
      onClick: () => this.resume(),
    });
    const syncSound = () => {
      sound.setLabel(this.soundLabel()).setIcon(sfx(this).muted ? 'soundOff' : 'soundOn');
    };
    const sound = new UiButton(this, 0, top + 292, {
      variant: 'secondary',
      width: 290,
      height: 68,
      label: this.soundLabel(),
      icon: sfx(this).muted ? 'soundOff' : 'soundOn',
      onClick: () => {
        sfx(this).toggleMute();
        syncSound();
      },
    });
    const menu = new UiButton(this, 0, top + 384, {
      variant: 'secondary',
      width: 290,
      height: 68,
      label: 'MAIN MENU',
      icon: 'home',
      onClick: () => this.toMenu(),
    });
    modal.add(resume, sound, menu);

    const keyResume = () => {
      sfx(this).uiConfirm(); // SFX: UI confirm (resume via keyboard)
      this.resume();
    };
    this.game.sound.on(Phaser.Sound.Events.GLOBAL_MUTE, syncSound);
    this.input.keyboard?.on('keydown-ESC', keyResume);
    this.input.keyboard?.on('keydown-P', keyResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.sound.off(Phaser.Sound.Events.GLOBAL_MUTE, syncSound);
      this.input.keyboard?.off('keydown-ESC', keyResume);
      this.input.keyboard?.off('keydown-P', keyResume);
    });
  }

  private soundLabel(): string {
    return sfx(this).muted ? 'SOUND: OFF' : 'SOUND: ON';
  }

  private resume(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.registry.set(RESUMED_AT, this.game.loop.time);
    Music.of(this).resume();
    this.game.sound.resumeAll();
    this.scene.resume('Game');
    this.scene.stop();
  }

  private toMenu(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.game.sound.resumeAll();
    Music.of(this).playMenu(); // inside the tap / key handler, so playback is allowed
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
