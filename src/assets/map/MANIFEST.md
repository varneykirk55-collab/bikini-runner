# Bikini Runner — painted map assets

Painted roadside, mid-ground, prop and obstacle art so the in-game map can match the owner's target screenshot (`/workspace/bikini-runner/target_map_look.jpg`): dense monstera, ferns, palms and big red hibiscus lining a dark asphalt road, filling all the way up to the waterfall-cliff, sea and sunset backdrop.

Style: lush realistic-illustrated, warm sunset light from the upper right. Generated with that target as a reference, then chroma-keyed off a flat magenta backing, despilled, trimmed, and saved as lossy WebP with a clean alpha channel.

Use only the files listed below in the game. `_raw/`, `_refs/` and `work/` are working files, not game assets.

- Asset files (this list, excluding the mockup): **2.52 MB**
- Mockup: `mockup.jpg` (389.7 KB, 600×1024)
- Archive: `painted-map.zip` (2.91 MB)
- Portrait mobile game; place and scale sprites with depth (larger near the camera).

## How to place them

1. Keep the existing painted tropical backdrop.
2. Sit `midground_jungle_band.webp` on the horizon so its bottom meets the road vanishing point and its transparent top overlaps the backdrop's lower edge. This removes the flat green gap. Optionally overlay `midground_jungle_treeline.webp` on top of it for standing palm silhouettes.
3. Run `roadside_wall_left.webp` and `roadside_wall_right.webp` as vertically tiling strips along the white edges of the road. Scale each instance (or a perspective mesh) so the wall is narrow in the distance and wide in the foreground. The transparent edge faces the asphalt.
4. Scatter the prop sprites along both sides, bigger in the foreground. Hibiscus bushes should appear as large near-camera accents, like the target screenshot.
5. Replace the placeholder obstacles with the painted versions, keeping the same gameplay meaning.

Anchor points below use Phaser's `setOrigin(x, y)` convention (0,0 is top-left of the sprite, 1,1 is bottom-right).

## Roadside walls

### `roadside_wall_left.webp`

Left roadside foliage wall strip. Dense painted monstera, ferns, palms and red hibiscus. Transparent ragged edge toward the road (right side of the image).

- **Size:** 512x1024, 174.4 KB
- **Tiles seamlessly:** Yes — vertically, seamlessly. Repeat along Y. Do not flip or rotate. Plant scale is consistent, so you can also scale instances with depth.
- **Anchor:** Phaser origin (1, 0) — top of the road-facing (right) edge. Place that edge on the left white line of the road, then tile downward.

### `roadside_wall_right.webp`

Right roadside foliage wall strip. Dense painted monstera, ferns, palms and red hibiscus. Transparent ragged edge toward the road (left side of the image).

- **Size:** 512x1024, 157.1 KB
- **Tiles seamlessly:** Yes — vertically, seamlessly. Repeat along Y. Do not flip or rotate. Plant scale is consistent, so you can also scale instances with depth.
- **Anchor:** Phaser origin (0, 0) — top of the road-facing (left) edge. Place that edge on the right white line of the road, then tile downward.

## Mid-ground

### `midground_jungle_band.webp`

Mid-ground jungle band: packed palms, banana plants, ferns, monstera and red hibiscus. Sit this between the road horizon and the backdrop's bottom edge so the flat green gap is gone. The top is a soft transparent treeline that should overlap the lower part of the painted backdrop. The bottom is fully filled and opaque so it can meet the roadside walls.

- **Size:** 1920x915, 472.2 KB
- **Tiles seamlessly:** Not a seamless tile. Stretch horizontally to the screen width if needed. Do not tile vertically.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center. Place the bottom edge on the road vanishing-point / horizon line (where the backdrop used to meet the flat green). The transparent top should overlap the lower part of the painted backdrop.

### `midground_jungle_treeline.webp`

Optional standing-palm treeline (coconut palms, banana plants, shoreline jungle) with a more side-on camera angle and an irregular transparent top. Overlay this on top of midground_jungle_band.webp if you want palm crowns to break the backdrop's lower edge more naturally.

- **Size:** 1920x586, 291.7 KB
- **Tiles seamlessly:** Not a seamless tile. Stretch or mirror once to span the screen. Do not tile vertically.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center. Place the bottom edge on or just below the horizon line, with the palm tops overlapping the backdrop.

