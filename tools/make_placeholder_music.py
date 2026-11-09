#!/usr/bin/env python3
"""
Generate PLACEHOLDER music loops for Bikini Runner (steel-drum-ish plucks over a
simple bass). Three short loops so the real music pipeline (menu theme, run
playlist rotation, mute, pause/resume) has something to play from day one.

Outputs MP3 (needs ffmpeg with libmp3lame) into src/assets/music/.
These are throwaway: replace the files or edit src/audio/tracks.ts.

Usage: python3 tools/make_placeholder_music.py
"""
import math
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 22050

NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def freq(name, octave):
    return 440.0 * 2 ** ((NOTE[name] - 9 + 12 * (octave - 4)) / 12)


def pluck(f, dur, amp=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.exp(-t * 5.5)
    tone = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.2 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 12)
    return amp * env * tone


def bass(f, dur, amp=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    env = np.minimum(1, t * 80) * np.exp(-t * 2.5)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t))


def hat(dur, seed):
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    noise = np.diff(noise, prepend=0)  # crude high-pass
    return noise * np.exp(-t * 60)


def render(bpm, root, chords, pattern, bars=8, seed=1):
    beat = 60.0 / bpm
    step = beat / 2  # eighth notes
    total = int(SR * beat * 4 * bars)
    out = np.zeros(total + SR * 2)
    for bar in range(bars):
        chord = chords[bar % len(chords)]
        base = bar * 4 * beat
        for i in range(8):
            pos = int(SR * (base + i * step))
            deg = pattern[i % len(pattern)]
            name, octv = chord['notes'][deg % len(chord['notes'])]
            note = pluck(freq(name, octv), 0.9, 0.5 if i % 2 == 0 else 0.35)
            out[pos:pos + len(note)] += note[: len(out) - pos]
            h = hat(0.06, seed + i)
            out[pos:pos + len(h)] += 0.12 * h[: len(out) - pos]
        for b in range(4):
            pos = int(SR * (base + b * beat))
            bn = bass(freq(*chord['bass']), beat * 0.95, 0.55)
            out[pos:pos + len(bn)] += bn[: len(out) - pos]
    # wrap the tail onto the head so the loop is seamless
    tail = out[total:]
    out = out[:total]
    out[: len(tail)] += tail[: len(out)]
    peak = np.max(np.abs(out)) or 1.0
    return (out / peak * 0.7)


def write_mp3(samples, path):
    pcm = (np.clip(samples, -1, 1) * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        wav_path = tmp.name
    try:
        with wave.open(wav_path, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(
            ['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-codec:a', 'libmp3lame', '-b:a', '64k', path],
            check=True,
        )
    finally:
        os.unlink(wav_path)


C = lambda *n: {'notes': list(n[:-1]), 'bass': n[-1]}

LOOPS = {
    # menu: relaxed, C major
    'placeholder-menu.mp3': dict(
        bpm=92,
        root='C',
        chords=[
            C(('C', 4), ('E', 4), ('G', 4), ('C', 5), ('C', 2)),
            C(('A', 3), ('C', 4), ('E', 4), ('A', 4), ('A', 2)),
            C(('F', 3), ('A', 3), ('C', 4), ('F', 4), ('F', 2)),
            C(('G', 3), ('B', 3), ('D', 4), ('G', 4), ('G', 2)),
        ],
        pattern=[0, 2, 1, 3, 2, 1, 3, 2],
        seed=3,
    ),
    # run A: brighter and faster, D major
    'placeholder-run-a.mp3': dict(
        bpm=124,
        root='D',
        chords=[
            C(('D', 4), ('F#', 4), ('A', 4), ('D', 5), ('D', 2)),
            C(('B', 3), ('D', 4), ('F#', 4), ('B', 4), ('B', 2)),
            C(('G', 3), ('B', 3), ('D', 4), ('G', 4), ('G', 2)),
            C(('A', 3), ('C#', 4), ('E', 4), ('A', 4), ('A', 2)),
        ],
        pattern=[0, 1, 2, 3, 2, 1, 2, 3],
        seed=5,
    ),
    # run B: G major, slightly different rhythm
    'placeholder-run-b.mp3': dict(
        bpm=132,
        root='G',
        chords=[
            C(('G', 3), ('B', 3), ('D', 4), ('G', 4), ('G', 2)),
            C(('E', 3), ('G', 3), ('B', 3), ('E', 4), ('E', 2)),
            C(('C', 4), ('E', 4), ('G', 4), ('C', 5), ('C', 2)),
            C(('D', 4), ('F#', 4), ('A', 4), ('D', 5), ('D', 2)),
        ],
        pattern=[0, 2, 3, 1, 3, 2, 1, 2],
        seed=9,
    ),
}


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    dest = os.path.join(here, '..', 'src', 'assets', 'music')
    os.makedirs(dest, exist_ok=True)
    for name, cfg in LOOPS.items():
        samples = render(cfg['bpm'], cfg['root'], cfg['chords'], cfg['pattern'], seed=cfg['seed'])
        path = os.path.join(dest, name)
        write_mp3(samples, path)
        print(name, f'{len(samples) / SR:.1f}s', f'{os.path.getsize(path) // 1024} KB')


if __name__ == '__main__':
    main()
