#!/usr/bin/env python3
"""Validate Thumbnail 3 against its canonical reference and emit visual artifacts."""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops

SIZE = (1260, 1260)
BG = np.array([254, 255, 239], dtype=np.uint8)
NAVY = np.array([43, 49, 63], dtype=np.uint8)
ORANGE = np.array([255, 138, 0], dtype=np.uint8)
FIXED_REGIONS = {
    "month_and_rules": (55, 55, 1205, 205),
    "headline": (75, 205, 1185, 330),
    "subtitle": (120, 335, 1140, 420),
    "labels": (55, 965, 1205, 1070),
    "footer": (35, 1115, 1225, 1225),
}
VARIABLE_CARDS = {
    "level1": (45, 435, 430, 965),
    "level2": (430, 435, 830, 965),
    "level3": (830, 435, 1220, 965),
}


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


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    x, y = a.astype(np.float64), b.astype(np.float64)
    mx, my, vx, vy = x.mean(), y.mean(), x.var(), y.var()
    covariance = ((x - mx) * (y - my)).mean()
    c1, c2 = 6.5025, 58.5225
    return float(((2 * mx * my + c1) * (2 * covariance + c2)) /
                 ((mx * mx + my * my + c1) * (vx + vy + c2)))


def compare(reference: Image.Image, generated: Image.Image, box):
    left = np.asarray(reference.crop(box), dtype=np.int16)
    right = np.asarray(generated.crop(box), dtype=np.int16)
    delta = np.abs(left - right)
    return {
        "box": list(box),
        "mean_absolute_error": float(delta.mean()),
        "changed_pixel_ratio": float(np.any(delta > 0, axis=2).mean()),
        "ssim": ssim(left.mean(axis=2), right.mean(axis=2)),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--generated", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--threshold", type=float, default=0.50)
    args = parser.parse_args()
    reference = normalize_palette(load(args.reference))
    generated = normalize_palette(load(args.generated))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    ImageChops.difference(reference, generated).save(args.output_dir / "thumbnail-3-pixel-diff.png")
    Image.blend(reference, generated, 0.5).save(args.output_dir / "thumbnail-3-overlay.png")
    side = Image.new("RGB", (2520, 1260), "white")
    side.paste(reference, (0, 0)); side.paste(generated, (1260, 0))
    side.save(args.output_dir / "thumbnail-3-side-by-side.png")
    fixed = {name: compare(reference, generated, box) for name, box in FIXED_REGIONS.items()}
    variable = {name: compare(reference, generated, box) for name, box in VARIABLE_CARDS.items()}
    fixed_ssim = min(metric["ssim"] for metric in fixed.values())
    report = {
        "reference": str(args.reference), "generated": str(args.generated),
        "normalized": {"size": list(SIZE), "mode": "RGB"},
        "fixedRegions": fixed, "variableCards": variable,
        "visualAcceptance": {"fixedRegionMinSsim": fixed_ssim,
                              "fixedRegionThreshold": args.threshold,
                              "passed": fixed_ssim >= args.threshold},
        "artifacts": ["thumbnail-3-side-by-side.png", "thumbnail-3-overlay.png", "thumbnail-3-pixel-diff.png"],
        "visualReview": "human inspection required; fixed-region and variable-card metrics are recorded",
    }
    (args.output_dir / "thumbnail-3-visual-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    if fixed_ssim < args.threshold:
        raise SystemExit(f"Thumbnail 3 fixed-region SSIM below threshold: {fixed_ssim:.3f}")


if __name__ == "__main__":
    main()