## Prop sprites

### `props/prop_monstera_clump.webp`

Large monstera clump with glossy split leaves and a fern understory. Scatter along both roadsides as a foreground / mid-side prop.

- **Size:** 725x710, 164.5 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center of the foliage base, sits on the ground beside the road.

### `props/prop_fern_clump.webp`

Fountain-like tropical fern clump. Use as a mid-size roadside filler between larger plants.

- **Size:** 768x670, 183.0 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center at the crown base.

### `props/prop_hibiscus_bush.webp`

Hibiscus bush with big red flowers and yellow stamens, matching the target screenshot's hero flowers. Place as a large foreground accent on both sides of the road, especially near the camera.

- **Size:** 800x756, 145.4 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center of the bush.

### `props/prop_palm_tree.webp`

Tall coconut palm with a slender curved trunk, frond crown and coconuts. Place in the mid-distance along both roadsides (scale down with depth).

- **Size:** 583x1024, 129.0 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center at the grass tuft / trunk base.

### `props/prop_banana_leaf_cluster.webp`

Banana leaf cluster / small banana plant. Roadside mid-size prop.

- **Size:** 700x715, 88.7 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center at the stem base.

### `props/prop_tiki_torch.webp`

Tiki torch with a carved face, bamboo shaft, vine wrap and a lit flame. Place sparsely along the roadside as a repeating scenic prop (not an obstacle).

- **Size:** 130x960, 30.0 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center at the base of the pole.

### `props/prop_heliconia_clump.webp`

Heliconia / lobster-claw flower clump with broad tropical leaves. Extra roadside color accent.

- **Size:** 700x807, 155.3 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center of the plant base.

### `props/prop_young_palm.webp`

Shorter thick-trunk fan / palmetto palm. Use as a nearer, chunkier roadside tree under the taller coconut palms.

- **Size:** 640x920, 159.2 KB
- **Tiles seamlessly:** No. Individual prop sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center at the grass tuft / trunk base.

## Obstacles

### `obstacles/obstacle_driftwood_log.webp`

Jump obstacle: weathered driftwood log with moss and a small fern, lying across a lane.

- **Size:** 1024x314, 65.7 KB
- **Tiles seamlessly:** No. Individual obstacle sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center of the log, sits on the road surface. Jump over it.

### `obstacles/obstacle_rocks_coconut.webp`

Jump obstacle: a small pile of dark rocks with a fibrous coconut on top and a tiny fern.

- **Size:** 458x409, 44.7 KB
- **Tiles seamlessly:** No. Individual obstacle sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center of the rock pile, sits on the road. Jump over it.

### `obstacles/obstacle_tiki_gate.webp`

Slide-under obstacle: two carved tiki posts with a wooden lintel, vines and hibiscus. The opening between the posts is transparent so the runner (and the road) show through. Slide under the crossbeam.

- **Size:** 778x803, 107.5 KB
- **Tiles seamlessly:** No. Individual obstacle sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — midpoint between the two post bases, on the road. The slide hit-box is the lintel; the open gate should span the lane(s).

### `obstacles/obstacle_macaw.webp`

Slide-under obstacle: a scarlet macaw in a wide-winged low glide. Slide under the bird.

- **Size:** 910x551, 78.0 KB
- **Tiles seamlessly:** No. Individual obstacle sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center at the feet / lowest point of the bird. Raise the sprite so the body and wings sit above slide height and the feet clear the road.

### `obstacles/obstacle_coconut_crab.webp`

Lane-change obstacle: a large reddish coconut crab holding a coconut. Occupies one lane; the runner must change lanes to avoid it.

- **Size:** 860x609, 134.0 KB
- **Tiles seamlessly:** No. Individual obstacle sprite.
- **Anchor:** Phaser origin (0.5, 1.0) — bottom-center of the crab, sits on the road in a single lane.

## Mockup

`mockup.jpg` — 600×1024 preview compositing these assets over the target backdrop and a perspective road, with walls along both sides, props on the shoulders, and the painted obstacles in the lanes.

## Archive

`painted-map.zip` contains the deliverable WebP assets, this manifest, and the mockup (not the raw generations or work files).
