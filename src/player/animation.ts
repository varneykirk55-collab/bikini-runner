/**
 * Animation contract for the runner sprite sheets.
 *
 * Carried over from Valhalla Run unchanged except where noted. The *timing and
 * layout* is the contract; the pictures inside the sheets are replaceable.
 *
 * Sheets (each one row of 8 frames, 303 x 430 px per frame, rear view):
 * - run:   8 frames across `runCycle` seconds, looped; playback rate scales with speed.
 * - jump:  8 frames, driven by airtime (not by the clip's own timing). Poses are
 *          planted on the ground; the physics hop supplies the height.
 * - slide: 8 frames, played once across PLAYER.slideTime.
 *
 * To drop in a new character: bake it to three sheets with this exact layout
 * (frame size, 8 frames, feet anchored at originX/originY) and replace the PNGs in
 * src/assets/runner/. No code change is needed unless the new sheets' frame
 * size or frame counts differ, in which case edit only this file.
 *
 * CHANGED FROM VALHALLA RUN: the shipped sheets are neutral PLACEHOLDER mannequins
 * (tools/make_placeholder_sheets.py), drawn at one uniform scale. Valhalla's slide
 * sheet was baked with a wider camera, so it needed slideScale = scale * (389/274).
 * The placeholders need no such correction, so slideScale equals scale. If real
 * slide art is baked with a wider camera again, re-measure the standing alpha
 * heights of run vs slide and restore the ratio (see docs/ANIMATION_CONTRACT.md).
 */
export const RUNNER = {
  frameWidth: 303,
  frameHeight: 430,
  originX: 0.5115511551155115,
  originY: 0.9484765369303741,
  /** Maps texture pixels to game pixels (hair-to-ground ≈ 1.119 m at UNIT_PX). */
  scale: 0.42421523991637733,
  /** Same as `scale` for the placeholder sheets (see note above). */
  slideScale: 0.42421523991637733,
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

export interface Pose {
  key: PoseKey;
  frame: number;
}
