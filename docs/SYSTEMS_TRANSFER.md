# Systems transfer report (Phase 1)

Source inspected: `varneykirk55-collab/valhalla-run` @ `8e5175a` (read-only shallow clone, never modified).

## 1. What Valhalla Run is

| Area | Finding |
|---|---|
| Engine / language | Phaser 3.90 (Canvas/WebGL auto), TypeScript 5.6, Vite 6. Only runtime dependency: `phaser`. |
| Rendering model | **2D sprites with a pseudo-3D projection** (lane / z / elevation → screen), not a 3D scene. |
| Orientation | Portrait 540 × 960, `Scale.FIT`, safe-area aware, 2 active pointers. |
| Movement | 3 lanes with smoothed lateral easing, jump (physics), slide (timer, mid-air slam-slide), flight power-up. |
| Animation | Three baked 8-frame rear-view sprite sheets (run, jump, slide) + frame-selection logic. No skeletal runtime. |
| Obstacles | 5 kinds (2 jump, 2 slide, 1 lane-dodge) with swept-z hit tests; creatures charge toward the player. |
| Track generation | 200 m segments planned ahead, gap rules, tight pairs, two-abreast rows with one lane always open. |
| Difficulty | Eased ramp over 2,200 m: speed 14 → 31 m/s, denser rows, creatures phase in. |
| Scoring | Distance + pickups (×2 power-up), persistent best (localStorage, guarded). |
| Camera | Smoothed lateral follow and a small lift on jumps; static backdrop. |
| Audio | 12 synthesised SFX (offline Web Audio, no files) + 6 MP3 songs through HTML audio (menu loop + run playlist), mute (persisted), pause/resume, autoplay unlock. |
| UI | Menu, settings, how-to-play, HUD with power-up timer rings, pause overlay, game-over panel; all procedural art. |

## 2. Systems that could not transfer directly

1. **The animations' pictures.** The run/jump/slide sheets *are* the Viking character, so they can't be carried over
   under "replace the Viking character". The **animation system transferred intact** (frame counts, timing, anchor,
   priority rules) and ships with placeholder sheets in the identical layout. This is the one real tension in the
   brief; it is resolved by preserving the contract, not the pixels.
2. **The original animation sources.** The rig and Mixamo clips the sheets were baked from are not in the repository.
   Only the baked sheets and `slide-meta.json` are. Re-baking for a new character needs those clips re-created.
3. **Music.** The six songs are Viking-themed (Iron Fjord, Shield Wall). The *music system* transferred; the songs did
   not. Placeholder loops stand in.
4. **Temple Run-style turns need real work later.** The projection is a fixed-vanishing-point lane view. Turns need a
   rotating camera and a path-aware renderer; Phase 1 only adds the seams (below).

No blocking architectural conflict was found.

## 3. Transfer status

| Required system | Status | How |
|---|---|---|
| Gameplay + player movement | Transferred, logic extracted | `player/PlayerMotion.ts` (identical formulas) |
| Lane switching, jump, slide | Transferred | same |
| Animation clips / controllers / transitions | Contract + selection logic transferred; pictures replaced | `player/animation.ts`, `PlayerMotion.pose()` |
| Collision + obstacle logic | Transferred, extracted | `collision/collision.ts`, `obstacles/defs.ts` |
| Track spawning + progression | Transferred | `obstacles/Spawner.ts`, `systems/Difficulty.ts` |
| Scoring + collectibles | Transferred | `GameScene`, `entities/Pickup.ts`, `systems/PowerUps.ts` |
| Camera | Transferred | `camera/CameraRig.ts` |
| Touch input | Transferred, extracted | `input/commands.ts` (`SwipeRecognizer`), `input/Controls.ts` |
| Menus + functionality | Transferred | `scenes/MenuScene.ts`, `PauseScene.ts`, `ui/*` |
| Audio logic | Transferred | `audio/*` (SFX synth unchanged; music engine unchanged) |
| Game state, pause, restart, settings | Transferred | `GameScene`, `PauseScene`, `Storage`, mute persistence |

Intentional gameplay equivalence: obstacle hitboxes, speeds, spawn constants, difficulty curve and power-up
durations are unchanged. Renames: rock→sandcastle, spikes→urchin, fallen tree→limbo banner, raven→seagull,
draugr→crab, runes→stars. Note: the crab keeps Valhalla's synthesised growl sound as a placeholder cue.

