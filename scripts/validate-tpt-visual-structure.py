#!/usr/bin/env python3
"""Compare stable thumbnail geometry while allowing month/content substitutions."""
import argparse
import json
from pathlib import Path
from PIL import Image


def ssim(a, b):
    n = len(a)
    mu_a, mu_b = sum(a) / n, sum(b) / n
    var_a = sum((x - mu_a) ** 2 for x in a) / n
    var_b = sum((x - mu_b) ** 2 for x in b) / n
    cov = sum((x - mu_a) * (y - mu_b) for x, y in zip(a, b)) / n
    c1, c2 = 6.5025, 58.5225
    return float(((2 * mu_a * mu_b + c1) * (2 * cov + c2)) / ((mu_a ** 2 + mu_b ** 2 + c1) * (var_a + var_b + c2)))


def mask_for(name):
    mask = [[False] * 1260 for _ in range(1260)]
    for y in range(1260):
        for x in range(1260):
            mask[y][x] = y < 28 or y >= 1232 or x < 28 or x >= 1232
    if name == "cover":
        for y in range(1080, 1235):
            for x in range(30, 1230): mask[y][x] = True
        for y in range(980, 1050):
            for x in range(80, 1180): mask[y][x] = True
    elif name == "whats-included":
        for y in list(range(25, 135)) + list(range(1080, 1235)):
            for x in range(1260): mask[y][x] = True
        for y in list(range(580, 650)) + list(range(1110, 1190)):
            for x in range(30, 1230): mask[y][x] = True
    elif name == "different-math":
        for y in list(range(25, 42)) + list(range(1160, 1235)):
            for x in range(1260): mask[y][x] = True
        for y in range(435, 955):
            for x in list(range(45, 70)) + list(range(405, 435)) + list(range(435, 460)) + list(range(810, 835)) + list(range(835, 860)) + list(range(1190, 1220)): mask[y][x] = True
        for y in range(980, 1080):
            for x in range(50, 1210): mask[y][x] = True
    elif name == "daily-practice":
        for y in list(range(25, 45)) + list(range(1160, 1235)):
            for x in range(1260): mask[y][x] = True
        for y in range(315, 1030):
            for x in list(range(320, 345)) + list(range(925, 950)): mask[y][x] = True
        for y in range(1015, 1110):
            for x in range(50, 1210): mask[y][x] = True
    elif name == "landing-page":
        for y in list(range(25, 45)) + list(range(1140, 1235)):
            for x in range(1260): mask[y][x] = True
        for y in list(range(40, 420)) + list(range(950, 1110)):
            for x in range(35, 1225): mask[y][x] = True
        for y in range(430, 965):
            for x in range(1260):
                if x < 38 or x > 1222: mask[y][x] = True
    return mask


def dark_bbox(image, box):
    """Return the ink bounds for a fixed typography region."""
    x0, y0, x1, y1 = box
    pixels = image.load()
    points = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = pixels[x, y]
            if r < 80 and g < 90 and b < 110:
                points.append((x, y))
    if not points:
        return None
    return [min(x for x, _ in points), min(y for _, y in points), max(x for x, _ in points) + 1, max(y for _, y in points) + 1]


