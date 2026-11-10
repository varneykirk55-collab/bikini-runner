import Phaser from 'phaser';
import { Ctx, TAU, roundRectPath } from './canvas';

/**
 * PLACEHOLDER UI art: rounded coral / turquoise panels, buttons, pills and icons drawn
 * procedurally. Drawn 1:1 in game pixels (no TEX_SCALE) and generated lazily per size,
 * so each texture is built once and reused. Real UI art replaces these by swapping the
 * texture a function returns; the function signatures (and paddings) are the contract
 * the UI components rely on.
 */

function makeUi(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  if (!tex) return key;
  draw(tex.getContext());
  tex.refresh();
  return key;
}

function grad(c: Ctx, y0: number, y1: number, stops: Array<[number, string]>): CanvasGradient {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}

const PRIMARY: Array<[number, string]> = [[0, '#ffa15c'], [0.5, '#ff6a5c'], [1, '#e83f7a']];
const SECONDARY: Array<[number, string]> = [[0, '#3fdcf0'], [1, '#0a8fb5']];
const DARK_FACE: Array<[number, string]> = [[0, 'rgba(10,84,118,0.94)'], [1, 'rgba(4,44,72,0.94)']];
const INK = '#06324a';

/** Rounded face with a drop shadow, a glossy top half and a white rim. */
function pill(c: Ctx, x: number, y: number, w: number, h: number, r: number, face: Array<[number, string]>, rim = 3, gloss = true): void {
  c.save();
  c.shadowColor = 'rgba(0,30,50,0.45)';
  c.shadowBlur = 8;
  c.shadowOffsetY = 3;
  roundRectPath(c, x, y, w, h, r);
  c.fillStyle = grad(c, y, y + h, face);
  c.fill();
  c.restore();
  // gloss
  if (gloss) {
    roundRectPath(c, x + 3, y + 3, w - 6, h * 0.46, Math.max(2, r - 3));
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.fill();
  }
  // rim
  roundRectPath(c, x, y, w, h, r);
  c.strokeStyle = 'rgba(255,255,255,0.92)';
  c.lineWidth = rim;
  c.stroke();
}

// ---- Buttons & pills -----------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary';

/** Pill button: coral (primary call to action) or turquoise (secondary). Art is padded by 8px. */
export function buttonTexture(scene: Phaser.Scene, variant: ButtonVariant, w: number, h: number): string {
  const pad = 8;
  return makeUi(scene, `ui_btn_${variant}_${w}x${h}`, w + pad * 2, h + pad * 2, (c) => {
    pill(c, pad, pad, w, h, h / 2, variant === 'primary' ? PRIMARY : SECONDARY, 3.5);
  });
}

/** HUD counter pill: translucent teal face with a slim white rim. Art is padded by 6px. */
export function pillTexture(scene: Phaser.Scene, w: number, h: number): string {
  const pad = 6;
  return makeUi(scene, `ui_pill_${w}x${h}`, w + pad * 2, h + pad * 2, (c) => {
    pill(c, pad, pad, w, h, h / 2, DARK_FACE, 2.5);
  });
}

/** Square rounded icon button (pause). Art is padded by 6px. */
export function iconButtonTexture(scene: Phaser.Scene, key: string, size: number, icon: (c: Ctx, cx: number, cy: number, s: number) => void): string {
  const pad = 6;
  return makeUi(scene, key, size + pad * 2, size + pad * 2, (c) => {
    pill(c, pad, pad, size, size, size * 0.28, SECONDARY, 3);
    icon(c, pad + size / 2, pad + size / 2, size);
  });
}

// ---- Panels ------------------------------------------------------------------

