#!/usr/bin/env python3
"""Validate Thumbnail 4 against the canonical daily-practice reference."""

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
    "header_and_rays": (90, 55, 1170, 300),
    "preview_frame": (300, 315, 960, 1030),
    "use_case_row": (50, 1035, 1210, 1120),
    "footer": (35, 1135, 1225, 1225),
}
VARIABLE_REGIONS = {"worksheet_preview": (325, 320, 935, 1020)}


def load(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGB")
    return image.resize(SIZE, Image.Resampling.LANCZOS) if image.size != SIZE else image


def normalize_palette(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image).copy()
    ivory = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] > 220) & (pixels[:, :, 2] > 210)
    navy = (pixels[:, :, 0] < 100) & (pixels[:, :, 1] < 110) & (pixels[:, :, 2] < 130)
    orange = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] < 190) & (pixels[:, :, 2] < 100)
    pixels[ivory], pixels[navy], pixels[orange] = BG, NAVY, ORANGE
    return Image.fromarray(pixels, "RGB")


def ssim(a: np.ndarray, b: np.ndarray) -> float:
    x, y = a.astype(np.float64), b.astype(np.float64)
    mx, my = x.mean(), y.mean()
    covariance = ((x - mx) * (y - my)).mean()
    c1, c2 = 6.5025, 58.5225
    return float(((2 * mx * my + c1) * (2 * covariance + c2)) /
                 ((mx * mx + my * my + c1) * (x.var() + y.var() + c2)))


def compare(reference: Image.Image, generated: Image.Image, box):
    left = np.asarray(reference.crop(box), dtype=np.int16)
    right = np.asarray(generated.crop(box), dtype=np.int16)
    delta = np.abs(left - right)
    return {"box": list(box), "mean_absolute_error": float(delta.mean()),
            "changed_pixel_ratio": float(np.any(delta > 0, axis=2).mean()),
            "ssim": ssim(left.mean(axis=2), right.mean(axis=2))}


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
    ImageChops.difference(reference, generated).save(args.output_dir / "thumbnail-4-pixel-diff.png")
    Image.blend(reference, generated, 0.5).save(args.output_dir / "thumbnail-4-overlay.png")
    side = Image.new("RGB", (2520, 1260), "white")
    side.paste(reference, (0, 0)); side.paste(generated, (1260, 0))
    side.save(args.output_dir / "thumbnail-4-side-by-side.png")
    fixed = {name: compare(reference, generated, box) for name, box in FIXED_REGIONS.items()}
    variable = {name: compare(reference, generated, box) for name, box in VARIABLE_REGIONS.items()}
    minimum = min(metric["ssim"] for metric in fixed.values())
    report = {"reference": str(args.reference), "generated": str(args.generated),
              "normalized": {"size": list(SIZE), "mode": "RGB"},
              "fixedRegions": fixed, "variableRegions": variable,
              "visualAcceptance": {"fixedRegionMinSsim": minimum,
                                    "fixedRegionThreshold": args.threshold,
                                    "passed": minimum >= args.threshold},
              "artifacts": ["thumbnail-4-side-by-side.png", "thumbnail-4-overlay.png", "thumbnail-4-pixel-diff.png"],
              "visualReview": "human inspection required; fixed-region and variable-preview metrics are recorded"}
    (args.output_dir / "thumbnail-4-visual-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    if minimum < args.threshold:
        raise SystemExit(f"Thumbnail 4 fixed-region SSIM below threshold: {minimum:.3f}")


if __name__ == "__main__":
    main()
