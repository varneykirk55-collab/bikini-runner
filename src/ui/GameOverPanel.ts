import Phaser from 'phaser';
import { DEPTH } from '../config';
import { PICKUP_COLORS } from '../gfx/props';
import { iconTexture, rowTexture } from '../gfx/ui';
import { RunResult } from '../types';
import { sfx } from '../audio/Sfx';
import { Modal, UiButton } from './components';
import { UI, formatNumber, sunFill, uiText } from './theme';

export interface GameOverActions {
  onRestart: () => void;
  onMenu: () => void;
}

const W = 460;
const H = 660;

/**
 * Results panel: score, best, distance, pickups, then TRY AGAIN (primary)
 * and MAIN MENU (secondary). Space / Enter = try again, Esc = main menu.
 * Input unlocks after a short delay so a frantic swipe can't skip it.
 */
export function showGameOver(scene: Phaser.Scene, result: RunResult, actions: GameOverActions): void {
  sfx(scene).uiFail(); // SFX: game over panel appears

  const modal = new Modal(scene, { title: 'WIPEOUT!', width: W, height: H, depth: DEPTH.overlay });
  const top = -H / 2;

  // Result rows
  const rows: Array<{ icon: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text }> = [
    {
      icon: scene.add.image(0, 0, iconTexture(scene, 'trophy', 40)),
      text: uiText(scene, 0, 0, formatNumber(result.score), 42),
    },
    {
      icon: scene.add.image(0, 0, iconTexture(scene, 'star', 38)),
      text: uiText(scene, 0, 0, result.newBest ? 'NEW BEST!' : `BEST: ${formatNumber(result.best)}`, 28, { color: UI.sun }),
    },
    {
      icon: scene.add.image(0, 0, iconTexture(scene, 'runner', 34)),
      text: uiText(scene, 0, 0, `${formatNumber(result.distance)} m`, 30),
    },
    {
      icon: scene.add.image(0, 0, 'pickup_star_a').setScale(0.5),
      text: uiText(scene, 0, 0, formatNumber(result.pickups), 30, { color: PICKUP_COLORS.basic }),
    },
  ];
  if (result.newBest) sunFill(rows[1].text);

  rows.forEach((row, i) => {
    const y = top + 168 + i * 68;
    const bg = scene.add.image(0, 0, rowTexture(scene, 340, 58));
    row.icon.setPosition(-128, 0);
    row.text.setOrigin(0.5).setPosition(14, 0);
    const line = scene.add.container(0, y, [bg, row.icon, row.text]).setAlpha(0);
    modal.add(line);
    scene.tweens.add({ targets: line, alpha: 1, x: { from: -24, to: 0 }, delay: 160 + i * 90, duration: 240, ease: 'Cubic.easeOut' });
  });

  let ready = false;
  let done = false;
  let againBtn!: UiButton;
  let menuBtn!: UiButton;
  const cleanupKeys = () => {
    scene.input.keyboard?.off('keydown-SPACE', again);
    scene.input.keyboard?.off('keydown-ENTER', again);
    scene.input.keyboard?.off('keydown-ESC', menu);
  };
  const finish = (fn: () => void) => {
    if (!ready || done) return;
    done = true;
    againBtn.setInteractiveEnabled(false);
    menuBtn.setInteractiveEnabled(false);
    cleanupKeys();
    fn();
  };
  const again = () =>
    finish(() => {
      sfx(scene).uiConfirm(); // SFX: UI confirm (try again)
      actions.onRestart();
    });
  const menu = () =>
    finish(() => {
      sfx(scene).uiTap(); // SFX: UI tap (main menu)
      actions.onMenu();
    });

  againBtn = new UiButton(scene, 0, top + 480, {
    variant: 'primary',
    width: 360,
    height: 92,
    label: 'TRY AGAIN',
    sound: 'none', // again() plays the confirm
    pulse: true,
    onClick: again,
  }).setInteractiveEnabled(false);
  menuBtn = new UiButton(scene, 0, top + 586, {
    variant: 'secondary',
    width: 290,
    height: 70,
    label: 'MAIN MENU',
    icon: 'home',
    sound: 'none', // menu() plays the tap
    onClick: menu,
  }).setInteractiveEnabled(false);
  modal.add(againBtn, menuBtn);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupKeys);
  scene.time.delayedCall(550, () => {
    if (done) return;
    ready = true;
    againBtn.setInteractiveEnabled(true);
    menuBtn.setInteractiveEnabled(true);
    scene.input.keyboard?.on('keydown-SPACE', again);
    scene.input.keyboard?.on('keydown-ENTER', again);
    scene.input.keyboard?.on('keydown-ESC', menu);
  });
}
