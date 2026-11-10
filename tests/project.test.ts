import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { GAME_W, HORIZON_Y, PLAYER } from '../src/config';
import { IDLE_KEY, RUNNER, SHEET_KEYS } from '../src/player/animation';
import { OBSTACLES } from '../src/obstacles/defs';
import { POWER_KINDS } from '../src/systems/PowerUps';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const tsFiles = walk(SRC).filter((f) => f.endsWith('.ts'));
const read = (f: string) => readFileSync(f, 'utf8');

/** Remove // and /* *\/ comments so provenance notes don't count as runtime content. */
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function pngSize(file: string): [number, number] {
  const b = readFileSync(file);
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${file} is a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test('runner sheets match the animation contract (8 frames of 303x430, one row)', () => {
  for (const name of Object.keys(SHEET_KEYS)) {
    const [w, h] = pngSize(join(SRC, 'assets', 'runner', `${name}.png`));
    const frames = name === 'run' ? RUNNER.runFrames : name === 'jump' ? RUNNER.jumpFrames : RUNNER.slideFrames;
    assert.equal(w, RUNNER.frameWidth * frames, `${name}.png width`);
    assert.equal(h, RUNNER.frameHeight, `${name}.png height`);
  }
  const [idleW, idleH] = pngSize(join(SRC, 'assets', 'runner', 'idle.png'));
  assert.equal(idleW, RUNNER.frameWidth, 'idle.png width');
  assert.equal(idleH, RUNNER.frameHeight, 'idle.png height');
});

test('display scale keeps the baked silhouette on the height the hitboxes were tuned for', () => {
  // Mean of sheets-meta.json run.standingAlphaHeightPx. Target hair-to-ground is 1.119 units.
  const meanRunPx = (309.8 + 300.8 + 304.8 + 310.8 + 308.8 + 299.8 + 302.8 + 306.8) / 8;
  const units = (meanRunPx * RUNNER.scale) / 144;
  assert.ok(Math.abs(units - 1.119) < 0.01, `run silhouette is ${units.toFixed(3)} units`);
  assert.equal(RUNNER.scale, RUNNER.slideScale);
  // Lowest slide body (slide frame 3 alpha, 420-305 px) stays under the limbo bar at 0.55.
  const lowestSlideUnits = (115 * RUNNER.slideScale) / 144;
  assert.ok(lowestSlideUnits < 0.55, `slide body ${lowestSlideUnits.toFixed(3)} should clear the limbo`);
  assert.ok(Math.abs(lowestSlideUnits - PLAYER.slideHeight) < 0.08, 'slide hitbox still matches the low pose');
  assert.ok(PLAYER.standHeight < units && PLAYER.standHeight > lowestSlideUnits);
});

test('the rigged model is committed as a source asset and is not loaded at runtime', () => {
  const glb = join(SRC, 'assets', 'runner', 'bikini_runner_web.glb');
  assert.ok(existsSync(glb) && statSync(glb).size > 1_000_000, 'bikini_runner_web.glb');
  for (const file of tsFiles) {
    const code = stripComments(read(file));
    assert.ok(!code.includes('.glb'), `${relative(ROOT, file)} must not load the rig`);
  }
});

test('every relative import resolves to a file inside this project; the only package is phaser', () => {
  const importRe = /(?:from|import)\s*['"]([^'"]+)['"]/g;
  for (const file of tsFiles) {
    const text = stripComments(read(file));
    for (const m of text.matchAll(importRe)) {
      const spec = m[1];
      if (!spec.startsWith('.')) {
        assert.equal(spec, 'phaser', `${relative(ROOT, file)} imports package '${spec}'`);
        continue;
      }
      const base = resolve(dirname(file), spec);
      assert.ok(base.startsWith(ROOT + sep), `${relative(ROOT, file)} imports outside the project: ${spec}`);
      const candidates = [base, `${base}.ts`, join(base, 'index.ts')];
      assert.ok(candidates.some((c) => existsSync(c) && statSync(c).isFile()), `${relative(ROOT, file)}: cannot resolve '${spec}'`);
    }
  }
});

test('package.json is its own project with phaser as the only runtime dependency', () => {
  const pkg = JSON.parse(read(join(ROOT, 'package.json')));
  assert.equal(pkg.name, 'bikini-runner');
  assert.deepEqual(Object.keys(pkg.dependencies), ['phaser']);
  assert.ok(!JSON.stringify(pkg).toLowerCase().includes('valhalla'));
});

test('no Valhalla Run visual identity in runtime code or shipped asset names', () => {
  const banned = /valhalla|viking|norse|nordic|rune|draugr|raven|odin|fjord|aurora|shield wall|iron fjord|lilita|cinzel/i;
  for (const file of tsFiles) {
    const code = stripComments(read(file));
    const hit = code.match(banned);
    assert.equal(hit, null, `${relative(ROOT, file)} contains '${hit?.[0]}'`);
  }
  for (const file of walk(join(SRC, 'assets'))) {
    assert.ok(!banned.test(relative(SRC, file)), `asset name carries old identity: ${file}`);
  }
  const html = read(join(ROOT, 'index.html'));
  assert.ok(!banned.test(html), 'index.html carries old identity');
  assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(html), 'no external font host');
});

