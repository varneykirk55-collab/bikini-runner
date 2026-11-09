# Animation contract

How the runner's animation works, what is replaceable, and what a new character's sheets must match.

## What the animation system actually is

The source game (Valhalla Run) has **no skeletal animation at runtime**. Its animations are three baked
sprite sheets (rear view, one row, 8 frames each) rendered offline from a rigged 3D character, plus frame-selection
logic. That logic, not the pictures, is what transferred:

| Clip | Sheet | Frames | Timing rule | Code |
|---|---|---|---|---|
| Run | `run.png` | 8 | loops across `runCycle` = 0.5333 s at start speed; playback rate = speed / SPEED.start | `PlayerMotion.pose()` |
| Jump | `jump.png` | 8 | frame = airtime / total airtime × 8; once falling, never earlier than the half-way pose | `PlayerMotion.pose()` |
| Slide | `slide.png` | 8 | plays once across `PLAYER.slideTime` = 0.7 s (source clip was 1.533 s, fitted) | `PlayerMotion.pose()` |
| Flight | `jump.png` frame 4 | – | held while the flight power-up lasts | `PlayerMotion.pose()` |

"Controllers", "transitions" and "blending" in this game are the priority order in `pose()`
(flight > airborne > sliding > running), the per-frame state flags, and the foot-plant event that drives particle
puffs. There is no blend tree and none was invented. All of it is covered by `tests/playerMotion.test.ts`.

## Sheet layout (the contract)

- One PNG per clip, **one row of 8 frames, each 303 × 430 px** (sheet 2424 × 430), transparent background.
- Rear view (camera behind the runner), matching the chase camera.
- Feet anchored at **x = 0.5116 × 303, y = 0.9485 × 430** in every frame (`RUNNER.originX/originY`).
- Run and jump are in-place: the track moves, not the character. Jump poses are planted on the ground; the
  physics hop supplies the height.
- Frames are drawn at one scale. `RUNNER.scale` (0.4242) maps texture pixels to game pixels so hair-to-ground is
  about 1.119 m at `UNIT_PX`.
- If the slide sheet is baked with a wider camera than run/jump (the original was), standing silhouettes will be
  smaller; measure standing alpha height in run vs slide and set `RUNNER.slideScale = scale × (runHeight / slideHeight)`.
  The original ratio was 389 / 274.

If a new character changes frame size or frame counts, edit **only** `src/player/animation.ts`.

## What was changed from Valhalla Run

- The shipped sheets are neutral placeholder mannequins (`tools/make_placeholder_sheets.py`), not the Viking
  renders, because the sheets *are* the Viking character and must not carry over.
- `slideScale` equals `scale` for the placeholders (no wider-camera correction needed).
- Nothing else about timing or behaviour was changed.

## Original authoring metadata

`docs/original-slide-meta.json` is the original slide sheet's bake notes, kept as a reference for reproducing the
pipeline (orthographic rear camera, Mixamo bone retarget of 33 bones, hips travel removed, per-frame grounding,
frames sampled from a 30 fps clip). The source rig and Mixamo clips are **not in the Valhalla Run repository**;
only the baked sheets are.
