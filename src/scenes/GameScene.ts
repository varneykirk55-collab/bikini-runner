import Phaser from 'phaser';
import { Music } from '../audio/Music';
import { sfx } from '../audio/Sfx';
import { CameraRig } from '../camera/CameraRig';
import { hitsObstacle, touchesPickup } from '../collision/collision';
import { PICKUP_VALUE, PLAYER } from '../config';
import { Obstacle } from '../entities/Obstacle';
import { Pickup, pickupColor } from '../entities/Pickup';
import { PICKUP_COLORS } from '../gfx/props';
import { Command } from '../input/commands';
import { Controls } from '../input/Controls';
import { Spawner } from '../obstacles/Spawner';
import { Player } from '../player/Player';
import { Background } from '../systems/Background';
import { difficultyAt, speedAt } from '../systems/Difficulty';
import { Effects } from '../systems/Effects';
import { POWER_LABELS, PowerUps } from '../systems/PowerUps';
import { loadBest, saveBest } from '../systems/Storage';
import { StraightPath, TrackPath } from '../track/TrackPath';
import { TrackRenderer } from '../track/TrackRenderer';
import { Hud } from '../ui/Hud';
import { showGameOver } from '../ui/GameOverPanel';
import { RESUMED_AT } from './PauseScene';

type State = 'running' | 'dead';

export class GameScene extends Phaser.Scene {
  // Everything is (re)created in create(): Phaser reuses the scene instance on restart,
  // so field initialisers would leak state from the previous run.
  private proj!: CameraRig;
  private background!: Background;
  private track!: TrackRenderer;
  /** The course shape. Straight in Phase 1; see track/TrackPath.ts. */
  private path: TrackPath = new StraightPath();
  private spawner!: Spawner;
  private player!: Player;
  private powers!: PowerUps;
  private fx!: Effects;
  private hud!: Hud;
  private state: State = 'running';
  private distance = 0;
  private speed = 0;
  private pickupCount = 0;
  private pickupScore = 0;

  constructor() {
    super('Game');
  }