/** Results / modal panel: dark teal body, white rim, coral accent along the top. */
export function panelTexture(scene: Phaser.Scene, w: number, h: number): string {
  const pad = 12;
  return makeUi(scene, `ui_panel_${w}x${h}`, w + pad * 2, h + pad * 2, (c) => {
    pill(c, pad, pad, w, h, 30, DARK_FACE, 4, false);
    c.save();
    roundRectPath(c, pad, pad, w, h, 30);
    c.clip();
    c.fillStyle = grad(c, pad, pad + 96, [
      [0, 'rgba(255,255,255,0.16)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(pad, pad, w, 96);
    c.fillStyle = grad(c, pad, pad + 10, [[0, '#ff8a5c'], [1, '#ff4f7b']]);
    c.fillRect(pad, pad, w, 10);
    c.restore();
    roundRectPath(c, pad, pad, w, h, 30);
    c.strokeStyle = 'rgba(255,255,255,0.92)';
    c.lineWidth = 4;
    c.stroke();
  });
}

/** Thin gradient rule under a modal title. */
export function dividerTexture(scene: Phaser.Scene, w: number): string {
  return makeUi(scene, `ui_divider_${w}`, w, 10, (c) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,138,92,0)');
    g.addColorStop(0.2, '#ff8a5c');
    g.addColorStop(0.5, '#ffd23f');
    g.addColorStop(0.8, '#3fdcf0');
    g.addColorStop(1, 'rgba(63,220,240,0)');
    c.fillStyle = g;
    c.fillRect(0, 3, w, 4);
  });
}

/** Result row backing (score, best, distance, pickups). */
export function rowTexture(scene: Phaser.Scene, w: number, h: number): string {
  return makeUi(scene, `ui_row_${w}x${h}`, w, h, (c) => {
    roundRectPath(c, 1, 1, w - 2, h - 2, h / 2);
    c.fillStyle = 'rgba(255,255,255,0.10)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 2;
    c.stroke();
  });
}

/** Round backing for a power-up timer ring. */
export function powerBackTexture(scene: Phaser.Scene, size: number): string {
  return makeUi(scene, `ui_power_${size}`, size, size, (c) => {
    c.beginPath();
    c.arc(size / 2, size / 2, size / 2 - 2, 0, TAU);
    c.fillStyle = 'rgba(4,44,72,0.82)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 2.5;
    c.stroke();
  });
}

/** Title plate behind the BIKINI RUNNER wordmark: a sunset badge. PLACEHOLDER logo. */
export function logoTexture(scene: Phaser.Scene): string {
  const W = 500;
  const H = 330;
  return makeUi(scene, 'ui_logo_plate', W, H, (c) => {
    // sun disc with rays
    const cx = W / 2;
    const cy = 150;
    c.save();
    c.translate(cx, cy);
    for (let i = 0; i < 18; i++) {
      c.rotate(TAU / 18);
      c.fillStyle = i % 2 ? 'rgba(255,230,140,0.55)' : 'rgba(255,170,120,0.45)';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-18, -150);
      c.lineTo(18, -150);
      c.closePath();
      c.fill();
    }
    c.restore();
    pill(c, 30, 70, W - 60, 190, 70, [[0, '#ffd23f'], [0.55, '#ff8a5c'], [1, '#e83f7a']], 5);
    // wave stripes along the bottom of the plate
    c.save();
    roundRectPath(c, 30, 70, W - 60, 190, 70);
    c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 4;
    for (const y of [222, 238]) {
      c.beginPath();
      for (let x = 30; x <= W - 30; x += 8) c.lineTo(x, y + Math.sin(x * 0.12) * 4);
      c.stroke();
    }
    c.restore();
  });
}

// ---- Icons ----------------------------------------------------------------------------

function outlineFill(c: Ctx, fill: string): void {
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.lineJoin = 'round';
  c.stroke();
}

