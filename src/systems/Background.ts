import Phaser from 'phaser';
import { DEPTH, GAME_W, HORIZON_Y, SPEED } from '../config';
import { CameraRig } from '../camera/CameraRig';

/** One speed line: flies outward from the vanishing point along `angle`. */
interface Streak {
  angle: number;
  r: number;
}

const STREAK_COUNT = 12;

function newStreak(r = Phaser.Math.FloatBetween(20, 380)): Streak {
  // Down-left or down-right of the horizon, keeping clear of the path's centre.
  const a = Phaser.Math.FloatBetween(0.12, 0.42) * Math.PI;
  return { angle: Math.random() < 0.5 ? a : Math.PI - a, r };
}

/**
 * Layered backdrop (all PLACEHOLDER art): sky → sun glow → far islands → ocean →
 * mid islands → resort skyline → palm ridge → drifting clouds.
 * Layers sit still while the camera follows the player; only the cloud band drifts,
 * faster as the run speeds up, and a few speed streaks scale with speed.
 */
export class Background {
  private clouds?: Phaser.GameObjects.TileSprite;
  private cloudScroll = 0;
  private band?: Phaser.GameObjects.Image;
  private treeline?: Phaser.GameObjects.Image;
  // Speed streaks: sparse radial lines whose alpha scales with run speed.
  private readonly streakGfx: Phaser.GameObjects.Graphics;
  private readonly streaks: Streak[] = [];

  constructor(scene: Phaser.Scene) {
    if (scene.textures.exists('backdrop')) {
      // Painted scenery from the art direction: one static image down to the horizon.
      scene.add.image(0, 0, 'backdrop').setOrigin(0, 0).setDisplaySize(GAME_W, HORIZON_Y).setDepth(DEPTH.sky);
    } else {
      this.buildProceduralBackdrop(scene);
    }
    if (scene.textures.exists('jungle_band')) {
      // Opaque bottom sits on the horizon; the soft top overlaps the backdrop's lower edge.
      const bandH = GAME_W * (915 / 1920);
      // Bottom sits just below the horizon so the opaque jungle covers the backdrop's
      // tan lower edge, and the soft top still overlaps the cliffs.
      this.band = scene.add.image(GAME_W / 2, HORIZON_Y + 190, 'jungle_band').setOrigin(0.5, 1).setDisplaySize(GAME_W, bandH).setDepth(DEPTH.sandfield + 0.2);
      if (scene.textures.exists('jungle_treeline')) {
        const treeH = GAME_W * (586 / 1920);
        this.treeline = scene.add
          .image(GAME_W / 2, HORIZON_Y + 8, 'jungle_treeline')
          .setOrigin(0.5, 1)
          .setDisplaySize(GAME_W, treeH)
          .setDepth(DEPTH.sandfield + 0.4);
        // The painted treeline ends in a tan sand fringe. Crop it off so it can't
        // draw a beige line where the midground meets the road.
        const treeSrc = this.treeline.texture.getSourceImage();
        const treeSrcH = treeSrc.height || 586;
        const treeSrcW = treeSrc.width || 1920;
        this.treeline.setCrop(0, 0, treeSrcW, Math.max(1, treeSrcH - 72));
      }
    } else {
      // The ground still dips when the camera rises on a jump; this strip fills the band it uncovers.
      scene.add.image(0, HORIZON_Y, 'sandfield').setOrigin(0, 0).setDisplaySize(GAME_W, 140).setDepth(DEPTH.sandfield - 0.5);
    }

    // Above the fog, below every track object.
    this.streakGfx = scene.add.graphics().setDepth(DEPTH.fog + 1).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < STREAK_COUNT; i++) this.streaks.push(newStreak());
  }

  /** Fallback layered backdrop (all PLACEHOLDER art), used when no 'backdrop' image is loaded. */
  private buildProceduralBackdrop(scene: Phaser.Scene): void {
    scene.add.image(0, 0, 'sky').setOrigin(0, 0).setDepth(DEPTH.sky);
    const sunGlow = scene.add
      .image(GAME_W / 2, 40, 'sunGlow')
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.sunGlow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.95);
    scene.tweens.add({ targets: sunGlow, alpha: 0.6, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const far = scene.add.image(GAME_W / 2, 0, 'farIslands').setOrigin(0.5, 1).setDepth(DEPTH.farIslands);
    const ocean = scene.add.image(GAME_W / 2, 0, 'ocean').setOrigin(0.5, 1).setDepth(DEPTH.ocean);
    // Fractional depths slot the new layers between the existing ones without touching DEPTH.
    const mid = scene.add.image(GAME_W / 2, 0, 'midIslands').setOrigin(0.5, 1).setDepth(DEPTH.ocean + 0.5);
    const resort = scene.add.image(GAME_W / 2, 0, 'resort').setOrigin(0.5, 1).setDepth(DEPTH.resort);
    const palms = scene.add.image(GAME_W / 2, 0, 'palmRidge').setOrigin(0.5, 1).setDepth(DEPTH.resort + 0.5);
    this.clouds = scene.add.tileSprite(GAME_W / 2, 0, GAME_W, 180, 'clouds').setOrigin(0.5, 1).setDepth(DEPTH.clouds).setAlpha(0.9);

    // Static backdrop: no sideways parallax on lane changes, no bob on jumps.
    far.setPosition(GAME_W / 2, HORIZON_Y - 36);
    ocean.setPosition(GAME_W / 2, HORIZON_Y + 8);
    mid.setPosition(GAME_W / 2, HORIZON_Y - 2);
    resort.setPosition(GAME_W / 2, HORIZON_Y + 14);
    palms.setPosition(GAME_W / 2, HORIZON_Y + 18);
    this.clouds.setPosition(GAME_W / 2, HORIZON_Y + 40);
  }

  update(dt: number, proj: CameraRig, speed: number): void {
    // Islands, ocean, resort and palms stay put (positioned once in the constructor);
    // only the clouds drift, faster as the run speeds up.
    if (this.clouds) {
      this.cloudScroll += dt * (10 + speed * 1.5);
      this.clouds.tilePositionX = this.cloudScroll;
    }
    const horizon = HORIZON_Y + proj.lift;
    if (this.band) this.band.y = horizon + 190;
    if (this.treeline) this.treeline.y = horizon + 8;
    this.drawStreaks(dt, proj, speed);
  }

  /** Speed lines: invisible at start speed, subtle but readable near max speed. */
  private drawStreaks(dt: number, proj: CameraRig, speed: number): void {
    const g = this.streakGfx;
    g.clear();
    const t = Phaser.Math.Clamp((speed - SPEED.start) / (SPEED.max - SPEED.start), 0, 1);
    const alpha = speed > 0 ? 0.03 + 0.22 * t : 0;
    if (alpha <= 0) return;

    const ox = GAME_W / 2 - proj.camX * 20;
    const oy = HORIZON_Y + 6 + proj.lift;
    g.lineStyle(1.5, 0xffffff, alpha);
    for (const s of this.streaks) {
      s.r += dt * (60 + speed * 10) * (0.4 + s.r / 160); // accelerate outward like perspective
      const len = 8 + s.r * 0.14;
      if (s.r > 420) Object.assign(s, newStreak(Phaser.Math.FloatBetween(10, 40)));
      const cx = Math.cos(s.angle);
      const cy = Math.sin(s.angle);
      g.lineBetween(ox + cx * s.r, oy + cy * s.r * 0.6, ox + cx * (s.r + len), oy + cy * (s.r + len) * 0.6);
    }
  }
}
