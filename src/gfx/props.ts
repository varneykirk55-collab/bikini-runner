import Phaser from 'phaser';
import { Ctx, TAU, circle, makeTexture, poly, polyline, rgba, vGradient } from './canvas';

/**
 * Painted tropical props, drawn procedurally at boot. Texture keys are unchanged
 * so gameplay and the loader stay put; a real image under the same key still wins.
 *
 * Obstacles: sandcastle (driftwood), urchin (rocks), limboPole (tiki gate),
 *            seagull0/1 (tropical bird), crab/crab1 (coconut crab)
 * Decor:     palm, monstera, fern, hibiscus, tikiTorch
 * Pickups:   pickup_star_a/b/c, pickup_shield, pickup_magnet, pickup_double, pickup_flight, parasail
 * FX:        shadow, spark, petal, confetti, aura
 */

export const PICKUP_COLORS = {
  basic: '#ffd23f',
  shield: '#27c8ff',
  magnet: '#ff5c8a',
  double: '#b58cff',
  flight: '#3ee6a8',
} as const;

const OUTLINE = 'rgba(30,50,70,0.55)';

// ---- Obstacles -------------------------------------------------------------------

/** Low driftwood log. Jump obstacle; sits on the bottom of a 110×80 sheet. */
function sandcastle(c: Ctx): void {
  c.fillStyle = '#3a2918';
  c.beginPath();
  c.ellipse(55, 62, 48, 14, 0, 0, TAU);
  c.fill();
  const wood = c.createLinearGradient(10, 40, 100, 72);
  wood.addColorStop(0, '#6b4a2a');
  wood.addColorStop(0.45, '#a56b3c');
  wood.addColorStop(1, '#4a3018');
  c.fillStyle = wood;
  c.beginPath();
  c.ellipse(54, 50, 46, 16, -0.08, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(255,220,170,0.35)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(54, 46, 36, 7, -0.08, Math.PI, 0);
  c.stroke();
  // A broken branch and a patch of moss.
  c.strokeStyle = '#5c3c22';
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(28, 48);
  c.lineTo(16, 34);
  c.stroke();
  c.fillStyle = '#2f7a3c';
  c.beginPath();
  c.ellipse(70, 46, 10, 5, 0.4, 0, TAU);
  c.fill();
}

/** A pile of dark rocks with a coconut. Jump obstacle, same footprint as the urchin. */
function urchin(c: Ctx): void {
  const rock = (x: number, y: number, rx: number, ry: number, light: string, dark: string) => {
    c.fillStyle = dark;
    c.beginPath();
    c.ellipse(x, y + 3, rx, ry, 0, 0, TAU);
    c.fill();
    c.fillStyle = light;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.35, ry * 0.25, 0, 0, TAU);
    c.fill();
  };
  rock(32, 58, 20, 14, '#6e6a64', '#3e3c38');
  rock(78, 60, 18, 13, '#7a756c', '#45423c');
  rock(55, 50, 24, 16, '#8a847a', '#4a4742');
  c.fillStyle = '#2f6b38';
  c.beginPath();
  c.ellipse(40, 48, 8, 4, 0.5, 0, TAU);
  c.fill();
  // Coconut sitting in the pile.
  c.fillStyle = '#5c3a1e';
  c.beginPath();
  c.ellipse(62, 42, 11, 10, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#8a5a32';
  c.beginPath();
  c.ellipse(60, 40, 8, 7, 0, 0, TAU);
  c.fill();
}

/** Bamboo posts and a hibiscus garland. The garland is the part you slide under. */
function limboPole(c: Ctx): void {
  const post = (x: number) => {
    c.fillStyle = '#c4a15a';
    c.fillRect(x, 6, 11, 130);
    c.fillStyle = '#8a6a32';
    c.fillRect(x + 7, 6, 4, 130);
    for (let y = 16; y < 130; y += 18) {
      c.fillStyle = '#6b4e24';
      c.fillRect(x - 1, y, 13, 3);
    }
  };
  post(8);
  post(111);
  // Carved beam and flowers across the top of the opening.
  c.fillStyle = '#a67c3d';
  c.fillRect(16, 10, 98, 14);
  c.fillStyle = '#1f7a3a';
  c.beginPath();
  c.moveTo(16, 28);
  c.quadraticCurveTo(65, 78, 114, 28);
  c.lineTo(114, 40);
  c.quadraticCurveTo(65, 92, 16, 40);
  c.fill();
  for (const x of [30, 50, 65, 80, 98]) {
    flower(c, x, 36 + (x % 2) * 8, 8);
  }
}

function seagull(c: Ctx, up: boolean): void {
  const wingY = up ? 10 : 36;
  // Macaw: sunset wings, green body. Two frames flap.
  poly(c, [[60, 40], [6, wingY], [40, 46]], '#ff5a2a', '#7a2a10', 1.5);
  poly(c, [[60, 40], [114, wingY], [80, 46]], '#ffd23f', '#7a2a10', 1.5);
  c.fillStyle = '#1f8a4a';
  c.beginPath();
  c.ellipse(60, 46, 18, 11, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#ffd23f';
  c.beginPath();
  c.ellipse(74, 44, 10, 6, 0.4, 0, TAU);
  c.fill();
  circle(c, 58, 30, 7, '#1f8a4a');
  poly(c, [[62, 30], [74, 33], [62, 36]], '#ff9a2a');
  circle(c, 60, 28, 1.5, '#1b2a3a');
}

function crab(c: Ctx, alt: boolean): void {
  const body = '#8a4a28';
  const dark = '#4a2814';
  c.strokeStyle = dark;
  c.lineWidth = 5;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(46 + side * 14, 96 + i * 12);
      c.lineTo(46 + side * 36, 90 + i * 16 + (alt ? 4 : -2));
      c.stroke();
    }
  }
  c.fillStyle = '#6b3a1c';
  c.beginPath();
  c.ellipse(46, 104, 30, 36, 0, 0, TAU);
  c.fill();
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(46, 98, 28, 34, 0, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(255,210,150,0.35)';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(46, 90, 16, 10, 0, Math.PI, 0);
  c.stroke();
  circle(c, 36, 64, 6, '#f4e2c4');
  circle(c, 56, 64, 6, '#f4e2c4');
  circle(c, 36, 64, 2.4, '#1b2a3a');
  circle(c, 56, 64, 2.4, '#1b2a3a');
  const lift = alt ? 10 : 0;
  for (const side of [-1, 1]) {
    const y = side === -1 ? 36 + lift : 46 - lift;
    c.strokeStyle = body;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(46 + side * 28, 90);
    c.lineTo(46 + side * 36, y + 16);
    c.stroke();
    poly(c, [[46 + side * 36, y + 16], [46 + side * 22, y], [46 + side * 48, y + 2]], '#c46a32', dark, 1.5);
  }
}

// ---- Decor -------------------------------------------------------------------------

function palm(c: Ctx): void {
  c.strokeStyle = '#6b4a28';
  c.lineWidth = 8;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(40, 148);
  c.quadraticCurveTo(52, 90, 44, 48);
  c.stroke();
  c.strokeStyle = '#8a6236';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(38, 140);
  c.quadraticCurveTo(48, 92, 42, 54);
  c.stroke();
  const frond = (rot: number, len: number, color: string) => {
    c.save();
    c.translate(44, 46);
    c.rotate(rot);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.45, -7, len, 0);
    c.quadraticCurveTo(len * 0.45, 6, 0, 0);
    c.fill();
    c.restore();
  };
  const greens = ['#146b32', '#1f8a40', '#0e4e28', '#3aa04a'];
  for (let i = 0; i < 8; i++) frond((i / 8) * TAU, 28 + (i % 3) * 6, greens[i % greens.length]);
  circle(c, 40, 54, 4, '#5c3a1c');
  circle(c, 48, 56, 3.5, '#6b4424');
}

