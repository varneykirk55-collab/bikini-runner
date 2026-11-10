# Integrating the Hunyuan character

The character is in. She is the baked sprite sheets in `src/assets/runner/` (`run`, `jump`, `slide`, `idle`),
played by the existing 2D animation contract. `bikini_runner_web.glb` (73-joint skin, Run / RunningJump /
RunningSlide, Draco + WebP) is committed next to the sheets as the source model and is not loaded at runtime.

`RUNNER.scale` and `RUNNER.slideScale` are both `0.5267460109861366` (0.5267). That keeps her run silhouette at
the same on-screen height as the previous runner, so the world-unit hitboxes were left as they were.

## Important constraint

This is a **2D sprite game with pseudo-3D projection**, not a 3D engine scene. The rigged model is the bake
source. Runtime playback is the sheets in `ANIMATION_CONTRACT.md`, which keeps the engine and the mobile
performance profile unchanged.

## What landed

1. Rigged model with Run, RunningJump and RunningSlide, committed as `bikini_runner_web.glb`.
2. Sheets baked at 303 × 430, feet at (0.5116, 0.9485), one camera for run, jump, slide and idle.
3. Drop-in under the existing texture keys, plus `runner_idle` for standing poses. `slideScale` equals `scale`.
4. Scenery and UI are still procedural. Replace those one key at a time (`src/gfx/scenery.ts`, `src/gfx/props.ts`,
   `src/gfx/ui.ts`).

The game stays 2D. A real-time 3D character would be a rendering rewrite and is not part of this pass.
