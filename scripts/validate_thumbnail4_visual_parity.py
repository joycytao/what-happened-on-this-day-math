#!/usr/bin/env python3
"""Validate Thumbnail 4 against the canonical daily-practice reference."""

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
    "header_and_rays": (90, 55, 1170, 300),
    "preview_frame": (300, 315, 960, 1030),
    "use_case_row": (50, 1035, 1210, 1120),
    "footer": (35, 1135, 1225, 1225),
}
VARIABLE_REGIONS = {"worksheet_preview": (325, 320, 935, 1020)}
ARROW_FIXED_REGIONS = {
    "header_and_arrows": FIXED_REGIONS["header_and_rays"],
    "preview_shadow_top": (300, 315, 960, 323),
    "preview_shadow_left": (300, 315, 329, 1020),
    "preview_shadow_right": (930, 315, 960, 1020),
    "preview_shadow_bottom": (300, 1019, 960, 1030),
    "use_case_row": FIXED_REGIONS["use_case_row"],
    "footer": FIXED_REGIONS["footer"],
}


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


def apply_arrow_header(image: Image.Image) -> Image.Image:
    """Build the approved November header variant from the October frame."""
    result = image.copy()
    draw = ImageDraw.Draw(result)
    draw.rectangle((92, 92, 218, 222), fill=tuple(BG.tolist()))
    draw.rectangle((1042, 92, 1168, 222), fill=tuple(BG.tolist()))
    draw.line((122, 157, 190, 157), fill=tuple(ORANGE.tolist()), width=8)
    draw.line((190, 157, 169, 139), fill=tuple(ORANGE.tolist()), width=8)
    draw.line((190, 157, 169, 175), fill=tuple(ORANGE.tolist()), width=8)
    draw.line((1138, 157, 1070, 157), fill=tuple(ORANGE.tolist()), width=8)
    draw.line((1070, 157, 1091, 139), fill=tuple(ORANGE.tolist()), width=8)
    draw.line((1070, 157, 1091, 175), fill=tuple(ORANGE.tolist()), width=8)
    return result


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
    parser.add_argument("--header-style", choices=("rays", "arrows"), default="rays")
    args = parser.parse_args()
    reference = normalize_palette(load(args.reference))
    generated = normalize_palette(load(args.generated))
    if args.header_style == "arrows":
        reference = apply_arrow_header(reference)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    ImageChops.difference(reference, generated).save(args.output_dir / "thumbnail-4-pixel-diff.png")
    Image.blend(reference, generated, 0.5).save(args.output_dir / "thumbnail-4-overlay.png")
    side = Image.new("RGB", (2520, 1260), "white")
    side.paste(reference, (0, 0)); side.paste(generated, (1260, 0))
    side.save(args.output_dir / "thumbnail-4-side-by-side.png")
    fixed_regions = ARROW_FIXED_REGIONS if args.header_style == "arrows" else FIXED_REGIONS
    fixed = {name: compare(reference, generated, box) for name, box in fixed_regions.items()}
    variable = {name: compare(reference, generated, box) for name, box in VARIABLE_REGIONS.items()}
    minimum = min(metric["ssim"] for metric in fixed.values())
    report = {"reference": str(args.reference), "generated": str(args.generated),
              "normalized": {"size": list(SIZE), "mode": "RGB"},
              "fixedRegions": fixed, "variableRegions": variable,
              "visualAcceptance": {"fixedRegionMinSsim": minimum,
                                    "fixedRegionThreshold": args.threshold,
                                    "passed": minimum >= args.threshold},
              "headerStyle": args.header_style,
              "artifacts": ["thumbnail-4-side-by-side.png", "thumbnail-4-overlay.png", "thumbnail-4-pixel-diff.png"],
              "visualReview": "human inspection required; fixed-region and variable-preview metrics are recorded"}
    (args.output_dir / "thumbnail-4-visual-qa.json").write_text(json.dumps(report, indent=2) + "\n")
    if minimum < args.threshold:
        raise SystemExit(f"Thumbnail 4 fixed-region SSIM below threshold: {minimum:.3f}")


if __name__ == "__main__":
    main()
