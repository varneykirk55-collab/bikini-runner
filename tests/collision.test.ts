import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hitsObstacle, touchesPickup } from '../src/collision/collision';
import { PLAYER } from '../src/config';
import { OBSTACLES } from '../src/obstacles/defs';
import { PlayerMotion } from '../src/player/PlayerMotion';
import { ObstacleKind } from '../src/types';

const STAND: [number, number] = [0, PLAYER.standHeight];
const SLIDING: [number, number] = [0, PLAYER.slideHeight];

function at(kind: ObstacleKind, z: number, prevZ = z, lane = 0) {
  return { lane, z, prevZ, def: OBSTACLES[kind] };
}

test('no hit while the obstacle is still ahead or already behind', () => {
  assert.equal(hitsObstacle(0, STAND, at('sandcastle', 5)), false);
  assert.equal(hitsObstacle(0, STAND, at('sandcastle', -5, -4.9)), false);
  assert.equal(hitsObstacle(0, STAND, at('sandcastle', 0)), true);
});

test('swept z interval: a fast obstacle that crosses the player between frames still hits (no tunnelling)', () => {
  // previous frame 3 units ahead, this frame 3 units behind: it passed straight through the player
  assert.equal(hitsObstacle(0, STAND, { lane: 0, z: -3, prevZ: 3, def: OBSTACLES.sandcastle }), true);
  // overlapping the hit depth on the previous frame counts too
  assert.equal(hitsObstacle(0, STAND, { lane: 0, z: -0.2, prevZ: 0.9, def: OBSTACLES.sandcastle }), true);
  // but one that was already fully behind on the previous frame does not
  assert.equal(hitsObstacle(0, STAND, { lane: 0, z: -3, prevZ: -2.5, def: OBSTACLES.sandcastle }), false);
});

test('other lanes never hit; the lateral radius is respected', () => {
  assert.equal(hitsObstacle(0, STAND, at('sandcastle', 0, 0, 1)), false);
  assert.equal(hitsObstacle(0.5, STAND, at('sandcastle', 0, 0, 0)), true); // within laneHitRadius
  assert.equal(hitsObstacle(PLAYER.laneHitRadius + 0.01, STAND, at('sandcastle', 0, 0, 0)), false);
});

test('every obstacle can be beaten the way its definition says, and only that way', () => {
  for (const [kind, def] of Object.entries(OBSTACLES) as Array<[ObstacleKind, (typeof OBSTACLES)[ObstacleKind]]>) {
    const body = at(kind, 0);
    const jumpPeak = PLAYER.jumpVelocity ** 2 / (2 * PLAYER.gravity);
    const clearingJump: [number, number] = [def.span[1] + 0.01, def.span[1] + 0.01 + PLAYER.standHeight];
    if (def.avoid === 'jump') {
      assert.equal(hitsObstacle(0, STAND, body), true, `${kind}: a standing runner hits it`);
      assert.ok(def.span[1] < jumpPeak, `${kind}: low enough to clear with a jump`);
      assert.equal(hitsObstacle(0, clearingJump, body), false, `${kind}: jumping clears it`);
    } else if (def.avoid === 'slide') {
      assert.equal(hitsObstacle(0, STAND, body), true, `${kind}: a standing runner hits it`);
      assert.equal(hitsObstacle(0, SLIDING, body), false, `${kind}: sliding passes under it`);
    } else {
      assert.equal(hitsObstacle(0, STAND, body), true, `${kind}: standing hits`);
      assert.equal(hitsObstacle(0, SLIDING, body), true, `${kind}: sliding hits`);
      assert.equal(hitsObstacle(1, STAND, at(kind, 0, 0, 0)), false, `${kind}: changing lane avoids it`);
    }
  }
});

test('works with live PlayerMotion state: jumping over a sandcastle', () => {
  const m = new PlayerMotion();
  m.jump();
  for (let i = 0; i < 40; i++) m.update(1 / 120, 14); // near the apex
  assert.equal(hitsObstacle(m.x, m.span(), at('sandcastle', 0)), false);
});

test('pickups: collected inside the lane/height window, not outside', () => {
  const near = { lane: 0, z: 0.1, prevZ: 0.3, elev: 0.45 };
  assert.equal(touchesPickup(0, STAND, near), true);
  assert.equal(touchesPickup(0, STAND, { ...near, lane: 1 }), false);
  assert.equal(touchesPickup(0, STAND, { ...near, z: 2, prevZ: 2.5 }), false);
  assert.equal(touchesPickup(0, STAND, { ...near, elev: 2.4 }), false);
  assert.equal(touchesPickup(0, [PLAYER.flightHeight, PLAYER.flightHeight + 0.92], { ...near, elev: 2.6 }), true);
});