  create(): void {
    this.state = 'running';
    this.distance = 0;
    this.speed = speedAt(0);
    this.pickupCount = 0;
    this.pickupScore = 0;

    this.proj = new CameraRig();
    this.background = new Background(this);
    this.path = new StraightPath();
    this.track = new TrackRenderer(this);
    this.spawner = new Spawner(this);
    this.player = new Player(this);
    this.powers = new PowerUps();
    this.fx = new Effects(this);
    this.hud = new Hud(this, () => this.pause());
    new Controls(this, (c) => this.onCommand(c));

    // Pause: HUD button, Esc or P.
    const keyPause = () => this.pause();
    this.input.keyboard?.on('keydown-ESC', keyPause);
    this.input.keyboard?.on('keydown-P', keyPause);
    const releasePose = () => this.player.releaseHold();
    this.events.on(Phaser.Scenes.Events.RESUME, releasePose);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', keyPause);
      this.input.keyboard?.off('keydown-P', keyPause);
      this.events.off(Phaser.Scenes.Events.RESUME, releasePose);
    });

    // The menu tap already started the playlist. A restart keeps that song
    // instead of jumping back to the first track.
    Music.of(this).playRun();
    this.cameras.main.fadeIn(350, 6, 46, 70);
  }

  /** Freeze the run and show the pause overlay (UI only: the world simply stops updating). */
  private pause(): void {
    if (this.state !== 'running' || this.scene.isPaused()) return;
    const resumedAt = (this.registry.get(RESUMED_AT) as number | undefined) ?? -Infinity;
    if (this.game.loop.time - resumedAt < 250) return; // same key press that just resumed
    // A grounded runner stands. Mid-jump and mid-slide keep the action frame.
    // Scene pause freezes the world, tweens, timers and particles; songs and effects pause too.
    // A paused scene still renders, so the standing frame stays on screen.
    this.player.holdForPause();
    Music.of(this).pause();
    this.game.sound.pauseAll();
    this.scene.pause();
    this.scene.launch('Pause');
  }

  get score(): number {
    return Math.floor(this.distance) + this.pickupScore;
  }

  private onCommand(command: Command): void {
    if (this.state !== 'running') return;
    switch (command) {
      case 'left':
        this.player.moveLeft();
        break;
      case 'right':
        this.player.moveRight();
        break;
      case 'jump':
        this.player.jump();
        break;
      case 'slide':
        this.player.slide();
        break;
    }
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000; // clamp so a tab-switch hitch can't teleport obstacles

    if (this.state === 'running') {
      const d = difficultyAt(this.distance);
      this.speed = speedAt(d);
      this.distance += this.speed * dt;
      this.powers.update(dt);
      this.player.setFlying(this.powers.active('flight'));
      this.player.update(dt, this.speed);
      const magnet = this.powers.active('magnet') ? { x: this.player.x, h: this.player.h } : null;
      this.spawner.update(dt, this.speed, d, magnet, this.powers.remaining('flight'));
      this.collectPickups();
      this.checkObstacles();
    }

    this.proj.heading = this.path.headingAt(this.distance); // reserved: always 0 on a straight path
    this.proj.follow(this.player.x, this.player.h, dt);
    this.background.update(dt, this.proj, this.state === 'running' ? this.speed : 0);
    this.track.draw(this.proj, this.distance);
    this.spawner.render(this.proj);
    this.player.render(this.proj, this.powers.active('shield'));
    this.hud.update(this.score, this.distance, this.pickupCount, this.powers);
  }

  // ---- Collisions ---------------------------------------------------------

  private collectPickups(): void {
    const p = this.player;
    const span = p.span();
    for (const r of this.spawner.pickups) {
      if (r.dead) continue;
      if (touchesPickup(p.x, span, r)) this.collect(r);
    }
  }

  private collect(r: Pickup): void {
    const pos = this.proj.project(r.lane, Math.max(r.z, 0), r.elev);
    r.destroy();
    if (r.kind === 'basic') {
      const value = PICKUP_VALUE * (this.powers.active('double') ? 2 : 1);
      this.pickupCount++;
      sfx(this).pickup(); // SFX: pickup collect (climbing pentatonic)
      this.pickupScore += value;
      this.fx.collect(pos.x, pos.y, pickupColor('basic'));
      this.fx.floatText(pos.x, pos.y - 20, `+${value}`, this.powers.active('double') ? PICKUP_COLORS.double : PICKUP_COLORS.basic);
    } else {
      this.powers.activate(r.kind);
      sfx(this).power(); // SFX: power-up collect
      this.fx.collect(pos.x, pos.y, pickupColor(r.kind), true);
      this.fx.floatText(pos.x, pos.y - 30, POWER_LABELS[r.kind], PICKUP_COLORS[r.kind], 24);
      this.cameras.main.flash(120, 255, 240, 200);
    }
  }

  private checkObstacles(): void {
    const p = this.player;
    const span = p.span();
    for (const o of this.spawner.obstacles) {
      if (o.hit) continue;
      if (!hitsObstacle(p.x, span, o)) continue;

      o.hit = true;
      if (this.powers.active('shield')) {
        this.smash(o);
        continue;
      }
      if (p.invuln > 0) continue;
      this.die();
      return;
    }
  }

  private smash(o: Obstacle): void {
    this.powers.clear('shield');
    this.player.invuln = PLAYER.invulnTime;
    const pos = this.proj.project(o.lane, Math.max(o.z, 0), (o.def.span[0] + o.def.span[1]) / 2);
    this.fx.smash(pos.x, pos.y);
    sfx(this).smash(); // SFX: shield smash
    this.cameras.main.shake(140, 0.006);
    o.destroy();
  }

  // ---- Death & restart --------------------------------------------------------

  private die(): void {
    this.state = 'dead';
    this.hud.setPauseVisible(false);
    sfx(this).crash(); // SFX: death / crash
    const at = this.player.crash();
    this.fx.crash(at.x, at.y);
    this.cameras.main.shake(320, 0.014);
    this.cameras.main.flash(160, 255, 90, 60);

    const score = this.score;
    const prevBest = loadBest();
    const newBest = score > prevBest;
    if (newBest) saveBest(score);

    this.time.delayedCall(850, () =>
      showGameOver(
        this,
        { score, distance: this.distance, pickups: this.pickupCount, best: Math.max(score, prevBest), newBest },
        {
          onRestart: () => {
            this.cameras.main.fadeOut(220, 6, 46, 70);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart());
          },
          onMenu: () => {
            this.cameras.main.fadeOut(220, 6, 46, 70);
            Music.of(this).playMenu(); // runs inside the tap / key handler, so playback is allowed
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Menu'));
          },
        },
      ),
    );
  }
}
