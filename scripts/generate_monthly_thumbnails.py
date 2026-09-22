#!/usr/bin/env python3
"""Generate the five reusable, real-page monthly thumbnail compositions."""

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


def doodle(draw, center=(630, 560), scale=1.0):
    cx, cy = center
    w = int(7 * scale)
    draw.ellipse((cx - 104 * scale, cy - 60 * scale, cx + 80 * scale, cy + 88 * scale), outline=ORANGE, width=w)
    draw.arc((cx - 130 * scale, cy - 100 * scale, cx + 100 * scale, cy + 92 * scale), 220, 345, fill=ORANGE, width=w)
    draw.line((cx, cy + 82 * scale, cx - 8 * scale, cy + 150 * scale), fill=ORANGE, width=w)
    draw.line((cx - 8 * scale, cy + 150 * scale, cx - 66 * scale, cy + 150 * scale), fill=ORANGE, width=w)
    draw.line((cx + 10 * scale, cy - 58 * scale, cx + 52 * scale, cy - 100 * scale), fill=ORANGE, width=w)
    draw.line((cx + 58 * scale, cy - 106 * scale, cx + 93 * scale, cy - 87 * scale), fill=ORANGE, width=w)


def footer(canvas):
    draw = ImageDraw.Draw(canvas)
    draw.line((50, 1140, 560, 1140), fill=ORANGE, width=5)
    draw.line((700, 1140, 1210, 1140), fill=ORANGE, width=5)


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
    canvas, draw = base_canvas(), ImageDraw.Draw(base_canvas())
    draw = ImageDraw.Draw(canvas)
    centered(draw, month.upper(), 102, 104)
    centered(draw, "MORNING WORK MATH", 248, 73)
    centered(draw, "31 DAILY WORD PROBLEMS · 3 LEVELS", 380, 39)
    doodle(draw, (630, 650), 1.15)
    centered(draw, "HISTORICAL MINI-STORIES", 900, 38)
    footer(canvas)
    if source_page:
        logo(canvas, source_page)
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_overview(month, out, source_page):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, month.upper(), 92, 92)
    centered(draw, "ONE STORY · THREE MATH LEVELS", 230, 51)
    doodle(draw, (630, 580), 1.1)
    centered(draw, "A DAILY ROUTINE WITH REAL HISTORY", 870, 37)
    centered(draw, "MATH-FIRST · ROUTINE-FIRST · HISTORY DIFFERENTIATION", 940, 27)
    footer(canvas)
    if source_page:
        logo(canvas, source_page)
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_whats_included(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "WHAT'S INCLUDED", 28, 91, 920)
    for points in [((184, 42), (210, 62)), ((176, 78), (208, 78)), ((184, 114), (210, 94)), ((1076, 42), (1050, 62)), ((1084, 78), (1052, 78)), ((1076, 114), (1050, 94))]:
        draw.line(points, fill=ORANGE, width=10)
    for x, key, label in [(31, "story", "STORY"), (437, "level1", "LEVEL 1"), (843, "level2", "LEVEL 2")]:
        card(canvas, pages[key], (x, 134, 380, 440), label)
    for x, key, label in [(196, "level3", "LEVEL 3"), (646, "answer_key", "ANSWER KEY")]:
        card(canvas, pages[key], (x, 632, 380, 380), label)
    footer(canvas)
    logo(canvas, pages["story"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_different_math(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "ONE STORY", 72, 88)
    centered(draw, "DIFFERENT MATH", 190, 77)
    card(canvas, pages["level1"], (55, 420, 370, 470), "LEVEL 1")
    card(canvas, pages["level2"], (445, 420, 370, 470), "LEVEL 2")
    card(canvas, pages["level3"], (835, 420, 370, 470), "LEVEL 3")
    footer(canvas)
    logo(canvas, pages["level1"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_daily_practice(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "READY FOR DAILY PRACTICE", 75, 69, 1080)
    centered(draw, "ONE PROBLEM A DAY", 190, 48)
    card(canvas, pages["worksheet"], (280, 320, 700, 650), "DAILY WORD PROBLEM")
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
    doodle_path = Path(manifest["doodle"]["path"])
    if not doodle_path.is_absolute():
        doodle_path = (Path.cwd() / doodle_path).resolve()
    if not doodle_path.exists():
        raise FileNotFoundError(f"doodle asset does not exist: {doodle_path}")
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
        compose_overview(manifest["product"]["month"], args.output_dir / f"{prefix}-overview.png", first)
        compose_whats_included(whats, args.output_dir / f"{prefix}-whats-included.png")
        compose_different_math(different, args.output_dir / f"{prefix}-different-math.png")
        compose_daily_practice(daily, args.output_dir / f"{prefix}-daily-practice.png")
    names = ["cover", "overview", "whats-included", "different-math", "daily-practice"]
    labels = {
        "whats_included": ["WHAT'S INCLUDED", "STORY", "LEVEL 1", "LEVEL 2", "LEVEL 3", "ANSWER KEY"],
        "different_math": ["ONE STORY", "DIFFERENT MATH", "LEVEL 1", "LEVEL 2", "LEVEL 3"],
        "daily_practice": ["READY FOR DAILY PRACTICE", "ONE PROBLEM A DAY"],
    }
    checksums = {name: hashlib.sha256((args.output_dir / f"{prefix}-{name}.png").read_bytes()).hexdigest() for name in names}
    report = {
        "templates": names,
        "labels": labels,
        "checksums": checksums,
        "doodle": manifest["doodle"]["path"],
        "pdf": manifest["pdf"]["path"],
        "pdf_sha256": actual_pdf_sha256,
    }
    (args.output_dir / "monthly-thumbnail-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
