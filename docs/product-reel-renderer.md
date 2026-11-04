# Product Reel MP4 renderer and storage contract

## Reference output

The first production Reel renderer matches the supplied reference class:

- MP4 container with H.264 video;
- 1080 × 1920 portrait canvas;
- 30 frames per second;
- 10 seconds;
- no audio by default.

The renderer command is:

```bash
npm run social:product-reel:render -- \
  --input output/social/product-reels/<month>/workstream.json \
  --output output/social/product-reels/<month>/reel.mp4
```

The command uses the first raster evidence asset from the validated Product
Reel workstream as the deterministic render source, pads it without distortion,
and writes a sidecar JSON manifest. The workstream still contains the complete
scene plan for a future motion renderer; this first release does not invent
overlay copy or expose answer keys.

## Carousel output

Carousel output remains the existing deterministic JSON workstream and PNG
asset contract. No Carousel format or dimension change is introduced by the
Reel MP4 requirement.

## Storage and retention

Versioned outputs are stored under:

```text
output/social/product-reels/<month>/<reel>.mp4
output/social/product-reels/<month>/<reel>.json
output/social/carousels/<month>-carousels/workstream.json
```

Generated social artifacts are retained for 90 days and require human review
before public release. The repository release manifest remains the source of
the product/version/checksum identity; the MP4 sidecar records the renderer,
source asset, settings, and retention contract.
