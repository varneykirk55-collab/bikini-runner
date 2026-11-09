// Vite emits each song as its own file next to the build and gives back its URL,
// so the songs ship with the site (no streaming from another host) without
// being packed into the JavaScript bundle.
//
// PLACEHOLDER MUSIC: three short synthesised loops (tools/make_placeholder_music.py)
// that exercise the full music pipeline (menu theme, run playlist, mute, pause and
// resume). Replace the files, or edit this list; Music.ts needs no change.
import menuLoop from '../assets/music/placeholder-menu.mp3';
import runLoopA from '../assets/music/placeholder-run-a.mp3';
import runLoopB from '../assets/music/placeholder-run-b.mp3';

export interface Track {
  key: string;
  title: string;
  url: string;
}

/** Title theme. Loops on the menu once a tap or key has unlocked audio. */
export const MENU_TRACK: Track = {
  key: 'music-placeholder-menu',
  title: 'Placeholder Menu Loop',
  url: menuLoop,
};

/** Run playlist, in rotation order; the list loops. */
export const RUN_TRACKS: Track[] = [
  { key: 'music-placeholder-run-a', title: 'Placeholder Run Loop A', url: runLoopA },
  { key: 'music-placeholder-run-b', title: 'Placeholder Run Loop B', url: runLoopB },
];

export const ALL_TRACKS: Track[] = [MENU_TRACK, ...RUN_TRACKS];
