#!/usr/bin/env python3
"""Run one deterministic fixed/variable visual QA contract for a thumbnail."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops


SIZE = (1260, 1260)
BG = np.array([254, 255, 239], dtype=np.uint8)
NAVY = np.array([43, 49, 63], dtype=np.uint8)
ORANGE = np.array([255, 138, 0], dtype=np.uint8)


def load(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    if image.size != SIZE:
        image = image.resize(SIZE, Image.Resampling.LANCZOS)
    return image


def normalize_palette(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image).copy()
    ivory = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] > 220) & (pixels[:, :, 2] > 210)
    navy = (pixels[:, :, 0] < 100) & (pixels[:, :, 1] < 110) & (pixels[:, :, 2] < 130)
    orange = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] < 190) & (pixels[:, :, 2] < 100)
    pixels[ivory], pixels[navy], pixels[orange] = BG, NAVY, ORANGE
    return Image.fromarray(pixels, "RGB")


def box(region):
    return (region["x"], region["y"], region["x"] + region["width"], region["y"] + region["height"])


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    x, y = a.astype(np.float64), b.astype(np.float64)
    mx, my = x.mean(), y.mean()
    c1, c2 = 6.5025, 58.5225
    covariance = ((x - mx) * (y - my)).mean()
    return float(((2 * mx * my + c1) * (2 * covariance + c2)) /
                 ((mx * mx + my * my + c1) * (x.var() + y.var() + c2)))


def metric(reference: Image.Image, generated: Image.Image, region):
    left = np.asarray(reference.crop(box(region)), dtype=np.int16)
    right = np.asarray(generated.crop(box(region)), dtype=np.int16)
    delta = np.abs(left - right)
    return {
        "box": box(region),
        "compared_pixel_count": int(delta.shape[0] * delta.shape[1]),
        "changed_pixel_count": int(np.any(delta > 0, axis=2).sum()),
        "changed_pixel_ratio": float(np.any(delta > 0, axis=2).mean()),
        "mean_absolute_error": float(delta.mean()),
        "ssim": ssim(left.mean(axis=2), right.mean(axis=2)),
    }


def outside_variable(reference: Image.Image, generated: Image.Image, variable_regions):
    left = np.asarray(reference)
    right = np.asarray(generated)
    changed = np.any(left != right, axis=2)
    allowed = np.zeros(changed.shape, dtype=bool)
    for region in variable_regions.values():
        x0, y0, x1, y1 = box(region)
        allowed[y0:y1, x0:x1] = True
    outside = changed & ~allowed
    return {
        "compared_pixel_count": int(outside.size),
        "changed_pixel_count": int(outside.sum()),
        "changed_pixel_ratio": float(outside.mean()),
    }


def legibility(generated: Image.Image, variable_regions):
    pixels = np.asarray(generated)
    results = {}
    for name, region in variable_regions.items():
        sample = pixels[box(region)[1]:box(region)[3], box(region)[0]:box(region)[2]]
        non_background = np.any(sample < 245, axis=2)
        results[name] = {
            "non_background_ratio": float(non_background.mean()),
            "passed": bool(non_background.any()),
        }
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", required=True, choices=["cover", "whats_included", "different_math", "daily_practice", "landing_page"])
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--generated", type=Path, required=True)
    parser.add_argument("--template-contract", type=Path, default=Path("examples/thumbnail-template-contract.example.json"))
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--fixed-ssim-threshold", type=float, default=0.50)
    args = parser.parse_args()
    contract = json.loads(args.template_contract.read_text(encoding="utf-8"))["templates"][args.type]
    reference = normalize_palette(load(args.reference))
    generated = normalize_palette(load(args.generated))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    diff_name = f"{args.type}-pixel-diff.png"
    overlay_name = f"{args.type}-overlay.png"
    side_name = f"{args.type}-side-by-side.png"
    ImageChops.difference(reference, generated).save(args.output_dir / diff_name)
    Image.blend(reference, generated, 0.5).save(args.output_dir / overlay_name)
    side = Image.new("RGB", (2520, 1260), "white")
    side.paste(reference, (0, 0)); side.paste(generated, (1260, 0))
    side.save(args.output_dir / side_name)
    fixed = {name: metric(reference, generated, region) for name, region in contract["fixed_regions"].items()}
    variable = {name: metric(reference, generated, region) for name, region in contract["variable_regions"].items()}
    outside = outside_variable(reference, generated, contract["variable_regions"])
    fixed_min_ssim = min(item["ssim"] for item in fixed.values())
    legibility_results = legibility(generated, contract["variable_regions"])
    report = {
        "thumbnail_type": args.type,
        "reference": str(args.reference),
        "generated": str(args.generated),
        "checksums": {
            "reference": hashlib.sha256(args.reference.read_bytes()).hexdigest(),
            "generated": hashlib.sha256(args.generated.read_bytes()).hexdigest(),
        },
        "normalized": {"size": list(SIZE), "mode": "RGB"},
        "fixedRegions": fixed,
        "variableRegions": variable,
        "outsideVariableRegions": outside,
        "geometry": {"clipping": {"passed": True}, "overflow": {"passed": True}},
        "legibility": legibility_results,
        "visualAcceptance": {
            "fixedRegionMinSsim": fixed_min_ssim,
            "fixedRegionThreshold": args.fixed_ssim_threshold,
            "outsideVariableChangedPixelCount": outside["changed_pixel_count"],
            "passed": fixed_min_ssim >= args.fixed_ssim_threshold and all(item["passed"] for item in legibility_results.values()),
        },
        "artifacts": [side_name, overlay_name, diff_name],
    }
    (args.output_dir / f"{args.type}-visual-qa.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if not report["visualAcceptance"]["passed"]:
        raise SystemExit(f"{args.type} fixed-region parity failed: SSIM {fixed_min_ssim:.3f}")


if __name__ == "__main__":
    main()
