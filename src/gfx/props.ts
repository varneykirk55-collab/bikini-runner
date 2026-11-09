import Phaser from 'phaser';
import { Ctx, Pt, TAU, box, circle, makeTexture, poly, polyline, rgba, vGradient } from './canvas';

/**
 * PLACEHOLDER props: beach obstacles, collectibles, decor and particle textures,
 * drawn procedurally at boot. Simple flat shapes on purpose: they mark where the
 * real Bikini Runner models/sprites go. Replace any one by loading an image with
 * the same key in BootScene.preload().
 *
 * Obstacles: sandcastle, urchin, limboPole, seagull0/1, crab/crab1
 * Decor:     palm, tikiTorch
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

function sandcastle(c: Ctx): void {
  const sand = '#f0c06a';
  const shade = '#d9a24c';
  box(c, 10, 38, 90, 42, 4, sand);
  box(c, 10, 62, 90, 18, 4, shade);
  for (const [x, w, top] of [[14, 24, 20], [43, 24, 12], [72, 24, 20]] as const) {
    box(c, x, top, w, 70 - top, 3, sand);
    for (let k = 0; k < 3; k++) c.fillRect(x + 2 + k * 8, top - 5, 5, 6);
  }
  poly(c, [[55, 6], [55, 0], [68, 3]], '#ff5c8a');
  c.fillStyle = shade;
  c.fillRect(54, 0, 2, 12);
  box(c, 48, 52, 14, 28, 6, '#8a5a24');
}

function urchin(c: Ctx): void {
  const cx = 55;
  const cy = 52;
  c.strokeStyle = '#3a2168';
  c.lineWidth = 3;
  c.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
    c.lineTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 38);
    c.stroke();
  }
  circle(c, cx, cy, 24, '#6b3fb5');
  circle(c, cx - 7, cy - 8, 8, 'rgba(255,255,255,0.25)');
}

function limboPole(c: Ctx): void {
  // Two posts with a hanging banner between them. The banner is the part you slide under.
  box(c, 6, 4, 12, 136, 3, '#8a5a24');
  box(c, 112, 4, 12, 136, 3, '#8a5a24');
  c.fillStyle = '#ff5c8a';
  c.fillRect(18, 8, 94, 66); // banner covers elevations ≈0.55–1.1 units
  for (let x = 18; x < 112; x += 24) {
    c.fillStyle = '#ffffff';
    c.fillRect(x, 8, 12, 66);
  }
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.strokeRect(18, 8, 94, 66);
}

function seagull(c: Ctx, up: boolean): void {
  const wingY = up ? 8 : 40;
  poly(c, [[60, 38], [8, wingY], [44, 44]], '#ffffff', OUTLINE, 2);
  poly(c, [[60, 38], [112, wingY], [76, 44]], '#ffffff', OUTLINE, 2);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.ellipse(60, 44, 20, 12, 0, 0, TAU);
  c.fill();
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.stroke();
  circle(c, 60, 28, 8, '#ffffff');
  poly(c, [[60, 28], [60, 36], [70, 31]], '#ffb627');
  circle(c, 63, 26, 1.6, '#1b2a3a');
}

function crab(c: Ctx, alt: boolean): void {
  const body = '#ff6a3d';
  const dark = '#c4421f';
  // legs
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
  // shell + eyes
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(46, 100, 32, 40, 0, 0, TAU);
  c.fill();
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
  c.stroke();
  circle(c, 36, 62, 6, '#ffffff');
  circle(c, 56, 62, 6, '#ffffff');
  circle(c, 36, 62, 2.5, '#1b2a3a');
  circle(c, 56, 62, 2.5, '#1b2a3a');
  // claws raised, alternating
  const lift = alt ? 10 : 0;
  for (const side of [-1, 1]) {
    const y = side === -1 ? 36 + lift : 46 - lift;
    c.strokeStyle = body;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(46 + side * 28, 90);
    c.lineTo(46 + side * 36, y + 16);
    c.stroke();
    poly(c, [[46 + side * 36, y + 16], [46 + side * 22, y], [46 + side * 48, y + 2]], body, OUTLINE, 2);
  }
}

// ---- Decor -------------------------------------------------------------------------

function palm(c: Ctx): void {
  c.strokeStyle = '#8a5a24';
  c.lineWidth = 9;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(38, 150);
  c.quadraticCurveTo(46, 90, 42, 44);
  c.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    c.fillStyle = i % 2 ? '#1f9b52' : '#2fbf6a';
    c.beginPath();
    c.ellipse(42 + Math.cos(a) * 20, 40 + Math.sin(a) * 9, 24, 7, a, 0, TAU);
    c.fill();
  }
  circle(c, 40, 48, 4, '#6b3a12');
  circle(c, 47, 50, 4, '#6b3a12');
}

function tikiTorch(c: Ctx): void {
  box(c, 19, 28, 6, 62, 2, '#8a5a24');
  poly(c, [[22, 4], [32, 26], [12, 26]], '#ff9a3c');
  poly(c, [[22, 12], [28, 26], [16, 26]], '#ffd23f');
}

// ---- Pickups -------------------------------------------------------------------------

function star(cx: number, cy: number, outer: number, inner: number, points: number, rot: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i / (points * 2)) * TAU;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function glow(c: Ctx, color: string): void {
  const g = c.createRadialGradient(36, 36, 8, 36, 36, 36);
  g.addColorStop(0, rgba(color, 0.55));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.fillRect(0, 0, 72, 72);
}

function starPickup(c: Ctx, rot: number, inner: number): void {
  glow(c, PICKUP_COLORS.basic);
  poly(c, star(36, 37, 24, inner, 5, rot), PICKUP_COLORS.basic, '#b8860b', 2.5);
  circle(c, 31, 30, 4, 'rgba(255,255,255,0.7)');
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
  c.fillStyle = vGradient(c, 0, 90, [
    [0, '#ff5c8a'],
    [1, '#ffd23f'],
  ]);
  c.beginPath();
  c.ellipse(90, 56, 80, 50, 0, Math.PI, 0);
  c.fill();
  c.strokeStyle = OUTLINE;
  c.lineWidth = 2;
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
  makeTexture(scene, 'palm', 80, 150, palm);
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
    c.fillStyle = 'rgba(40,30,20,0.45)';
    c.beginPath();
    c.ellipse(40, 11, 36, 9, 0, 0, TAU);
    c.fill();
  });
  makeTexture(scene, 'spark', 16, 16, (c) => softDot(c, 16, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'));
  makeTexture(scene, 'petal', 8, 8, (c) => softDot(c, 8, 'rgba(255,170,200,0.95)', 'rgba(255,170,200,0)'));
  makeTexture(scene, 'confetti', 10, 10, (c) => poly(c, [[1, 4], [5, 0], [9, 3], [7, 9], [2, 8]], '#ff9ec7'));
  makeTexture(scene, 'aura', 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 30, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}
