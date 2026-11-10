# Bikini Runner

Browser-first, mobile-focused endless runner. Stack: Phaser 3.90 + TypeScript + Vite, portrait, pseudo-3D
three-lane track.

The runner is the baked bikini character: `run.png`, `jump.png`, `slide.png` and `idle.png` in
`src/assets/runner/`, drawn at one scale (`RUNNER.scale` = `RUNNER.slideScale` = 0.5267). The rigged model
`bikini_runner_web.glb` sits beside those sheets as a source asset and is not loaded; the game stays 2D.
Scenery, obstacles and music are still placeholder. See [docs/ANIMATION_CONTRACT.md](docs/ANIMATION_CONTRACT.md)
and [docs/HUNYUAN_INTEGRATION.md](docs/HUNYUAN_INTEGRATION.md).

## Run

```bash
npm install
npm run dev        # open the printed Network URL on your phone (same Wi-Fi)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm test           # unit + integrity tests (no browser needed)
npm run smoke      # headless-browser smoke test (needs `npm run preview` running; see scripts/smoke.mjs)
```

Requires Node 20+. `npm test` additionally uses `tsx` (a dev dependency).

## Controls

| Action | Touch | Keyboard |
|---|---|---|
| Change lane | swipe left / right | ← → / A D |
| Jump | swipe up | ↑ / W / Space |
| Slide | swipe down (mid-air = slam down) | ↓ / S |
| Pause | Pause button | P / Esc |
| Mute effects | Settings → Sound | M |

Obstacles: **driftwood, rocks** → jump or change lane · **tiki gate, tropical bird** → slide · **coconut crab** →
change lane. Pickups: blossoms (+10), and power-ups Life Ring (shield), Shell Magnet, ×2 Stars, Parasail (flight).

## Structure: the five concerns are separate

```
src/
  config.ts            all tuning: speeds, jump physics, spawn gaps, durations
  types.ts
  player/              1. movement + animation
    PlayerMotion.ts      lanes, jump, slide, flight, frame choice  (no Phaser: unit-tested)
    Player.ts            Phaser view over PlayerMotion
    animation.ts         the sprite-sheet contract (frame size, counts, timing, anchor)
  track/               2. track generation + geometry
    TrackPath.ts         the course shape as a function of distance (StraightPath today)
    TrackRenderer.ts     draws the straight 3-lane path in perspective
  obstacles/           3. obstacle placement + collision
    defs.ts              obstacle table: hitboxes, approach speed, how to avoid (no Phaser)
    Spawner.ts           segment planning + spawning (works in distance along the path)
  collision/collision.ts  hit tests (no Phaser: unit-tested)
  camera/CameraRig.ts  4. camera follow + orientation (`heading` reserved for turns)
  input/               5. input + directional commands
    commands.ts          Command type, key map, SwipeRecognizer (no Phaser: unit-tested)
    Controls.ts          binds Phaser pointer/keyboard events to the above
  systems/             Difficulty, PowerUps, Effects, Background, Storage
  entities/            TrackEntity base, Obstacle, Pickup, Decor
  audio/               Sfx (synthesised effects), Music (playlist), synth, unlock
  scenes/              Boot → Menu → Game (+ Pause overlay)
  ui/                  Hud, GameOverPanel, components, theme
  gfx/                 placeholder art generators (scenery, props, ui)
  assets/              runner sprite sheets, placeholder music
tools/                 regenerate the placeholder sheets and music
tests/                 node:test suites
docs/                  transfer report, animation contract, Hunyuan plan, original slide metadata
```

World model: every object has a `lane`, a `z` (distance ahead along the path) and an `elev`. Nothing outside
`track/` knows the path is straight, which is what the future Temple Run-style expansion relies on.

## Replacing placeholders

Everything procedural is generated at boot and **skips any texture key that already exists**, so a real image
loaded under the same key in `BootScene.preload()` wins. The runner sheets already follow
`docs/ANIMATION_CONTRACT.md` (`runner_run`, `runner_jump`, `runner_slide`, plus `runner_idle`). Music: replace
the MP3s and edit `src/audio/tracks.ts`.

## Status

See [docs/SYSTEMS_TRANSFER.md](docs/SYSTEMS_TRANSFER.md) for what was transferred, what was replaced, and exactly
what has and has not been verified.
