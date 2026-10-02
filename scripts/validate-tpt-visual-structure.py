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
        score = ssim([ref_pixels[i] for i in selected], [actual_pixels[i] for i in selected])
        results.append({"asset": name, "stable_region_ssim": round(score, 6), "threshold": 0.10, "passed": score >= 0.10})
    report = {"method": "fixed structural regions; variable month/content regions excluded", "results": results, "passed": all(x["passed"] for x in results)}
    Path(args.report).write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if not report["passed"]: raise SystemExit(1)


if __name__ == "__main__": main()