test('no runtime network dependencies in source (no http(s) URLs outside comments)', () => {
  for (const file of tsFiles) {
    const code = stripComments(read(file));
    assert.ok(!/https?:\/\//.test(code), `${relative(ROOT, file)} references a URL`);
  }
});

test('every texture key referenced in code has a generator or a loaded sheet', () => {
  // keys produced by the procedural generators
  const generated = new Set<string>();
  for (const file of tsFiles.filter((f) => f.includes(`${sep}gfx${sep}`))) {
    for (const m of read(file).matchAll(/makeTexture\(\s*scene,\s*'([A-Za-z0-9_]+)'/g)) generated.add(m[1]);
  }
  for (const key of Object.values(SHEET_KEYS)) generated.add(key);
  generated.add(IDLE_KEY);
  // images loaded straight from files in BootScene (the painted backdrop)
  for (const m of read(join(ROOT, 'src', 'scenes', 'BootScene.ts')).matchAll(/load\.image\(\s*'([A-Za-z0-9_]+)'/g)) generated.add(m[1]);
  assert.ok(generated.size > 20, 'found the generators');

  const needed = new Set<string>(['pickup_star_a', 'pickup_star_b', 'pickup_star_c', 'palm', 'tikiTorch', 'parasail']);
  for (const def of Object.values(OBSTACLES)) for (const f of def.frames) needed.add(f);
  for (const k of POWER_KINDS) needed.add(`pickup_${k}`);

  const literalRes = [
    /\.image\(\s*[^,()]+,\s*[^,()]+,\s*'([A-Za-z0-9_]+)'/g,
    /\.particles\(\s*[^,()]+,\s*[^,()]+,\s*'([A-Za-z0-9_]+)'/g,
    /\.tileSprite\(\s*[^,()]+,\s*[^,()]+,\s*[^,()]+,\s*[^,()]+,\s*'([A-Za-z0-9_]+)'/g,
  ];
  for (const file of tsFiles.filter((f) => !f.includes(`${sep}gfx${sep}`))) {
    const code = stripComments(read(file));
    for (const re of literalRes) for (const m of code.matchAll(re)) needed.add(m[1]);
  }
  for (const key of needed) assert.ok(generated.has(key), `texture '${key}' is used but never generated`);
});

test('backdrop image exists and fits the horizon band (540 x HORIZON_Y)', () => {
  const buf = readFileSync(join(ROOT, 'src', 'assets', 'backdrop', 'backdrop.jpg'));
  assert.ok(buf.length < 400_000, 'backdrop stays small for mobile');
  // JPEG: find the SOF marker for dimensions
  let i = 2;
  let w = 0;
  let h = 0;
  while (i < buf.length) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      h = buf.readUInt16BE(i + 5);
      w = buf.readUInt16BE(i + 7);
      break;
    }
    i += 2 + len;
  }
  assert.ok(w > 0 && h > 0, 'read jpeg size');
  assert.ok(Math.abs(w / h - GAME_W / HORIZON_Y) < 0.01, `backdrop ${w}x${h} matches ${GAME_W}x${HORIZON_Y}`);
});

test('placeholder music files exist and are small enough for mobile', () => {
  const dir = join(SRC, 'assets', 'music');
  const files = readdirSync(dir).filter((f) => f.endsWith('.mp3'));
  assert.ok(files.length >= 3);
  let total = 0;
  for (const f of files) total += statSync(join(dir, f)).size;
  assert.ok(total < 2 * 1024 * 1024, `music is ${total} bytes`);
  const tracks = read(join(SRC, 'audio', 'tracks.ts'));
  for (const f of files) assert.ok(tracks.includes(f), `${f} is wired into tracks.ts`);
});
