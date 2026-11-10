"""Build the game backdrop from the approved scenery mockup.

Usage: python3 tools/make_backdrop.py <mockup.jpg> [out.jpg]

The mockup has the HUD and the runner baked into it, so this script only keeps the
scenery above the horizon (sky, mountains, waterfalls, ocean, palms), paints the
mockup's HUD pills out, and squashes it to the game's horizon height. The runner,
the road and everything below the horizon are NOT used: the game draws its own.
"""
import sys
import cv2
import numpy as np

src_path = sys.argv[1]
out_path = sys.argv[2] if len(sys.argv) > 2 else 'src/assets/backdrop/backdrop.jpg'

img = cv2.imread(src_path)
h, w = img.shape[:2]
assert (w, h) == (957, 1782), f'unexpected mockup size {w}x{h}'

# Paint out the mockup's HUD by cloning clean sky over it (inpainting smears badly).
def clone(img, dst, src, flip=False):
    dx0, dy0, dx1, dy1 = dst
    sx0, sy0, sx1, sy1 = src
    patch = img[sy0:sy1, sx0:sx1].copy()
    patch = cv2.resize(patch, (dx1 - dx0, dy1 - dy0), interpolation=cv2.INTER_AREA)
    if flip:
        patch = cv2.flip(patch, 1)
    m = np.full(patch.shape[:2], 255, np.uint8)
    m[:6] = m[-6:] = 0
    m[:, :6] = m[:, -6:] = 0
    centre = ((dx0 + dx1) // 2, (dy0 + dy1) // 2)
    return cv2.seamlessClone(patch, img, m, centre, cv2.NORMAL_CLONE)

# left pills (sit over sky and the mountain's left shoulder), star pill, pause button
img = clone(img, (18, 62, 436, 302), (530, 212, 948, 420))
img = clone(img, (520, 56, 812, 208), (640, 212, 932, 364), flip=True)
img = clone(img, (806, 56, 940, 192), (606, 220, 740, 356))

# Keep scenery from the top crop to the horizon (where the mockup's road vanishes).
TOP, HORIZON = 160, 922
scene = img[TOP:HORIZON]

# Game horizon is 360 of 540 px wide -> keep the native width, squash height to match.
target_h = round(w * 360 / 540)
scene = cv2.resize(scene, (w, target_h), interpolation=cv2.INTER_AREA)
cv2.imwrite(out_path, scene, [cv2.IMWRITE_JPEG_QUALITY, 88])
print(out_path, scene.shape[1], scene.shape[0])