const ICONS = {
  trophy: (c: Ctx, s: number) => {
    c.beginPath();
    c.moveTo(s * 0.26, s * 0.14);
    c.lineTo(s * 0.74, s * 0.14);
    c.quadraticCurveTo(s * 0.74, s * 0.58, s * 0.5, s * 0.6);
    c.quadraticCurveTo(s * 0.26, s * 0.58, s * 0.26, s * 0.14);
    outlineFill(c, '#ffd23f');
    c.beginPath();
    c.rect(s * 0.44, s * 0.6, s * 0.12, s * 0.16);
    outlineFill(c, '#ffd23f');
    c.beginPath();
    c.rect(s * 0.3, s * 0.76, s * 0.4, s * 0.1);
    outlineFill(c, '#ff8a5c');
  },
  star: (c: Ctx, s: number) => {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s * 0.4 : s * 0.17;
      const a = -Math.PI / 2 + (i / 10) * TAU;
      const x = s / 2 + Math.cos(a) * r;
      const y = s / 2 + Math.sin(a) * r + s * 0.03;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    outlineFill(c, '#ffd23f');
  },
  runner: (c: Ctx, s: number) => {
    c.beginPath();
    c.arc(s * 0.5, s * 0.2, s * 0.11, 0, TAU);
    outlineFill(c, '#ffffff');
    c.strokeStyle = '#ffffff';
    c.lineWidth = s * 0.1;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.34);
    c.lineTo(s * 0.5, s * 0.6);
    c.moveTo(s * 0.5, s * 0.6);
    c.lineTo(s * 0.34, s * 0.88);
    c.moveTo(s * 0.5, s * 0.6);
    c.lineTo(s * 0.68, s * 0.84);
    c.moveTo(s * 0.5, s * 0.42);
    c.lineTo(s * 0.28, s * 0.54);
    c.moveTo(s * 0.5, s * 0.42);
    c.lineTo(s * 0.72, s * 0.52);
    c.stroke();
  },
  gear: (c: Ctx, s: number) => {
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? s * 0.42 : s * 0.32;
      const a = (i / 16) * TAU;
      const x = s / 2 + Math.cos(a) * r;
      const y = s / 2 + Math.sin(a) * r;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    outlineFill(c, '#ffffff');
    c.beginPath();
    c.arc(s / 2, s / 2, s * 0.14, 0, TAU);
    c.fillStyle = INK;
    c.fill();
  },
  book: (c: Ctx, s: number) => {
    // Open book with arched pages and spine crease
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.26);
    c.quadraticCurveTo(s * 0.32, s * 0.18, s * 0.14, s * 0.24);
    c.lineTo(s * 0.14, s * 0.76);
    c.quadraticCurveTo(s * 0.32, s * 0.7, s * 0.5, s * 0.78);
    c.closePath();
    outlineFill(c, '#ffffff');
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.26);
    c.quadraticCurveTo(s * 0.68, s * 0.18, s * 0.86, s * 0.24);
    c.lineTo(s * 0.86, s * 0.76);
    c.quadraticCurveTo(s * 0.68, s * 0.7, s * 0.5, s * 0.78);
    c.closePath();
    outlineFill(c, '#ffe9b0');
  },
  home: (c: Ctx, s: number) => {
    c.beginPath();
    c.moveTo(s * 0.5, s * 0.16);
    c.lineTo(s * 0.86, s * 0.48);
    c.lineTo(s * 0.74, s * 0.48);
    c.lineTo(s * 0.74, s * 0.82);
    c.lineTo(s * 0.26, s * 0.82);
    c.lineTo(s * 0.26, s * 0.48);
    c.lineTo(s * 0.14, s * 0.48);
    c.closePath();
    outlineFill(c, '#ffffff');
  },
  soundOn: (c: Ctx, s: number) => speaker(c, s, true),
  soundOff: (c: Ctx, s: number) => speaker(c, s, false),
};

function speaker(c: Ctx, s: number, on: boolean): void {
  c.beginPath();
  c.moveTo(s * 0.1, s * 0.38);
  c.lineTo(s * 0.28, s * 0.38);
  c.lineTo(s * 0.5, s * 0.16);
  c.lineTo(s * 0.5, s * 0.84);
  c.lineTo(s * 0.28, s * 0.62);
  c.lineTo(s * 0.1, s * 0.62);
  c.closePath();
  outlineFill(c, '#ffffff');
  c.lineCap = 'round';
  if (on) {
    c.strokeStyle = '#ffffff';
    c.lineWidth = s * 0.07;
    for (const r of [0.18, 0.32]) {
      c.beginPath();
      c.arc(s * 0.5, s * 0.5, s * r, -0.8, 0.8);
      c.stroke();
    }
  } else {
    c.strokeStyle = '#ffd2d2';
    c.lineWidth = s * 0.08;
    c.beginPath();
    c.moveTo(s * 0.62, s * 0.36);
    c.lineTo(s * 0.88, s * 0.64);
    c.moveTo(s * 0.88, s * 0.36);
    c.lineTo(s * 0.62, s * 0.64);
    c.stroke();
  }
}

export type IconName = keyof typeof ICONS;

/** Icon texture key at a given pixel size, e.g. iconTexture(scene, 'trophy', 40). */
export function iconTexture(scene: Phaser.Scene, name: IconName, size: number): string {
  return makeUi(scene, `ui_icon_${name}_${size}`, size, size, (c) => ICONS[name](c, size));
}

/** Pause glyph for the HUD button. */
export function pauseButtonTexture(scene: Phaser.Scene, size: number): string {
  return iconButtonTexture(scene, `ui_btn_pause_${size}`, size, (c, cx, cy, s) => {
    c.fillStyle = '#ffffff';
    c.fillRect(cx - s * 0.2, cy - s * 0.22, s * 0.13, s * 0.44);
    c.fillRect(cx + s * 0.07, cy - s * 0.22, s * 0.13, s * 0.44);
  });
}
