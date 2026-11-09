#!/usr/bin/env python3
"""
Generate PLACEHOLDER runner sprite sheets for Bikini Runner.

The sheets follow the animation contract in src/player/animation.ts exactly:
  * one row of 8 frames per sheet, 303 x 430 px per frame (2424 x 430 total)
  * rear view, feet anchored at x = 0.5116*303, y = 0.9485*430 in every frame
  * run: looping cycle; jump: poses planted on the ground (physics supplies the
    height); slide: played once, uniform scale (no slideScale correction needed)

The figure is a neutral, faceless mannequin. It exists only to exercise the
animation system and mark where the real character goes. It is NOT the final
character and is deliberately gender-neutral and unstyled.

Usage: python3 tools/make_placeholder_sheets.py
"""
import math
import os
from PIL import Image, ImageDraw

FW, FH = 303, 430
FRAMES = 8
SS = 2  # supersample factor
GROUND = round(0.9484765369303741 * FH)  # 408
CX = round(0.5115511551155115 * FW)  # 155

THIGH, SHIN = 88, 88
LEG = THIGH + SHIN
HIP_Y = GROUND - LEG  # 232
SHOULDER_Y = HIP_Y - 130
HEAD_R = 32

FILL = (127, 224, 240, 255)
FILL_FAR = (92, 190, 214, 255)
LINE = (10, 84, 118, 255)


def pt(x, y):
    return (x * SS, y * SS)


def limb(d, a, b, width, color):
    d.line([pt(*a), pt(*b)], fill=LINE, width=int((width + 6) * SS))
    d.line([pt(*a), pt(*b)], fill=color, width=int(width * SS))
    for p in (a, b):
        r = (width + 6) / 2
        d.ellipse([pt(p[0] - r, p[1] - r), pt(p[0] + r, p[1] + r)], fill=LINE)
        r = width / 2
        d.ellipse([pt(p[0] - r, p[1] - r), pt(p[0] + r, p[1] + r)], fill=color)


def two_bone(root, target, l1, l2, bend_dir):
    """Place a knee/elbow between root and target; bend_dir = +1/-1 sideways."""
    dx, dy = target[0] - root[0], target[1] - root[1]
    dist = max(1e-3, math.hypot(dx, dy))
    dist = min(dist, l1 + l2 - 0.5)
    a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    h = math.sqrt(max(0.0, l1 * l1 - a * a))
    ux, uy = dx / math.hypot(dx, dy), dy / math.hypot(dx, dy)
    mx, my = root[0] + ux * a, root[1] + uy * a
    return (mx + bend_dir * -uy * h, my + bend_dir * ux * h)


