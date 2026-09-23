#!/usr/bin/env python3
"""Generate the four requested, real-page monthly thumbnail compositions."""

import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

BG = "#FEFFEF"
NAVY = "#2B313F"
ORANGE = "#FF8A00"
SIZE = 1260


def font(size: int, bold: bool = True):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def fitted(text: str, width: int, size: int):
    while size > 12:
        f = font(size)
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), text, font=f)[2] <= width:
            return f
        size -= 1
    return font(12)


def base_canvas():
    canvas = Image.new("RGBA", (SIZE, SIZE), BG)
    ImageDraw.Draw(canvas).rounded_rectangle((30, 30, 1230, 1230), 26, outline=ORANGE, width=8)
    return canvas


def accented_title(draw, text, y, size, max_width=1080):
    """Production-style title with short orange rays on both sides."""
    centered(draw, text, y, size, max_width)
    f = fitted(text, max_width, size)
    text_width = draw.textbbox((0, 0), text, font=f)[2]
    gap = 28
    ray = 48
    left = (SIZE - text_width) // 2 - gap
    right = (SIZE + text_width) // 2 + gap
    draw.line((left - ray, y + size // 2, left, y + size // 2), fill=ORANGE, width=7)
    draw.line((left - ray + 8, y + size // 2 - 24, left - 10, y + size // 2 - 8), fill=ORANGE, width=7)
    draw.line((right, y + size // 2, right + ray, y + size // 2), fill=ORANGE, width=7)
    draw.line((right + 10, y + size // 2 - 8, right + ray - 8, y + size // 2 - 24), fill=ORANGE, width=7)


def footer(canvas):
    draw = ImageDraw.Draw(canvas)
    draw.line((50, 1140, 560, 1140), fill=ORANGE, width=5)
    draw.line((700, 1140, 1210, 1140), fill=ORANGE, width=5)


def pumpkin_doodle(canvas):
    """Draw a stable, recognizable single-line October accent."""
    draw = ImageDraw.Draw(canvas)
    stroke = 8
    cx, cy = 630, 650
    for box in [(430, 500, 625, 820), (520, 470, 740, 830), (635, 500, 830, 820)]:
        draw.arc(box, 70, 290, fill=ORANGE, width=stroke)
    draw.arc((400, 520, 860, 820), 180, 360, fill=ORANGE, width=stroke)
    draw.arc((400, 470, 860, 790), 0, 180, fill=ORANGE, width=stroke)
    draw.line((cx, 500, cx + 10, 430), fill=ORANGE, width=stroke)
    draw.arc((635, 405, 770, 500), 190, 345, fill=ORANGE, width=stroke)
    draw.arc((680, 425, 790, 510), 205, 335, fill=ORANGE, width=stroke)
    draw.arc((475, 435, 590, 535), 205, 350, fill=ORANGE, width=stroke)
    draw.line((cx - 14, 430, cx - 5, 385), fill=ORANGE, width=stroke)


def centered(draw, text, y, size, max_width=1120, fill=NAVY):
    draw.text((630, y), text, anchor="ma", fill=fill, font=fitted(text, max_width, size))


def pill(draw, box, text, size=34):
    x, y, w, h = box
    draw.rounded_rectangle((x, y, x + w, y + h), h // 2, fill=ORANGE)
    draw.text((x + w // 2, y + 9), text, anchor="ma", fill="white", font=fitted(text, w - 24, size))


def card(canvas, page, box, label):
    x, y, w, h = box
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((x + 8, y + 10, x + w + 8, y + h + 10), 12, fill=(43, 49, 63, 45))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(8)))
    source = Image.open(page).convert("RGB")
    fitted_image = ImageOps.contain(source, (w - 12, h - 12), method=Image.Resampling.LANCZOS)
    sheet = Image.new("RGB", (w, h), "white")
    sheet.paste(fitted_image, ((w - fitted_image.width) // 2, (h - fitted_image.height) // 2))
    canvas.paste(sheet, (x, y))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((x, y, x + w, y + h), 12, outline=ORANGE, width=3)
    pill(draw, (x, y + h + 10, w, 54), label, 34)


def logo(canvas, page):
    source = Image.open(page).convert("RGBA")
    crop = source.crop((source.width - 260, source.height - 260, source.width, source.height))
    diff = ImageChops.difference(crop.convert("RGB"), Image.new("RGB", crop.size, "white"))
    bbox = diff.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    pixels = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = pixels[x, y]
            if r > 245 and g > 245 and b > 245:
                pixels[x, y] = (r, g, b, 0)
    crop.thumbnail((115, 115), Image.Resampling.LANCZOS)
    canvas.alpha_composite(crop, ((SIZE - crop.width) // 2, 1095))


def compose_cover(month, out, source_page):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, month.upper(), 94, 106, 1050)
    centered(draw, "MORNING WORK MATH", 232, 66, 1080)
    centered(draw, "31 DAILY WORD PROBLEMS · 3 LEVELS", 326, 31, 1080)
    centered(draw, "HISTORICAL MINI-STORIES", 374, 31, 1080)
    pumpkin_doodle(canvas)
    footer(canvas)
    if source_page:
        logo(canvas, source_page)
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_whats_included(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    accented_title(draw, "WHAT'S INCLUDED", 54, 72, 1000)
    for x, key, label in [(45, "story", "STORY"), (435, "level1", "LEVEL 1"), (825, "level2", "LEVEL 2")]:
        card(canvas, pages[key], (x, 210, 340, 430), label)
    for x, key, label in [(240, "level3", "LEVEL 3"), (680, "answer_key", "ANSWER KEY")]:
        card(canvas, pages[key], (x, 730, 340, 330), label)
    footer(canvas)
    logo(canvas, pages["story"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_different_math(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "ONE STORY", 52, 88, 1080)
    centered(draw, "DIFFERENT MATH", 148, 70, 1080)
    for box, key, label in [
        ((55, 290, 350, 590), "level1", "LEVEL 1"),
        ((455, 290, 350, 590), "level2", "LEVEL 2"),
        ((855, 290, 350, 590), "level3", "LEVEL 3"),
    ]:
        card(canvas, pages[key], box, label)
    footer(canvas)
    logo(canvas, pages["level1"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_daily_practice(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "READY FOR", 52, 88, 1080)
    centered(draw, "DAILY PRACTICE", 148, 70, 1080)
    card(canvas, pages["worksheet"], (320, 300, 620, 610), "DAILY WORD PROBLEM")
    centered(draw, "MORNING WORK   |   BELL RINGERS   |   HOMESCHOOL", 990, 24, 1130)
    footer(canvas)
    logo(canvas, pages["worksheet"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    manifest_path = args.manifest.resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    pdf = Path(manifest["pdf"]["path"])
    if not pdf.is_absolute():
        pdf = (Path.cwd() / pdf).resolve()
        if not pdf.exists():
            pdf = (manifest_path.parent / manifest["pdf"]["path"]).resolve()
    actual_pdf_sha256 = hashlib.sha256(pdf.read_bytes()).hexdigest()
    expected_pdf_sha256 = manifest["pdf"]["sha256"]
    if actual_pdf_sha256 != expected_pdf_sha256:
        raise RuntimeError(
            f"stale thumbnail inputs: PDF checksum is {actual_pdf_sha256}, "
            f"manifest expects {expected_pdf_sha256}"
        )
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="monthly-thumbnail-pages-") as temp:
        subprocess.run(["python3", "scripts/render_monthly_thumbnail_pages.py", "--manifest", str(manifest_path), "--output-dir", temp], check=True)
        source = {int(path.stem.split("-")[1]): path for path in Path(temp).glob("page-*.png")}
        pages = manifest["templates"]
        prefix = f"{manifest['product']['month']}-{manifest['product']['version']}"
        render_page = lambda page: source[page]
        whats = {key: render_page(page) for key, page in pages["whats_included"]["source_pages"].items()}
        different = {key: render_page(page) for key, page in pages["different_math"]["source_pages"].items()}
        daily = {key: render_page(page) for key, page in pages["daily_practice"]["source_pages"].items()}
        first = whats["story"]
        compose_cover(manifest["product"]["month"], args.output_dir / f"{prefix}-cover.png", first)
        compose_whats_included(whats, args.output_dir / f"{prefix}-whats-included.png")
        compose_different_math(different, args.output_dir / f"{prefix}-different-math.png")
        compose_daily_practice(daily, args.output_dir / f"{prefix}-daily-practice.png")
    names = ["cover", "whats-included", "different-math", "daily-practice"]
    labels = {
        "cover": ["October", "Morning Work Math", "31 Daily Word Problems · 3 Levels", "Historical Mini-Stories"],
        "whats_included": ["What's Included", "Story", "Level 1", "Level 2", "Level 3", "Answer Key"],
        "different_math": ["One Story", "Different Math", "Level 1", "Level 2", "Level 3"],
        "daily_practice": ["Ready for", "Daily Practice", "Morning Work", "Bell Ringers", "Homeschool"],
    }
    checksums = {name: hashlib.sha256((args.output_dir / f"{prefix}-{name}.png").read_bytes()).hexdigest() for name in names}
    report = {
        "design": "october-production-v2",
        "style": {
            "canvas": [SIZE, SIZE],
            "background": BG,
            "ink": NAVY,
            "accent": ORANGE,
            "border": {"margin": 30, "radius": 26, "width": 8},
            "deterministic": True,
        },
        "templates": names,
        "labels": labels,
        "checksums": checksums,
        "pdf": manifest["pdf"]["path"],
        "pdf_sha256": actual_pdf_sha256,
        "copyConcepts": {
            "cover": {"headline": "October", "productTitle": "MORNING WORK MATH", "supportingText": ["31 DAILY WORD PROBLEMS · 3 LEVELS", "HISTORICAL MINI-STORIES"], "doodle": "orange line-art pumpkin"},
            "whats_included": {"headline": "WHAT'S INCLUDED", "sourceLayout": "story, level 1, level 2 / level 3, answer key"},
            "different_math": {"headline": ["ONE STORY", "DIFFERENT MATH"], "sourceLayout": "level 1, level 2, level 3 in one row"},
            "daily_practice": {"headline": ["READY FOR", "DAILY PRACTICE"], "useCases": ["MORNING WORK", "BELL RINGERS", "HOMESCHOOL"]},
        },
    }
    (args.output_dir / "monthly-thumbnail-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
