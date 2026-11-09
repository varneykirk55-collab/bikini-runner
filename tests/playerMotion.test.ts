import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLAYER, SPEED } from '../src/config';
import { RUNNER } from '../src/player/animation';
import { PlayerMotion } from '../src/player/PlayerMotion';

const DT = 1 / 120;

function counters() {
  const n = { lane: [] as number[], jump: 0, land: 0, slide: 0 };
  const events = {
    onLane: (d: -1 | 1) => n.lane.push(d),
    onJump: () => n.jump++,
    onLand: () => n.land++,
    onSlide: () => n.slide++,
  };
  return { n, events };
}

test('lane switching clamps to three lanes and raises one event per real move', () => {
  const { n, events } = counters();
  const m = new PlayerMotion(events);
  m.moveLeft();
  m.moveLeft(); // already at -1: ignored
  assert.equal(m.lane, -1);
  m.moveRight();
  m.moveRight();
  m.moveRight(); // already at +1: ignored
  assert.equal(m.lane, 1);
  assert.deepEqual(n.lane, [-1, 1, 1]);
});

test('lateral position eases to the target lane and snaps when close', () => {
  const m = new PlayerMotion();
  m.moveRight();
  for (let i = 0; i < 240; i++) m.update(DT, SPEED.start);
  assert.equal(m.x, 1);
});

test('jump: airtime and peak follow the configured physics, one jump + one land event', () => {
  const { n, events } = counters();
  const m = new PlayerMotion(events);
  m.jump();
  m.jump(); // ignored while airborne
  let t = 0;
  let peak = 0;
  while (m.airborne && t < 3) {
    m.update(DT, SPEED.start);
    peak = Math.max(peak, m.h);
    t += DT;
  }
  const airtime = (2 * PLAYER.jumpVelocity) / PLAYER.gravity;
  const expectedPeak = (PLAYER.jumpVelocity ** 2) / (2 * PLAYER.gravity);
  assert.ok(Math.abs(t - airtime) < 0.03, `airtime ${t} vs ${airtime}`);
  // The integrator is semi-implicit Euler (carried over unchanged), which under-shoots the analytic peak slightly.
  assert.ok(peak < expectedPeak && expectedPeak - peak < 0.06, `peak ${peak} vs analytic ${expectedPeak}`);
  assert.equal(m.h, 0);
  assert.equal(n.jump, 1);
  assert.equal(n.land, 1);
});

test('jump animation: frames advance 0→7 monotonically over the airtime', () => {
  const m = new PlayerMotion();
  m.jump();
  const frames: number[] = [];
  while (m.airborne) {
    m.update(DT, SPEED.start);
    if (m.airborne) {
      const p = m.pose();
      assert.equal(p.key, 'jump');
      frames.push(p.frame);
    }
  }
  assert.equal(frames[0], 0);
  assert.equal(frames[frames.length - 1], RUNNER.jumpFrames - 1);
  for (let i = 1; i < frames.length; i++) assert.ok(frames[i] >= frames[i - 1], 'jump frames never go backwards');
});

test('slide: lasts slideTime, lowers the hitbox, plays the 8 frames once', () => {
  const { n, events } = counters();
  const m = new PlayerMotion(events);
  m.slide();
  m.slide(); // re-swipe mid-slide: no second slide event
  assert.equal(m.sliding, true);
  assert.equal(n.slide, 1);
  assert.deepEqual(m.span(), [0, PLAYER.slideHeight]);
  const frames: number[] = [];
  let t = 0;
  while (m.sliding && t < 2) {
    const p = m.pose();
    assert.equal(p.key, 'slide');
    frames.push(p.frame);
    m.update(DT, SPEED.start);
    t += DT;
  }
  assert.ok(Math.abs(t - PLAYER.slideTime) < 0.03, `slide length ${t}`);
  assert.equal(frames[0], 0);
  assert.equal(frames[frames.length - 1], RUNNER.slideFrames - 1);
  for (let i = 1; i < frames.length; i++) assert.ok(frames[i] >= frames[i - 1]);
  assert.deepEqual(m.span(), [0, PLAYER.standHeight]);
});

test('slide in mid-air slams down and starts the slide on landing', () => {
  const { n, events } = counters();
  const m = new PlayerMotion(events);
  m.jump();
  for (let i = 0; i < 10; i++) m.update(DT, SPEED.start);
  m.slide();
  assert.equal(m.sliding, false, 'not sliding until it lands');
  while (m.airborne) m.update(DT, SPEED.start);
  assert.equal(m.sliding, true);
  assert.equal(n.slide, 1);
  assert.equal(n.land, 1);
});

test('run cycle: 8 frames across runCycle seconds at start speed, faster when speed rises', () => {
  const m = new PlayerMotion();
  const seen = new Set<number>();
  for (let t = 0; t < RUNNER.runCycle; t += DT) {
    m.update(DT, SPEED.start);
    const p = m.pose();
    assert.equal(p.key, 'run');
    seen.add(p.frame);
  }
  assert.equal(seen.size, RUNNER.runFrames);

  const fast = new PlayerMotion();
  const slow = new PlayerMotion();
  for (let i = 0; i < 60; i++) {
    fast.update(DT, SPEED.max);
    slow.update(DT, SPEED.start);
  }
  assert.ok(fast.stride > slow.stride, 'higher speed plays the cycle faster');
});

test('flight: rises to cruising height, shows the mid jump frame, ignores slide, grace period on landing', () => {
  const m = new PlayerMotion();
  m.setFlying(true);
  for (let i = 0; i < 600; i++) m.update(DT, SPEED.start);
  assert.ok(Math.abs(m.h - PLAYER.flightHeight) < 0.05);
  assert.deepEqual(m.pose(), { key: 'jump', frame: Math.floor(RUNNER.jumpFrames / 2) });
  m.slide();
  assert.equal(m.sliding, false);
  m.setFlying(false);
  assert.ok(m.invuln >= PLAYER.flightLandingGrace);
  while (m.airborne) m.update(DT, SPEED.start);
  assert.equal(m.h, 0);
});
