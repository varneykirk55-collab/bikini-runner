import Phaser from 'phaser';

/**
 * PLACEHOLDER UI theme: bright coral / turquoise / sun-yellow on deep teal.
 * Uses the system font stack only: no bundled or network fonts, so there is no
 * font download on mobile and no runtime dependency on any external host.
 * Final typography is a later art decision.
 */
export const UI_FONT = '"Trebuchet MS", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

export const UI = {
  teal900: '#03283f',
  teal800: '#06324a',
  teal700: '#0a5476',
  sun: '#ffd23f',
  sunLight: '#fff3b0',
  coral: '#ff6a5c',
  aqua: '#3fdcf0',
  white: '#ffffff',
  muted: '#b6dbe8',
  ink: '#06324a',
} as const;

/** Screen margin from the canvas edge; the canvas itself sits inside the device safe area (see index.html). */
export const SAFE = { top: 18, side: 16, bottom: 18 } as const;

export function hexColor(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

/** Thousands separators, e.g. 12340 → "12,340". */
export function formatNumber(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

export interface UiTextOptions {
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  align?: 'left' | 'center' | 'right';
  shadow?: boolean;
}

/** Display text in the UI face with a dark outline and a soft drop shadow. */
export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  size: number,
  opts: UiTextOptions = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, str, {
    fontFamily: UI_FONT,
    fontStyle: 'bold',
    fontSize: `${size}px`,
    color: opts.color ?? UI.white,
    stroke: opts.stroke ?? UI.ink,
    strokeThickness: opts.strokeThickness ?? Math.max(3, Math.round(size * 0.14)),
    align: opts.align ?? 'center',
    padding: { x: 4, y: 4 },
  });
  if (opts.shadow !== false) t.setShadow(0, Math.max(2, size * 0.06), 'rgba(0,30,50,0.5)', 4, true, false);
  return t;
}

/** Vertical white → sun yellow → orange fill, used on the logo and headings. */
export function sunFill(t: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  const g = t.context.createLinearGradient(0, 0, 0, t.height);
  g.addColorStop(0.15, '#fffbe0');
  g.addColorStop(0.55, '#ffd23f');
  g.addColorStop(0.95, '#ff8a3c');
  t.setFill(g);
  return t;
}
