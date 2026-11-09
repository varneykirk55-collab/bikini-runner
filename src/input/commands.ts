import { SWIPE_THRESHOLD } from '../config';

/** Directional commands the game understands today. */
export type Command = 'left' | 'right' | 'jump' | 'slide';

/**
 * Reserved for the Temple Run-style expansion (90-degree turns). Nothing emits
 * these yet; they exist so the input layer's contract is already
 * `Command | TurnCommand` and no consumer assumes only four commands.
 */
export type TurnCommand = 'turnLeft' | 'turnRight';

export const KEYMAP: Record<string, Command> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
};

/**
 * Swipe recognition, extracted unchanged from Valhalla Run's Controls so it can be
 * tested without Phaser. A swipe fires as soon as the finger travels past the
 * threshold (no waiting for release), which keeps lane changes instant on phones.
 */
export class SwipeRecognizer {
  private start: { x: number; y: number; id: number } | null = null;
  private fired = false;

  constructor(
    private readonly onCommand: (c: Command) => void,
    private readonly threshold: number = SWIPE_THRESHOLD,
  ) {}

  /** `overUi`: the press landed on a UI object (pause button), so it is not a swipe. */
  down(x: number, y: number, id: number, overUi = false): void {
    if (overUi) {
      this.start = null;
      return;
    }
    this.start = { x, y, id };
    this.fired = false;
  }

  move(x: number, y: number, id: number, isDown: boolean): void {
    if (!isDown) return;
    this.evaluate(x, y, id, this.threshold);
  }

  up(x: number, y: number, id: number): void {
    // A very quick flick may only report down + up: accept a shorter distance here.
    this.evaluate(x, y, id, this.threshold * 0.6);
    this.start = null;
  }

  private evaluate(x: number, y: number, id: number, threshold: number): void {
    if (!this.start || this.fired || id !== this.start.id) return;
    const dx = x - this.start.x;
    const dy = y - this.start.y;
    if (Math.hypot(dx, dy) < threshold) return;
    this.fired = true;
    if (Math.abs(dx) > Math.abs(dy)) this.onCommand(dx < 0 ? 'left' : 'right');
    else this.onCommand(dy < 0 ? 'jump' : 'slide');
  }
}
