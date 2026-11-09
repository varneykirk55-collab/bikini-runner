# Integrating the Hunyuan character

Not started. The brief says not to create or substitute the final character before the asset is provided and
approved, and it hasn't been.

## Important constraint

This is a **2D sprite game with pseudo-3D projection**, not a 3D engine scene. A 3D character (Hunyuan mesh) can't
be dropped in as a model. It has to be **baked into the three sprite sheets** described in
`ANIMATION_CONTRACT.md`, the same way the original character was. That keeps the engine, the file size and the
mobile performance profile unchanged.

## Suggested path

1. **Get the asset and approve it.** Needs a rigged, textured model (GLB/FBX), adult proportions, bikini
   materials separated if you want colour variants later. Hunyuan3D output is typically an unrigged mesh, so it
   will need rigging (e.g. Mixamo auto-rig or Blender) before it can be animated.
2. **Find or recreate the animation clips.** The original in-place clips (fast run, running jump, running slide)
   are not in the repo. Mixamo has equivalents; retarget them to the new rig. See
   `docs/original-slide-meta.json` for how the original was done (33-bone retarget, hips travel removed,
   per-frame grounding).
3. **Bake the sheets.** Orthographic camera directly behind the character; render 8 frames per clip at
   303 × 430 with the feet anchor at (0.5116, 0.9485); one uniform scale across the run and jump sheets. Sample
   the run clip across exactly one cycle. Export `run.png`, `jump.png`, `slide.png`.
4. **Drop in and tune.** Replace the three PNGs in `src/assets/runner/`. If the slide camera differs, set
   `RUNNER.slideScale`. `npm test` re-checks sheet dimensions against the contract.
5. **Then the rest of the art.** Replace procedural scenery/props one key at a time (see the key lists at the top
   of `src/gfx/scenery.ts` and `src/gfx/props.ts`); real UI art replaces the functions in `src/gfx/ui.ts`.

## Decision needed from you

Whether the final game should stay 2D baked sprites (recommended for the "same performance, no engine change"
goal) or move to real-time 3D characters. The latter would need a rendering rewrite and is outside this phase.
