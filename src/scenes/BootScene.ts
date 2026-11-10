import Phaser from 'phaser';
import { Music } from '../audio/Music';
import { sfx } from '../audio/Sfx';
import backdropImage from '../assets/backdrop/backdrop.jpg';
import jumpSheet from '../assets/runner/jump.png';
import runSheet from '../assets/runner/run.png';
import slideSheet from '../assets/runner/slide.png';
import { GAME_W } from '../config';
import { generatePropTextures } from '../gfx/props';
import { generateSceneryTextures } from '../gfx/scenery';
import { RUNNER, SHEET_KEYS } from '../player/animation';
import { UI_FONT } from '../ui/theme';

/**
 * Loads the three runner sprite sheets (PLACEHOLDER mannequins until the real
 * character is baked), then draws all scenery, obstacles, pickups and UI-adjacent
 * textures procedurally. Generators skip keys that already exist, so any texture
 * can be replaced by loading a real image under the same key in preload().
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.add.rectangle(GAME_W / 2, 500, 280, 10, 0x0a5476).setOrigin(0.5);
    const fill = this.add.rectangle(GAME_W / 2 - 140, 500, 0, 10, 0xffd23f).setOrigin(0, 0.5);
    this.add
      .text(GAME_W / 2, 460, 'LOADING', {
        fontFamily: UI_FONT,
        fontStyle: 'bold',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.load.on('progress', (amount: number) => {
      fill.width = 280 * amount;
    });

    const frameConfig = { frameWidth: RUNNER.frameWidth, frameHeight: RUNNER.frameHeight };
    this.load.image('backdrop', backdropImage);
    this.load.spritesheet(SHEET_KEYS.run, runSheet, frameConfig);
    this.load.spritesheet(SHEET_KEYS.jump, jumpSheet, frameConfig);
    this.load.spritesheet(SHEET_KEYS.slide, slideSheet, frameConfig);
  }

  create(): void {
    generateSceneryTextures(this);
    generatePropTextures(this);
    sfx(this).init();
    Music.of(this).preload();
    this.scene.start('Menu');
  }
}