def card_structure_metrics(reference, actual, box):
    """Compare sheet silhouettes while excluding worksheet copy and math text."""
    x0, y0, x1, y1 = box
    ref_pixels, actual_pixels = reference.load(), actual.load()
    ref_bits, actual_bits = [], []
    for y in range(y0, y1):
        for x in range(x0, x1):
            rr, rg, rb = ref_pixels[x, y]
            ar, ag, ab = actual_pixels[x, y]
            # The ivory background is blue-channel 239; the white sheet and
            # its crop are materially brighter. This deliberately ignores
            # worksheet text while preserving card position, size, rotation,
            # overlap, and much of the shadow boundary.
            ref_bits.append(rb > 248 and rr > 245 and rg > 245)
            actual_bits.append(ab > 248 and ar > 245 and ag > 245)
    intersection = sum(a and b for a, b in zip(ref_bits, actual_bits))
    union = sum(a or b for a, b in zip(ref_bits, actual_bits))
    matches = sum(a == b for a, b in zip(ref_bits, actual_bits))
    return {
        "region": list(box),
        "silhouette_iou": round(intersection / union, 6) if union else 0.0,
        "silhouette_matching_ratio": round(matches / len(ref_bits), 6),
        "passed": (intersection / union >= 0.28 and matches / len(ref_bits) >= 0.38) if union else False,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--canonical-dir", required=True)
    parser.add_argument("--generated-dir", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    canonical_dir, generated_dir = Path(args.canonical_dir), Path(args.generated_dir)
    results = []
    reference_numbers = {"cover": "1", "whats-included": "2", "different-math": "3", "daily-practice": "4", "landing-page": "5"}
    for name in ("cover", "whats-included", "different-math", "daily-practice", "landing-page"):
        ref = Image.open(canonical_dir / f"thumbnail-{reference_numbers[name]}-reference.png").convert("L").resize((1260, 1260), Image.Resampling.LANCZOS)
        actual = Image.open(next(generated_dir.glob(f"*-{name}.png"))).convert("L")
        if actual.size != (1260, 1260):
            raise SystemExit(f"{name}: generated asset must be 1260x1260")
        mask = mask_for(name)
        ref_pixels, actual_pixels = list(ref.getdata()), list(actual.getdata())
        selected = [i for i, included in enumerate(sum(mask, [])) if included]
        ref_selected = [ref_pixels[i] for i in selected]
        actual_selected = [actual_pixels[i] for i in selected]
        score = ssim(ref_selected, actual_selected)
        absolute_differences = [abs(a - b) for a, b in zip(ref_selected, actual_selected)]
        result = {
            "asset": name,
            "stable_region_ssim": round(score, 6),
            "pixel_comparison": {
                "mean_absolute_error": round(sum(absolute_differences) / len(absolute_differences), 6),
                "matching_pixel_ratio_at_16": round(sum(diff <= 16 for diff in absolute_differences) / len(absolute_differences), 6),
                "compared_pixels": len(selected),
            },
            "threshold": 0.10,
            "passed": score >= 0.10,
        }
        if name == "landing-page":
            ref_rgb = ref.convert("RGB")
            actual_rgb = Image.open(next(generated_dir.glob(f"*-{name}.png"))).convert("RGB")
            diff = Image.new("RGB", actual_rgb.size)
            overlay = Image.blend(ref_rgb, actual_rgb, 0.5)
            diff_pixels = []
            for ref_pixel, actual_pixel, included in zip(ref_rgb.getdata(), actual_rgb.getdata(), sum(mask, [])):
                if not included:
                    diff_pixels.append((255, 255, 255))
                    continue
                delta = max(abs(a - b) for a, b in zip(ref_pixel, actual_pixel))
                diff_pixels.append((min(255, delta * 4), 0, 0))
            diff.putdata(diff_pixels)
            diff_path = generated_dir / "landing-page-pixel-diff.png"
            overlay_path = generated_dir / "landing-page-overlay.png"
            diff.save(diff_path, "PNG", optimize=True)
            overlay.save(overlay_path, "PNG", optimize=True)
            result["pixel_comparison"].update({"diff_artifact": str(diff_path), "overlay_artifact": str(overlay_path)})
            card_regions = {
                "reading_passage": (35, 440, 305, 970),
                "level1": (265, 440, 535, 970),
                "level2": (495, 440, 765, 970),
                "level3": (725, 440, 995, 970),
                "answer_key": (950, 440, 1225, 970),
            }
            card_metrics = {key: card_structure_metrics(ref_rgb, actual_rgb, box) for key, box in card_regions.items()}
            result["card_layout"] = {
                "method": "white-sheet silhouette IoU per fixed card region; worksheet copy excluded",
                "regions": card_metrics,
                "passed": all(item["passed"] for item in card_metrics.values()),
            }
            typography_regions = {
                "month": (270, 40, 990, 190),
                "title": (40, 200, 1220, 345),
                "subtitle": (70, 340, 1190, 420),
                "labels": (70, 960, 1200, 1045),
            }
            ref_bboxes = {key: dark_bbox(ref_rgb, box) for key, box in typography_regions.items()}
            actual_bboxes = {key: dark_bbox(actual_rgb, box) for key, box in typography_regions.items()}
            typography_deltas = {}
            for key in typography_regions:
                ref_box, actual_box = ref_bboxes[key], actual_bboxes[key]
                if not ref_box or not actual_box:
                    typography_deltas[key] = {"reference_bbox": ref_box, "actual_bbox": actual_box, "passed": False}
                    continue
                deltas = [actual_box[index] - ref_box[index] for index in range(4)]
                if key == "month":
                    ref_center = (ref_box[0] + ref_box[2]) / 2, (ref_box[1] + ref_box[3]) / 2
                    actual_center = (actual_box[0] + actual_box[2]) / 2, (actual_box[1] + actual_box[3]) / 2
                    typography_passed = (
                        abs(actual_center[0] - ref_center[0]) <= 12
                        and abs(actual_center[1] - ref_center[1]) <= 24
                        and abs((actual_box[3] - actual_box[1]) - (ref_box[3] - ref_box[1])) <= 50
                    )
                else:
                    typography_passed = max(abs(delta) for delta in deltas) <= 30
                typography_deltas[key] = {
                    "reference_bbox": ref_box,
                    "actual_bbox": actual_box,
                    "edge_deltas": deltas,
                    "passed": typography_passed,
                }
            result["typography_layout"] = {
                "method": "dark-ink bounding boxes in fixed title and label regions",
                "regions": typography_deltas,
                "passed": all(item["passed"] for item in typography_deltas.values()),
            }
            result["passed"] = result["passed"] and result["card_layout"]["passed"] and result["typography_layout"]["passed"]
        results.append(result)
    report = {"method": "fixed structural regions; variable month/content regions excluded", "results": results, "passed": all(x["passed"] for x in results)}
    Path(args.report).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if not report["passed"]: raise SystemExit(1)


if __name__ == "__main__": main()