function monstera(c: Ctx): void {
  const leaf = (x: number, y: number, rot: number, s: number, color: string) => {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s, s);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, 18);
    c.bezierCurveTo(-28, 10, -26, -22, 0, -28);
    c.bezierCurveTo(26, -22, 28, 10, 0, 18);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    for (const [hx, hy] of [[-8, -6], [7, -2], [-4, 6], [9, 8]] as const) {
      c.beginPath();
      c.ellipse(hx, hy, 3.2, 2.2, 0.4, 0, TAU);
      c.fill();
    }
    c.strokeStyle = 'rgba(210,255,170,0.35)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, 14);
    c.lineTo(0, -22);
    c.stroke();
    c.restore();
  };
  leaf(46, 78, -0.5, 1.15, '#0f5a2c');
  leaf(28, 96, 0.7, 0.85, '#1c7a3c');
  leaf(62, 100, -0.2, 0.7, '#248a44');
}

function fern(c: Ctx): void {
  c.strokeStyle = '#1a6b34';
  c.lineWidth = 2;
  c.lineCap = 'round';
  const frond = (rot: number) => {
    c.save();
    c.translate(40, 120);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(8, -40, 0, -78);
    c.stroke();
    c.fillStyle = '#2f9a48';
    for (let i = 0; i < 8; i++) {
      const y = -10 - i * 8;
      const w = 7 + (4 - Math.abs(i - 4));
      c.beginPath();
      c.ellipse(-6, y, w, 3.2, -0.5, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(6, y, w, 3.2, 0.5, 0, TAU);
      c.fill();
    }
    c.restore();
  };
  frond(-0.35);
  frond(0.25);
  frond(0.02);
}

function flower(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#e10e2c';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    c.beginPath();
    c.ellipse(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.55, r * 0.32, a, 0, TAU);
    c.fill();
  }
  circle(c, x, y, r * 0.28, '#ffd23f');
  circle(c, x - r * 0.08, y - r * 0.08, r * 0.1, '#fff4b0');
}

