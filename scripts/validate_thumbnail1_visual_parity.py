#!/usr/bin/env python3
"""Create visual-parity artifacts for Thumbnail 1 against its canonical asset."""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw


SIZE = (1260, 1260)
BG = np.array([254, 255, 239], dtype=np.uint8)
NAVY = np.array([43, 49, 63], dtype=np.uint8)
ORANGE = np.array([255, 138, 0], dtype=np.uint8)
FIXED_REGIONS = {
    "background": (40, 40, 1220, 1080),
    "month_title": (90, 105, 1170, 315),
    "product_title": (90, 340, 1170, 440),
    "subtitle": (150, 475, 1100, 550),
    "levels": (190, 950, 1070, 1040),
    "footer": (35, 1125, 1225, 1220),
}
VARIABLE_REGION = (440, 570, 820, 925)


def load(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    if image.size != SIZE:
        image = image.resize(SIZE, Image.Resampling.LANCZOS)
    return image


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    """Small dependency-free SSIM implementation for a fixed comparison crop."""
    x = a.astype(np.float64)
    y = b.astype(np.float64)
    mean_x, mean_y = x.mean(), y.mean()
    var_x, var_y = x.var(), y.var()
    covariance = ((x - mean_x) * (y - mean_y)).mean()
    c1, c2 = 6.5025, 58.5225
    return float(((2 * mean_x * mean_y + c1) * (2 * covariance + c2)) /
                 ((mean_x**2 + mean_y**2 + c1) * (var_x + var_y + c2)))


def normalize_palette(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image).copy()
    ivory = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] > 220) & (pixels[:, :, 2] > 210)
    navy = (pixels[:, :, 0] < 100) & (pixels[:, :, 1] < 110) & (pixels[:, :, 2] < 130)
    orange = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] < 190) & (pixels[:, :, 2] < 100)
    pixels[ivory] = BG
    pixels[navy] = NAVY
    pixels[orange] = ORANGE
    return Image.fromarray(pixels, "RGB")


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
    args = parser.parse_args()
    reference = normalize_palette(load(args.reference))
    generated = normalize_palette(load(args.generated))
    args.output_dir.mkdir(parents=True, exist_ok=True)

    diff = ImageChops.difference(reference, generated)
    diff.save(args.output_dir / "thumbnail-1-pixel-diff.png")
    overlay = Image.blend(reference, generated, 0.5)
    overlay.save(args.output_dir / "thumbnail-1-overlay.png")
    side_by_side = Image.new("RGB", (2520, 1260), "white")
    side_by_side.paste(reference, (0, 0))
    side_by_side.paste(generated, (1260, 0))
    side_by_side.save(args.output_dir / "thumbnail-1-side-by-side.png")

    fixed = {name: compare(reference, generated, box) for name, box in FIXED_REGIONS.items()}
    variable = compare(reference, generated, VARIABLE_REGION)
    report = {
        "reference": str(args.reference),
        "generated": str(args.generated),
        "normalized": {"size": list(SIZE), "mode": "RGB"},
        "fixedRegions": fixed,
        "variableIllustration": variable,
        "artifacts": [
            "thumbnail-1-side-by-side.png",
            "thumbnail-1-overlay.png",
            "thumbnail-1-pixel-diff.png",
        ],
        "visualReview": "human inspection required; fixed-region and variable-region metrics are recorded",
    }
    (args.output_dir / "thumbnail-1-visual-qa.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
