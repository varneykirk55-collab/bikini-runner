import Phaser from 'phaser';
import { Command, KEYMAP, SwipeRecognizer } from './commands';

/**
 * Binds Phaser pointer and keyboard events to the Phaser-free SwipeRecognizer and
 * KEYMAP, and reports `Command`s. Nothing else in the game reads raw input.
 */
export class Controls {
  private readonly swipes: SwipeRecognizer;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onCommand: (command: Command) => void,
  ) {
    this.swipes = new SwipeRecognizer((c) => this.onCommand(c));
    const input = scene.input;
    input.on('pointerdown', this.onDown, this);
    input.on('pointermove', this.onMove, this);
    input.on('pointerup', this.onUp, this);
    input.on('pointerupoutside', this.onUp, this);
    input.keyboard?.on('keydown', this.onKey, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.off('pointerdown', this.onDown, this);
      input.off('pointermove', this.onMove, this);
      input.off('pointerup', this.onUp, this);
      input.off('pointerupoutside', this.onUp, this);
      input.keyboard?.off('keydown', this.onKey, this);
    });
  }

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[] = []): void {
    this.swipes.down(p.x, p.y, p.id, over.length > 0); // presses on UI (pause button) are not swipes
  }

  private onMove(p: Phaser.Input.Pointer): void {
    this.swipes.move(p.x, p.y, p.id, p.isDown);
  }

  private onUp(p: Phaser.Input.Pointer): void {
    this.swipes.up(p.x, p.y, p.id);
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat) return;
    const command = KEYMAP[e.code];
    if (command) this.onCommand(command);
  }
}
