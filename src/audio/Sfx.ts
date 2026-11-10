import Phaser from 'phaser';
import { RECIPES, renderBuffer } from './synth';
import { unlockAudio } from './unlock';

/**
 * Master SFX level. The songs sit at 0.3, so this stays at 1 and the
 * per-sound trims below are the levels that actually play. The old 0.42
 * trim was for a build with no music; under that trim a jump was only 0.21,
 * quieter than the song.
 */
const MASTER = 1;
const MUTE_KEY = 'bikini-sfx-muted';

/** Relative volume per sound key (multiplied by MASTER). */
const VOLUME: Record<string, number> = {
  sfx_jump: 0.5,
  sfx_land: 0.35,
  sfx_slide: 0.5,
  sfx_lane: 0.18,
  sfx_pickup: 0.45,
  sfx_power: 0.75,
  sfx_smash: 0.85,
  sfx_crash: 1,
  sfx_growl: 0.4,
  sfx_ui_confirm: 0.5,
  sfx_ui_fail: 0.65,
  sfx_ui_tap: 0.4,
};

/** Pentatonic steps (cents) for successive pickups. */
const PICKUP_STEPS = [0, 200, 400, 700, 900, 1200, 1400, 1600];

/**
 * Named SFX on top of Phaser's sound manager. Clips are synthesised once at
 * boot and stored in Phaser's audio cache, so mute / unlock / volume all go
 * through `scene.sound` like any loaded audio. Without Web Audio it is silent.
 */
class Sfx {
  private initialized = false;
  private _muted = false;
  private pickupStep = 0;
  private lastPickup = 0;
  private lastLane = 0;

  constructor(private readonly game: Phaser.Game) {}

  /** Render every clip into the audio cache. Safe to call more than once. */
  init(): void {
    const sound = this.game.sound;
    if (sound instanceof Phaser.Sound.WebAudioSoundManager) {
      for (const [key, recipe] of Object.entries(RECIPES)) {
        if (!this.game.cache.audio.exists(key)) this.game.cache.audio.add(key, renderBuffer(sound.context, recipe));
      }
    }
    if (this.initialized) return;
    this.initialized = true;
    let startMuted = false;
    try {
      startMuted = window.localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      // storage unavailable: start unmuted
    }
    this.setMuted(startMuted);
    // M toggles SFX mute on desktop.
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM' && !e.repeat) this.toggleMute();
    });
  }

  get muted(): boolean {
    return this._muted;
  }

  private setMuted(muted: boolean): void {
    this._muted = muted;
    const sound = this.game.sound;
    // WebAudioSoundManager.mute only calls masterMuteNode.gain.setValueAtTime(), which
    // does not update gain.value synchronously (or while the AudioContext is suspended).
    if (sound instanceof Phaser.Sound.WebAudioSoundManager) {
      sound.masterMuteNode.gain.value = muted ? 0 : 1;
    }
    sound.mute = muted;
  }

  toggleMute(): boolean {
    const next = !this._muted;
    this.setMuted(next);
    try {
      window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    } catch {
      // ignore
    }
    return next;
  }

  private play(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
    if (!this.game.cache.audio.exists(key)) return;
    unlockAudio(this.game);
    const volume = MASTER * (VOLUME[key] ?? 1) * (config.volume ?? 1);
    this.game.sound.play(key, { ...config, volume });
  }

  private now(): number {
    return this.game.loop.time;
  }

  jump(): void {
    this.play('sfx_jump', { detune: Phaser.Math.Between(-60, 60) });
  }

  land(): void {
    this.play('sfx_land', { detune: Phaser.Math.Between(-80, 80) });
  }

  slide(): void {
    this.play('sfx_slide');
  }

  /** Throttled so rapid double-swipes don't stack. Pans toward the move direction. */
  lane(dir: -1 | 1): void {
    const t = this.now();
    if (t - this.lastLane < 90) return;
    this.lastLane = t;
    this.play('sfx_lane', { pan: dir * 0.35, detune: dir * 80 });
  }

  /** Climbs a pentatonic scale on quick successive pickups; resets after a pause. */
  pickup(): void {
    const t = this.now();
    this.pickupStep = t - this.lastPickup < 700 ? Math.min(this.pickupStep + 1, PICKUP_STEPS.length - 1) : 0;
    this.lastPickup = t;
    this.play('sfx_pickup', { detune: PICKUP_STEPS[this.pickupStep] });
  }

  power(): void {
    this.play('sfx_power');
  }

  smash(): void {
    this.play('sfx_smash');
  }

  crash(): void {
    this.play('sfx_crash');
  }

  growl(): void {
    this.play('sfx_growl', { detune: Phaser.Math.Between(-150, 50) });
  }

  uiConfirm(): void {
    this.play('sfx_ui_confirm');
  }

  uiTap(): void {
    this.play('sfx_ui_tap');
  }

  uiFail(): void {
    this.play('sfx_ui_fail');
  }
}

const instances = new WeakMap<Phaser.Game, Sfx>();

/** The game's shared SFX player: `sfx(scene).jump()`. */
export function sfx(scene: Phaser.Scene): Sfx {
  const game = scene.sys.game;
  let s = instances.get(game);
  if (!s) {
    s = new Sfx(game);
    instances.set(game, s);
  }
  return s;
}