## 4. Visual assets removed or replaced

Viking runner sheets, all procedural Viking scenery (aurora, fjord, cliffs, pines, snow, ice walls, cobbles), the
rock / spikes / fallen-tree / pine PNGs, draugr and raven art, rune pickups and glyphs, Valkyrie wings, snow
particles, Norse UI (gold/navy bevels, knotwork, axes, crown/trophy icons, rune glyph buttons), logo, the Lilita One
and Cinzel fonts (and the Google Fonts network dependency), and all six songs. Replaced by labelled placeholders:
mannequin sheets, tropical flat-shaded scenery, beach obstacles, star/power-up icons, coral/turquoise UI, a
placeholder logo (the title screen says "PLACEHOLDER ART"), system fonts, three synthesised loops.

## 5. Architecture preparation for Temple Run-style expansion

Done now, no turn mechanics implemented:

- `track/TrackPath.ts`: `TrackPath` interface (`sample`, `headingAt`, `turnAhead`) + `StraightPath`. `GameScene` holds one and feeds
  `heading` to the camera each frame (always 0).
- `camera/CameraRig.ts`: `heading` field reserved; camera maths isolated from geometry and spawning.
- `input/commands.ts`: `TurnCommand` type reserved; consumers don't assume four commands.
- Spawning and collision work in path-relative coordinates (`lane`, `z`, distance along path).
- `TrackRenderer` is the only straight-path-specific code and sits behind its own module.

Not done (and not claimed): turns, junctions, procedural segments, camera rotation, pursuit.

## 6. Verification: what was and was not checked

Environment limit: this machine has no network and Phaser / Vite are not installed, so **the game could not be built
or launched here**.

| Check | Result | Kind |
|---|---|---|
| Unit + integrity tests (`npm test`, 28 tests) | **Pass** | Automated, ran here |
| Lane switching, jump physics/airtime/peak, slide timing + slam-slide, flight, run-cycle rate | Pass | Automated (logic only) |
| Animation frame selection (run 8 frames/cycle, jump 0→7 monotonic, slide once 0→7) | Pass | Automated (logic only) |
| Collision: swept z, lane radius, every obstacle beatable only its intended way, pickups | Pass | Automated |
| Swipe recognition (4 directions, one fire per swipe, flick threshold, UI/other-finger ignored) | Pass | Automated |
| Difficulty ramp + obstacle mix phase-in | Pass | Automated |
| Sheet dimensions match the contract; music files present and small; wired into `tracks.ts` | Pass | Automated |
| Every relative import stays inside the project; only `phaser` as a package | Pass | Automated |
| No Valhalla identity strings or asset names in runtime code; no external font/URL | Pass | Automated |
| Every texture key used in code has a generator or sheet | Pass | Automated |
| TypeScript: 0 errors outside Phaser's own types | Pass | Ran here, but with Phaser typings absent, so Phaser API usage is **not** type-checked |
| esbuild bundle with `phaser` external (syntax, import graph, asset imports) | Pass | Ran here |
| Placeholder sheets rendered and inspected visually | Pass | Manual (image preview) |
| `npm run build` (tsc + vite) | **Not run** | needs install |
| Launch in a browser, on-screen animation, spawner behaviour, scoring/game-over/restart flow | **Not run** | needs install |
| Audio playback, autoplay unlock, music/mute in a real browser | **Not run** | needs install |
| `npm run smoke` (headless browser) | **Not run** | script written, never executed |
| Real mobile-device playtest (touch feel, performance, memory, safe areas) | **Not done** | needs a phone |
| Valhalla Run unchanged | Pass | clone was read-only; `git status` clean at the end |

Anything in the "Not run" rows should be treated as unverified. The Phaser-dependent code is mostly Valhalla's own
working code with renamed identifiers, but "should work" is not "verified to work".

## 7. Known issues / remaining work

- Run `npm install && npm run build` first; fix whatever Phaser-typed lines the compiler flags (none could be
  checked here).
- All art, music, logo and fonts are placeholders.
- Crab uses a repurposed growl SFX.
- The ambient-particle and effect colours were chosen blind (no screen to look at); expect to tune them.
- Placeholder obstacle sprite proportions were sized to the original hitboxes on paper; check them on screen.