function hibiscus(c: Ctx): void {
  c.fillStyle = '#145c30';
  c.beginPath();
  c.ellipse(40, 92, 34, 26, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#1f8a40';
  c.beginPath();
  c.ellipse(28, 78, 18, 12, -0.6, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(54, 80, 16, 11, 0.5, 0, TAU);
  c.fill();
  flower(c, 26, 62, 14);
  flower(c, 50, 54, 16);
  flower(c, 38, 78, 11);
}

function tikiTorch(c: Ctx): void {
  c.fillStyle = '#c4a15a';
  c.fillRect(18, 28, 8, 60);
  c.fillStyle = '#6b4e24';
  for (let y = 36; y < 84; y += 12) c.fillRect(16, y, 12, 3);
  const flame = c.createRadialGradient(22, 16, 2, 22, 18, 16);
  flame.addColorStop(0, '#fff1b0');
  flame.addColorStop(0.45, '#ff9a3c');
  flame.addColorStop(1, 'rgba(255,80,20,0)');
  c.fillStyle = flame;
  c.beginPath();
  c.ellipse(22, 16, 14, 18, 0, 0, TAU);
  c.fill();
}

// ---- Pickups -------------------------------------------------------------------------

function glow(c: Ctx, color: string): void {
  const g = c.createRadialGradient(36, 36, 8, 36, 36, 36);
  g.addColorStop(0, rgba(color, 0.55));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, 72, 72);
}

function starPickup(c: Ctx, rot: number, inner: number): void {
  glow(c, PICKUP_COLORS.basic);
  // A gold hibiscus. `rot` and `inner` keep the three frames slightly different.
  c.save();
  c.translate(36, 37);
  c.rotate(rot + Math.PI / 2);
  c.fillStyle = '#ffd23f';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    c.beginPath();
    c.ellipse(Math.cos(a) * 10, Math.sin(a) * 10, 12, inner * 0.45, a, 0, TAU);
    c.fill();
  }
  c.restore();
  circle(c, 36, 37, 6, '#fff1a8');
  circle(c, 33, 34, 2, 'rgba(255,255,255,0.8)');
}

function lifeRing(c: Ctx): void {
  glow(c, PICKUP_COLORS.shield);
  c.lineWidth = 12;
  for (let i = 0; i < 8; i++) {
    c.strokeStyle = i % 2 ? '#ffffff' : '#ff5c8a';
    c.beginPath();
    c.arc(36, 36, 19, (i / 8) * TAU, ((i + 1) / 8) * TAU);
    c.stroke();
  }
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  for (const r of [25, 13]) {
    c.beginPath();
    c.arc(36, 36, r, 0, TAU);
    c.stroke();
  }
}

function shellMagnet(c: Ctx): void {
  glow(c, PICKUP_COLORS.magnet);
  c.lineCap = 'butt';
  c.lineWidth = 12;
  c.strokeStyle = PICKUP_COLORS.magnet;
  c.beginPath();
  c.arc(36, 38, 16, Math.PI, 0);
  c.lineTo(52, 54);
  c.moveTo(20, 38);
  c.lineTo(20, 54);
  c.stroke();
  c.fillStyle = '#ffffff';
  c.fillRect(14, 50, 12, 8);
  c.fillRect(46, 50, 12, 8);
}