def render(joints):
    """joints: dict with hip, shoulder, head, legs[(foot)], arms[(hand)] already in frame px."""
    im = Image.new('RGBA', (FW * SS, FH * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    hip, sh, head = joints['hip'], joints['shoulder'], joints['head']
    # far arms first, then torso, legs, near arms, head
    for side, hand in zip((-1, 1), joints['hands']):
        sp = (sh[0] + side * 46, sh[1] + 6)
        elbow = two_bone(sp, hand, 62, 62, -side)
        limb(d, sp, elbow, 16, FILL_FAR)
        limb(d, elbow, hand, 14, FILL_FAR)
    for side, foot in zip((-1, 1), joints['feet']):
        hp = (hip[0] + side * 20, hip[1])
        knee = two_bone(hp, foot, THIGH, SHIN, -side)
        limb(d, hp, knee, 24, FILL)
        limb(d, knee, foot, 20, FILL)
        d.ellipse([pt(foot[0] - 14, foot[1] - 7), pt(foot[0] + 14, foot[1] + 7)], fill=LINE)
    torso = [(sh[0] - 50, sh[1]), (sh[0] + 50, sh[1]), (hip[0] + 26, hip[1] + 8), (hip[0] - 26, hip[1] + 8)]
    d.polygon([pt(*p) for p in torso], fill=LINE)
    inner = [(sh[0] - 44, sh[1] + 5), (sh[0] + 44, sh[1] + 5), (hip[0] + 21, hip[1] + 4), (hip[0] - 21, hip[1] + 4)]
    d.polygon([pt(*p) for p in inner], fill=FILL)
    d.line([pt(sh[0], sh[1] + 10), pt(hip[0], hip[1])], fill=LINE, width=3 * SS)  # spine seam (rear view)
    neck_top, neck_bot = sorted((head[1] + HEAD_R - 6, sh[1] + 2))
    d.rectangle([pt(head[0] - 8, neck_top), pt(head[0] + 8, neck_bot)], fill=FILL)
    d.ellipse([pt(head[0] - HEAD_R - 3, head[1] - HEAD_R - 3), pt(head[0] + HEAD_R + 3, head[1] + HEAD_R + 3)], fill=LINE)
    d.ellipse([pt(head[0] - HEAD_R, head[1] - HEAD_R), pt(head[0] + HEAD_R, head[1] + HEAD_R)], fill=FILL)
    return im.resize((FW, FH), Image.LANCZOS)


def standing():
    return {
        'hip': (CX, HIP_Y),
        'shoulder': (CX, SHOULDER_Y),
        'head': (CX, SHOULDER_Y - 14 - HEAD_R),
        'feet': [(CX - 20, GROUND), (CX + 20, GROUND)],
        'hands': [(CX - 50, SHOULDER_Y + 120), (CX + 50, SHOULDER_Y + 120)],
    }


def run_frame(f):
    phi = 2 * math.pi * f / FRAMES
    j = standing()
    bob = -8 * math.cos(2 * phi)
    sway = 6 * math.sin(phi)
    j['hip'] = (CX + sway * 0.5, HIP_Y + bob)
    j['shoulder'] = (CX + sway, SHOULDER_Y + bob)
    j['head'] = (CX + sway * 1.2, SHOULDER_Y + bob - 14 - HEAD_R)
    feet, hands = [], []
    for side in (-1, 1):
        ph = phi + (0 if side == -1 else math.pi)
        lift = 70 * max(0.0, math.sin(ph))
        feet.append((CX + side * 22 + side * 6 * math.cos(ph), GROUND - lift))
        sw = math.sin(ph + math.pi)
        hands.append((CX + side * (46 + 6 * abs(sw)), SHOULDER_Y + bob + 112 - 46 * sw))
    j['feet'], j['hands'] = feet, hands
    return j


JUMP = [  # crouch, footLiftL, footLiftR, armUp
    (0.70, 0.0, 0.0, -0.4),
    (0.30, 0.1, 0.1, 0.2),
    (0.00, 0.4, 0.2, 0.6),
    (0.00, 0.7, 0.4, 0.8),
    (0.00, 0.9, 0.9, 1.0),
    (0.00, 0.5, 0.6, 0.7),
    (0.00, 0.2, 0.2, 0.3),
    (0.55, 0.0, 0.0, -0.2),
]


def jump_frame(f):
    crouch, ll, lr, arm = JUMP[f]
    j = standing()
    drop = 70 * crouch
    j['hip'] = (CX, HIP_Y + drop)
    j['shoulder'] = (CX, SHOULDER_Y + drop * 1.1)
    j['head'] = (CX, SHOULDER_Y + drop * 1.1 - 14 - HEAD_R)
    j['feet'] = [(CX - 20 - 18 * crouch, GROUND - 90 * ll), (CX + 20 + 18 * crouch, GROUND - 90 * lr)]
    hy = j['shoulder'][1] + 112 - 150 * arm
    j['hands'] = [(CX - 56, hy), (CX + 56, hy)]
    return j


SLIDE = [  # vertical compression k, lateral lean px
    (1.00, 0), (0.80, 10), (0.58, 22), (0.45, 30), (0.42, 32), (0.42, 30), (0.55, 18), (0.85, 6),
]


def slide_frame(f):
    k, lean = SLIDE[f]
    j = standing()

    def sq(p):
        y = GROUND - (GROUND - p[1]) * k
        x = p[0] + lean * (1 - (GROUND - p[1]) / (GROUND - j['head'][1] + HEAD_R)) * -1
        return (x, y)

    for key in ('hip', 'shoulder', 'head'):
        j[key] = sq(j[key])
    j['feet'] = [(CX - 20, GROUND), (CX + 20, GROUND)]
    j['hands'] = [sq((CX - 54, SHOULDER_Y + 40)), sq((CX + 54, SHOULDER_Y + 40))]
    return j


def sheet(frame_fn):
    out = Image.new('RGBA', (FW * FRAMES, FH), (0, 0, 0, 0))
    for f in range(FRAMES):
        out.paste(render(frame_fn(f)), (f * FW, 0))
    return out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    dest = os.path.join(here, '..', 'src', 'assets', 'runner')
    os.makedirs(dest, exist_ok=True)
    for name, fn in (('run', run_frame), ('jump', jump_frame), ('slide', slide_frame)):
        img = sheet(fn)
        img.save(os.path.join(dest, f'{name}.png'), optimize=True)
        print(f'{name}.png', img.size)


if __name__ == '__main__':
    main()
