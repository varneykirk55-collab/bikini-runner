import Phaser from 'phaser';
import { Music } from '../audio/Music';
import { sfx } from '../audio/Sfx';
import backdropImage from '../assets/backdrop/backdrop.jpg';
import jungleBand from '../assets/map/midground_jungle_band.webp';
import jungleTreeline from '../assets/map/midground_jungle_treeline.webp';
import roadsideLeft from '../assets/map/roadside_wall_left.webp';
import roadsideRight from '../assets/map/roadside_wall_right.webp';
import propBanana from '../assets/map/props/prop_banana_leaf_cluster.webp';
import propFern from '../assets/map/props/prop_fern_clump.webp';
import propHeliconia from '../assets/map/props/prop_heliconia_clump.webp';
import propHibiscus from '../assets/map/props/prop_hibiscus_bush.webp';
import propMonstera from '../assets/map/props/prop_monstera_clump.webp';
import propPalm from '../assets/map/props/prop_palm_tree.webp';
import propTorch from '../assets/map/props/prop_tiki_torch.webp';
import propYoungPalm from '../assets/map/props/prop_young_palm.webp';
import obstacleCrab from '../assets/map/obstacles/obstacle_coconut_crab.webp';
import obstacleDriftwood from '../assets/map/obstacles/obstacle_driftwood_log.webp';
import obstacleMacaw from '../assets/map/obstacles/obstacle_macaw.webp';
import obstacleRocks from '../assets/map/obstacles/obstacle_rocks_coconut.webp';
import obstacleGate from '../assets/map/obstacles/obstacle_tiki_gate.webp';
import idleSheet from '../assets/runner/idle.png';
import jumpSheet from '../assets/runner/jump.png';
import runSheet from '../assets/runner/run.png';
import slideSheet from '../assets/runner/slide.png';
import { GAME_W } from '../config';
import { generatePropTextures } from '../gfx/props';
import { generateSceneryTextures } from '../gfx/scenery';
import { IDLE_KEY, RUNNER, SHEET_KEYS } from '../player/animation';
import { UI_FONT } from '../ui/theme';

/**
 * Loads the painted backdrop, the jungle road art, the runner sheets and the
 * standing idle frame, then draws pickups and UI textures procedurally.
 * Generators skip keys that already exist. The rigged model beside the sheets
 * is a source asset and is not loaded here.
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
    this.load.image('jungle_band', jungleBand);
    this.load.image('jungle_treeline', jungleTreeline);
    this.load.image('roadside_left', roadsideLeft);
    this.load.image('roadside_right', roadsideRight);
    this.load.image('palm', propPalm);
    this.load.image('youngPalm', propYoungPalm);
    this.load.image('monstera', propMonstera);
    this.load.image('fern', propFern);
    this.load.image('hibiscus', propHibiscus);
    this.load.image('banana', propBanana);
    this.load.image('heliconia', propHeliconia);
    this.load.image('tikiTorch', propTorch);
    // Painted obstacles keep the existing keys and hitboxes.
    this.load.image('sandcastle', obstacleDriftwood);
    this.load.image('urchin', obstacleRocks);
    this.load.image('limboPole', obstacleGate);
    this.load.image('seagull0', obstacleMacaw);
    this.load.image('seagull1', obstacleMacaw);
    this.load.image('crab', obstacleCrab);
    this.load.image('crab1', obstacleCrab);
    this.load.spritesheet(SHEET_KEYS.run, runSheet, frameConfig);
    this.load.spritesheet(SHEET_KEYS.jump, jumpSheet, frameConfig);
    this.load.spritesheet(SHEET_KEYS.slide, slideSheet, frameConfig);
    this.load.image(IDLE_KEY, idleSheet);
  }

  create(): void {
    generateSceneryTextures(this);
    generatePropTextures(this);
    sfx(this).init();
    Music.of(this).preload();
    this.scene.start('Menu');
  }
}
