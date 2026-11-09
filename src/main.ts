import Phaser from 'phaser';
import { Music } from './audio/Music';
import { GAME_H, GAME_W } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1f9bff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  input: { activePointers: 2 },
  // Web Audio stays on for the synthesised effects. The songs are plain HTML
  // audio elements, so they are not decoded into that context.
  render: { antialias: true },
  scene: [BootScene, MenuScene, GameScene, PauseScene],
};

// No web fonts: the UI uses the system font stack (see ui/theme.ts), so the game
// starts immediately and never waits on, or depends on, another host.
Music.install(new Phaser.Game(config));
