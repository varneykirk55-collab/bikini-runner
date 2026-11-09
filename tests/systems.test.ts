import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SPEED } from '../src/config';
import { KEYMAP, SwipeRecognizer, Command } from '../src/input/commands';
import { OBSTACLES } from '../src/obstacles/defs';
import { difficultyAt, pickObstacle, speedAt } from '../src/systems/Difficulty';
import { StraightPath } from '../src/track/TrackPath';

test('difficulty ramps monotonically from 0 to 1 over rampDistance; speed spans start..max', () => {
  assert.equal(difficultyAt(0), 0);
  assert.equal(difficultyAt(SPEED.rampDistance), 1);
  assert.equal(difficultyAt(SPEED.rampDistance * 3), 1);
  let prev = -1;
  for (let d = 0; d <= SPEED.rampDistance; d += 50) {
    const v = difficultyAt(d);
    assert.ok(v >= prev);
    prev = v;
  }
  assert.equal(speedAt(0), SPEED.start);
  assert.equal(speedAt(1), SPEED.max);
});

test('obstacle mix: creatures phase in with difficulty, passableOnly never returns a lane-dodge', () => {
  const kindsAt = (d: number, passableOnly = false) => {
    const seen = new Set<string>();
    for (let i = 0; i < 4000; i++) seen.add(pickObstacle(d, passableOnly));
    return seen;
  };
  const early = kindsAt(0);
  assert.ok(!early.has('seagull') && !early.has('crab'));
  const late = kindsAt(1);
  assert.ok(late.has('seagull') && late.has('crab'));
  for (const k of kindsAt(1, true)) assert.notEqual(OBSTACLES[k as keyof typeof OBSTACLES].avoid, 'lane');
});

function swipeCollector(threshold?: number) {
  const out: Command[] = [];
  return { out, s: new SwipeRecognizer((c) => out.push(c), threshold) };
}

test('swipes map to commands and fire once, as soon as the threshold is passed', () => {
  const { out, s } = swipeCollector(34);
  s.down(100, 100, 1);
  s.move(110, 100, 1, true);
  assert.deepEqual(out, []);
  s.move(60, 102, 1, true); // 40px left
  s.move(0, 100, 1, true); // still down: must not fire again
  s.up(0, 100, 1);
  assert.deepEqual(out, ['left']);

  for (const [dx, dy, want] of [[50, 0, 'right'], [0, -50, 'jump'], [0, 50, 'slide']] as const) {
    const t = swipeCollector(34);
    t.s.down(100, 100, 1);
    t.s.move(100 + dx, 100 + dy, 1, true);
    t.s.up(100 + dx, 100 + dy, 1);
    assert.deepEqual(t.out, [want]);
  }
});

test('a quick flick that only reports down+up needs 60% of the threshold; shorter is ignored', () => {
  const a = swipeCollector(34);
  a.s.down(0, 0, 1);
  a.s.up(0, -22, 1);
  assert.deepEqual(a.out, ['jump']);
  const b = swipeCollector(34);
  b.s.down(0, 0, 1);
  b.s.up(0, -15, 1);
  assert.deepEqual(b.out, []);
});

test('presses on UI and other fingers are not swipes', () => {
  const a = swipeCollector();
  a.s.down(0, 0, 1, true); // pause button
  a.s.move(100, 0, 1, true);
  assert.deepEqual(a.out, []);
  const b = swipeCollector();
  b.s.down(0, 0, 1);
  b.s.move(100, 0, 2, true); // a different pointer
  assert.deepEqual(b.out, []);
});

test('keyboard map covers arrows, WASD and space', () => {
  assert.equal(KEYMAP.ArrowLeft, 'left');
  assert.equal(KEYMAP.KeyD, 'right');
  assert.equal(KEYMAP.Space, 'jump');
  assert.equal(KEYMAP.KeyS, 'slide');
});

test('StraightPath: always heading 0, position along z, never a turn (reserved seam for turns)', () => {
  const p = new StraightPath();
  assert.deepEqual(p.sample(123), { distance: 123, heading: 0, x: 0, z: 123 });
  assert.equal(p.headingAt(5000), 0);
  assert.equal(p.turnAhead(0, 1e6), null);
});
