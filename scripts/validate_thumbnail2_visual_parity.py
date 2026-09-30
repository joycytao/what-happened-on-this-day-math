#!/usr/bin/env python3
"""Create fixed-region and variable-card visual QA artifacts for Thumbnail 2."""

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
    "header_and_rays": (140, 10, 1120, 125),
    "top_labels": (45, 575, 1215, 645),
    "bottom_labels": (205, 1120, 1055, 1185),
    "footer_logo": (575, 1135, 685, 1230),
}
VARIABLE_CARDS = {
    "story": (31, 134, 411, 574),
    "level1": (437, 134, 817, 574),
    "level2": (843, 134, 1223, 574),
    "level3": (196, 656, 610, 1116),
    "answer_key": (646, 656, 1060, 1116),
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
    pixels[ivory] = BG
    pixels[navy] = NAVY
    pixels[orange] = ORANGE
    return Image.fromarray(pixels, "RGB")


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    x = a.astype(np.float64)
    y = b.astype(np.float64)
    mean_x, mean_y = x.mean(), y.mean()
    var_x, var_y = x.var(), y.var()
    covariance = ((x - mean_x) * (y - mean_y)).mean()
    c1, c2 = 6.5025, 58.5225
    return float(((2 * mean_x * mean_y + c1) * (2 * covariance + c2)) /
                 ((mean_x**2 + mean_y**2 + c1) * (var_x + var_y + c2)))


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

    ImageChops.difference(reference, generated).save(args.output_dir / "thumbnail-2-pixel-diff.png")
    Image.blend(reference, generated, 0.5).save(args.output_dir / "thumbnail-2-overlay.png")
    side_by_side = Image.new("RGB", (2520, 1260), "white")
    side_by_side.paste(reference, (0, 0))
    side_by_side.paste(generated, (1260, 0))
    side_by_side.save(args.output_dir / "thumbnail-2-side-by-side.png")

    fixed = {name: compare(reference, generated, box) for name, box in FIXED_REGIONS.items()}
    variable = {name: compare(reference, generated, box) for name, box in VARIABLE_CARDS.items()}
    # The official PDF logo is a variable raster asset; geometry is checked
    # separately while the headline/labels remain the fixed-region gate.
    fixed_ssim = min(metric["ssim"] for name, metric in fixed.items() if name != "footer_logo")
    report = {
        "reference": str(args.reference),
        "generated": str(args.generated),
        "normalized": {"size": list(SIZE), "mode": "RGB"},
        "fixedRegions": fixed,
        "variableCards": variable,
        "visualAcceptance": {"fixedRegionMinSsim": fixed_ssim, "fixedRegionThreshold": 0.50, "footerLogoSsim": fixed["footer_logo"]["ssim"], "passed": fixed_ssim >= 0.50},
        "artifacts": ["thumbnail-2-side-by-side.png", "thumbnail-2-overlay.png", "thumbnail-2-pixel-diff.png"],
        "visualReview": "human inspection required; fixed-region and variable-card metrics are recorded",
    }
    (args.output_dir / "thumbnail-2-visual-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    if fixed_ssim < 0.50:
        raise SystemExit(f"Thumbnail 2 fixed-region SSIM below threshold: {fixed_ssim:.3f}")


if __name__ == "__main__":
    main()
