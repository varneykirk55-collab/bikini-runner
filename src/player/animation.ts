/**
 * Animation contract for the runner sprite sheets.
 *
 * The timing and layout is the contract. The pictures are the baked bikini runner
 * (rear ortho, feet on the origin in every frame). `src/assets/runner/bikini_runner_web.glb`
 * is the rigged source model, kept for re-bakes. The game is 2D and does not load it.
 *
 * Sheets (each one row of 8 frames, 303 x 430 px per frame, rear view):
 * - run:   8 frames across `runCycle` seconds, looped; playback rate scales with speed.
 * - jump:  8 frames, driven by airtime (not by the clip's own timing). Poses are
 *          planted on the ground; the physics hop supplies the height.
 * - slide: 8 frames, played once across PLAYER.slideTime, floor contact kept.
 * - idle:  one 303 x 430 standing frame (`IDLE_KEY`), for title, a grounded pause, and the wipeout.
 *
 * One camera and one scale cover every sheet, including slide, so there is no
 * separate slide-size correction. 0.5267 (the precise value below) maps the ~306 px
 * run silhouette to the same ~1.119 unit on-screen height as the previous runner.
 * `PLAYER.standHeight` / `slideHeight` stay in world units and still line up with that body.
 */
export const RUNNER = {
  frameWidth: 303,
  frameHeight: 430,
  originX: 0.5115511551155115,
  originY: 0.9484765369303741,
  /** Maps texture pixels to game pixels (hair-to-ground ≈ 1.119 m at UNIT_PX). */
  scale: 0.5267460109861366,
  /** Same camera as run/jump/idle, so the same scale. */
  slideScale: 0.5267460109861366,
  runFrames: 8,
  jumpFrames: 8,
  slideFrames: 8,
  /** Source clip length. Playback is fit to PLAYER.slideTime. */
  slideClip: 1.5333333333333334,
  runCycle: 0.5333333611488342,
} as const;

/** Texture keys the loader registers for the three sheets. */
export const SHEET_KEYS = {
  run: 'runner_run',
  jump: 'runner_jump',
  slide: 'runner_slide',
} as const;

export type PoseKey = keyof typeof SHEET_KEYS;

/** Single standing frame. Not a pose() result: the action clips still win while running. */
export const IDLE_KEY = 'runner_idle';

export interface Pose {
  key: PoseKey;
  frame: number;
}
