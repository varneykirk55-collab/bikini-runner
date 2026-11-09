import Phaser from 'phaser';
import { Ctx, TAU, circle, makeTexture, poly, rgba, seeded, vGradient } from './canvas';

/**
 * PLACEHOLDER tropical scenery, drawn procedurally at boot. Every texture here is
 * temporary art standing in for the real Bikini Runner environment; replace one by
 * loading an image with the same key in BootScene.preload() (generators skip keys
 * that already exist).
 *
 * Keys: sky, sunGlow, farIslands, midIslands, ocean, resort, palmRidge, clouds, fog, sandfield.
 */

function sky(c: Ctx, w: number, h: number): void {
  c.fillStyle = vGradient(c, 0, h, [
    [0, '#1f9bff'],
    [0.55, '#7fd8ff'],
    [0.85, '#ffe7b8'],
    [1, '#ffc98f'],
  ]);
  c.fillRect(0, 0, w, h);
  // sun disc with a soft halo
  const g = c.createRadialGradient(330, 210, 6, 330, 210, 110);
  g.addColorStop(0, 'rgba(255,252,220,1)');
  g.addColorStop(0.25, 'rgba(255,236,160,0.9)');
  g.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  circle(c, 330, 210, 22, '#fffbe6');
}

function sunGlow(c: Ctx, w: number, h: number): void {
  const g = c.createRadialGradient(w * 0.73, h * 0.8, 4, w * 0.73, h * 0.8, w * 0.55);
  g.addColorStop(0, 'rgba(255,240,190,0.55)');
  g.addColorStop(0.5, 'rgba(255,170,150,0.22)');
  g.addColorStop(1, 'rgba(255,170,150,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function islands(c: Ctx, w: number, h: number, base: string, top: string, seed: number, roughness: number): void {
  const r = seeded(seed);
  c.fillStyle = vGradient(c, 0, h, [
    [0, top],
    [1, base],
  ]);
  c.beginPath();
  c.moveTo(0, h);
  let x = 0;
  while (x <= w) {
    const y = h * (0.35 + r() * roughness);
    c.lineTo(x, y);
    x += 28 + r() * 40;
  }
  c.lineTo(w, h);
  c.closePath();
  c.fill();
}

function ocean(c: Ctx, w: number, h: number): void {
  c.fillStyle = vGradient(c, 0, h, [
    [0, '#2fd0e8'],
    [1, '#0aa5c9'],
  ]);
  c.fillRect(0, 0, w, h);
  const r = seeded(7);
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = 1.4;
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = 4 + r() * (h - 8);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 8 + r() * 18, y);
    c.stroke();
  }
}

function resort(c: Ctx, w: number, h: number): void {
  const r = seeded(21);
  const pastel = ['#ffd1dc', '#ffe9a8', '#bfeadf', '#cfe3ff', '#ffc9a8'];
  let x = 4;
  while (x < w - 30) {
    const bw = 40 + r() * 50;
    const bh = 60 + r() * 110;
    const color = pastel[Math.floor(r() * pastel.length)];
    c.fillStyle = color;
    c.fillRect(x, h - bh, bw, bh);
    c.fillStyle = rgba('#ffffff', 0.55);
    c.fillRect(x, h - bh, bw, 5); // roof lip
    c.fillStyle = 'rgba(40,110,150,0.55)';
    for (let wy = h - bh + 14; wy < h - 18; wy += 20) {
      for (let wx = x + 7; wx < x + bw - 10; wx += 15) c.fillRect(wx, wy, 8, 11);
    }
    x += bw + 3 + r() * 6;
  }
  // a couple of striped beach umbrellas along the base
  for (const ux of [60, 190, 330, 450]) {
    poly(c, [[ux - 20, h - 24], [ux + 20, h - 24], [ux, h - 44]], '#ff5c8a');
    c.fillStyle = '#ffffff';
    c.fillRect(ux - 1, h - 24, 2, 24);
  }
}

function palmRidge(c: Ctx, w: number, h: number): void {
  const r = seeded(55);
  for (let i = 0; i < 16; i++) {
    const x = 20 + (i / 15) * (w - 40) + (r() - 0.5) * 20;
    const th = 50 + r() * 46;
    const lean = (r() - 0.5) * 18;
    c.strokeStyle = '#2b5a3a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x, h);
    c.quadraticCurveTo(x + lean * 0.4, h - th * 0.55, x + lean, h - th);
    c.stroke();
    c.fillStyle = i % 2 ? '#1f8f4e' : '#2aa760';
    for (let f = 0; f < 6; f++) {
      const a = (f / 6) * TAU;
      c.beginPath();
      c.ellipse(x + lean + Math.cos(a) * 15, h - th + Math.sin(a) * 7, 17, 5, a, 0, TAU);
      c.fill();
    }
  }
}

function clouds(c: Ctx, w: number): void {
  const r = seeded(99);
  c.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 9; i++) {
    const cx = (i / 9) * w + r() * 40;
    const cy = 40 + r() * 70;
    for (let k = 0; k < 5; k++) {
      const rad = 16 + r() * 22;
      for (const dx of [0, -w, w]) circle(c, cx + dx + k * 22 - 44, cy + (r() - 0.5) * 12, rad, 'rgba(255,255,255,0.8)');
    }
  }
}

function sandfield(c: Ctx, w: number, h: number): void {
  c.fillStyle = vGradient(c, 0, h, [
    [0, '#ffe9b0'],
    [1, '#f4cf8a'],
  ]);
  c.fillRect(0, 0, w, h);
  const r = seeded(3);
  for (let i = 0; i < 160; i++) {
    c.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.4})`;
    c.fillRect(r() * w, r() * h, 1, 1);
  }
}

export function generateSceneryTextures(scene: Phaser.Scene): void {
  makeTexture(scene, 'sky', 450, 380, sky);
  makeTexture(scene, 'sunGlow', 450, 200, sunGlow);
  makeTexture(scene, 'farIslands', 600, 190, (c, w, h) => islands(c, w, h, '#6fc9c8', '#9ddfda', 11, 0.3));
  makeTexture(scene, 'midIslands', 600, 200, (c, w, h) => islands(c, w, h, '#2fa070', '#58c48c', 12, 0.35));
  makeTexture(scene, 'ocean', 450, 60, ocean);
  makeTexture(scene, 'resort', 540, 220, resort);
  makeTexture(scene, 'palmRidge', 600, 130, palmRidge);
  makeTexture(scene, 'clouds', 900, 150, clouds);
  makeTexture(scene, 'fog', 8, 140, (c, w, h) => {
    c.fillStyle = vGradient(c, 0, h, [
      [0, 'rgba(255,236,210,0)'],
      [0.22, 'rgba(255,236,210,0.85)'],
      [0.5, 'rgba(255,240,220,0.55)'],
      [1, 'rgba(255,240,220,0)'],
    ]);
    c.fillRect(0, 0, w, h);
  });
  makeTexture(scene, 'sandfield', 450, 520, sandfield);
}
