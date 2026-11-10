# Portrait roadside rendering repair

Base: `main`, reference `04d4a22`.

## Cause

`TrackRenderer.drawWalls` used 24 Image strips per shoulder. Each sampled 55% of a 512×1024 texture, but `setDisplaySize` scaled the **whole image** independently to the shoulder width and a shallow projected strip height. Phaser crops do not change the underlying image dimensions. This compressed hundreds of source rows into a few screen pixels and stretched the leaves and flowers horizontally. Cropping also left incomplete shoulder coverage. It reproduces at the reference commit, including on iPhone portrait viewports.

Inspection ruled out a viewport or camera deformation: the 540×960 game uses Phaser FIT (uniform scaling), CameraRig projects world coordinates without changing texture proportions, and the loaded backdrop matches its 540×360 band. The distortion was local to the shoulder strips.

## Repair

Replace those Images with TileSprites. The projected strip dimensions now define a sampling area; equal X/Y tile scales preserve the art's proportions. Repeat the texture to fill each shoulder, anchor sampling at the road edge, and scroll by world distance. Retain strip positions, depth ordering, count, overlap, road geometry, green underlay, and loaded art. Round sampling-area dimensions to avoid repeatedly resizing backing canvases on fractional sizes.

No changes to viewport scaling, camera, character, HUD, input, collisions, spawning, or gameplay. No landscape support or black bars added. Existing blue page margins on taller screens remain part of FIT layout.

## Verification

- `npm test`: 32 passed, 0 failed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Production Chromium smoke suite: menu, start with touch tap, four directional pointer swipes, pause, canvas colour variation, no page/console/request errors. Canvas aspect ratio and viewport bounds are checked at every size.
- Portrait CSS viewports: 375×667 (iPhone SE), 390×844 (iPhone 13), 440×956 (iPhone 16 Pro Max), 412×915 (Android).
- Screenshots use mobile/touch browser emulation at DPR 1 for consistent review; initial captures also exercised DPR 3. This is not a physical iPhone/Safari or safe-area certification.

The smoke script accepts `SMOKE_OUT` to retain captures. `before/` is the reference production build; `after/` is the repair. Captures are live animation samples, not identical simulation frames. Early running captures can include the scene fade; the comparison links use the later gameplay captures after the fade. Each directory includes menu, running, after swipes, and pause captures for each viewport.

| Viewport | Before | After |
| --- | --- | --- |
| 375×667 | [gameplay](before/iphone-se-3-after-swipes.png) | [gameplay](after/iphone-se-3-after-swipes.png) |
| 390×844 | [gameplay](before/iphone-13-3-after-swipes.png) | [gameplay](after/iphone-13-3-after-swipes.png) |
| 440×956 | [gameplay](before/iphone-16-pro-max-3-after-swipes.png) | [gameplay](after/iphone-16-pro-max-3-after-swipes.png) |
| 412×915 | [gameplay](before/android-3-after-swipes.png) | [gameplay](after/android-3-after-swipes.png) |

Reproduce: `npm ci && npx playwright install chromium && npm test && npx tsc --noEmit && npm run build && npm run smoke`.