function doubleBadge(c: Ctx): void {
  glow(c, PICKUP_COLORS.double);
  circle(c, 36, 36, 22, PICKUP_COLORS.double);
  c.strokeStyle = '#ffffff';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(36, 36, 22, 0, TAU);
  c.stroke();
  polyline(c, [[24, 28], [38, 44]], '#ffffff', 5);
  polyline(c, [[38, 28], [24, 44]], '#ffffff', 5);
  c.fillStyle = '#ffffff';
  c.font = 'bold 16px sans-serif';
  c.fillText('2', 42, 46);
}

function parasailPickup(c: Ctx): void {
  glow(c, PICKUP_COLORS.flight);
  c.fillStyle = PICKUP_COLORS.flight;
  c.beginPath();
  c.ellipse(36, 30, 26, 18, 0, Math.PI, 0);
  c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2;
  for (const x of [20, 36, 52]) polyline(c, [[x, 30], [36, 56]], '#ffffff', 1.5);
  circle(c, 36, 58, 4, '#ffffff');
}

/** Canopy drawn behind the runner while the flight power-up lasts. */
function parasailCanopy(c: Ctx): void {
  const bands = ['#ff5a2a', '#ffd23f', '#ff8a3c', '#fff1b0'];
  c.save();
  c.beginPath();
  c.ellipse(90, 56, 80, 50, 0, Math.PI, 0);
  c.clip();
  for (let i = 0; i < bands.length; i++) {
    c.fillStyle = bands[i];
    c.fillRect(10 + i * 40, 0, 42, 70);
  }
  c.restore();
  c.strokeStyle = 'rgba(90,30,10,0.45)';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(90, 56, 80, 50, 0, Math.PI, 0);
  c.stroke();
  for (let i = 1; i < 4; i++) polyline(c, [[10 + i * 40, 56], [90, 88]], 'rgba(255,255,255,0.7)', 1.5);
}

// ---- Particles ---------------------------------------------------------------------------

function softDot(c: Ctx, size: number, inner: string, outer: string): void {
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
}

export function generatePropTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'sandcastle', 110, 80, sandcastle);
  makeTexture(scene, 'urchin', 110, 80, urchin);
  makeTexture(scene, 'limboPole', 130, 140, limboPole);
  makeTexture(scene, 'seagull0', 120, 72, (c) => seagull(c, true));
  makeTexture(scene, 'seagull1', 120, 72, (c) => seagull(c, false));
  makeTexture(scene, 'crab', 92, 150, (c) => crab(c, false));
  makeTexture(scene, 'crab1', 92, 150, (c) => crab(c, true));
  makeTexture(scene, 'palm', 90, 160, palm);
  makeTexture(scene, 'monstera', 110, 130, monstera);
  makeTexture(scene, 'fern', 90, 140, fern);
  makeTexture(scene, 'hibiscus', 100, 120, hibiscus);
  makeTexture(scene, 'tikiTorch', 44, 90, tikiTorch);

  makeTexture(scene, 'pickup_star_a', 72, 72, (c) => starPickup(c, -Math.PI / 2, 11));
  makeTexture(scene, 'pickup_star_b', 72, 72, (c) => starPickup(c, -Math.PI / 2 + 0.2, 13));
  makeTexture(scene, 'pickup_star_c', 72, 72, (c) => starPickup(c, -Math.PI / 2 - 0.2, 10));
  makeTexture(scene, 'pickup_shield', 72, 72, lifeRing);
  makeTexture(scene, 'pickup_magnet', 72, 72, shellMagnet);
  makeTexture(scene, 'pickup_double', 72, 72, doubleBadge);
  makeTexture(scene, 'pickup_flight', 72, 72, parasailPickup);
  makeTexture(scene, 'parasail', 180, 90, parasailCanopy);

  makeTexture(scene, 'shadow', 80, 22, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.beginPath();
    c.ellipse(40, 11, 36, 9, 0, 0, TAU);
    c.fill();
  });
  makeTexture(scene, 'spark', 16, 16, (c) => softDot(c, 16, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'));
  makeTexture(scene, 'petal', 8, 8, (c) => softDot(c, 8, 'rgba(225,14,44,0.95)', 'rgba(225,14,44,0)'));
  makeTexture(scene, 'confetti', 10, 10, (c) => poly(c, [[1, 4], [5, 0], [9, 3], [7, 9], [2, 8]], '#e10e2c'));
  makeTexture(scene, 'aura', 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 30, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}
