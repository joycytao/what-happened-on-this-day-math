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
        "/System/Library/Fonts/Supplemental/Arial Black.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def fitted(text: str, width: int, size: int, bold: bool = True):
    while size > 12:
        f = font(size, bold)
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), text, font=f)[2] <= width:
            return f
        size -= 1
    return font(12, bold)


def base_canvas():
    canvas = Image.new("RGBA", (SIZE, SIZE), BG)
    ImageDraw.Draw(canvas).rounded_rectangle((30, 30, 1230, 1230), 26, outline=ORANGE, width=8)
    return canvas


def accented_title(draw, text, y, size, max_width=1080):
    """Production-style title with three hand-drawn rays on each side."""
    centered(draw, text, y, size, max_width)
    f = fitted(text, max_width, size)
    text_width = draw.textbbox((0, 0), text, font=f)[2]
    gap = 34
    ray = 50
    left = (SIZE - text_width) // 2 - gap
    right = (SIZE + text_width) // 2 + gap
    mid = y + size // 2
    draw.line((left - ray, mid - 26, left - 10, mid - 4), fill=ORANGE, width=8)
    draw.line((left - ray - 8, mid + 2, left - 10, mid + 2), fill=ORANGE, width=8)
    draw.line((left - ray, mid + 30, left - 10, mid + 8), fill=ORANGE, width=8)
    draw.line((right + 10, mid - 4, right + ray, mid - 26), fill=ORANGE, width=8)
    draw.line((right + 10, mid + 2, right + ray + 8, mid + 2), fill=ORANGE, width=8)
    draw.line((right + 10, mid + 8, right + ray, mid + 30), fill=ORANGE, width=8)


def side_lines(draw, y, size, gap=44, ray=58):
    """One short orange horizontal line on either side of a two-line title."""
    mid = y + size // 2
    draw.line((50, mid, 165, mid), fill=ORANGE, width=7)
    draw.line((SIZE - 165, mid, SIZE - 50, mid), fill=ORANGE, width=7)


def footer(canvas):
    draw = ImageDraw.Draw(canvas)
    draw.line((45, 1160, 500, 1160), fill=ORANGE, width=6)
    draw.line((760, 1160, 1215, 1160), fill=ORANGE, width=6)
    studio_logo(draw, 630, 1160, 116)


def pumpkin_doodle(canvas):
    """Draw the compact three-lobed pumpkin used by the reference cover."""
    draw = ImageDraw.Draw(canvas)
    stroke = 8
    draw.ellipse((445, 625, 620, 895), outline=ORANGE, width=stroke)
    draw.ellipse((540, 600, 720, 910), outline=ORANGE, width=stroke)
    draw.ellipse((650, 625, 825, 895), outline=ORANGE, width=stroke)
    draw.line((630, 625, 642, 545), fill=ORANGE, width=stroke)
    draw.arc((633, 512, 720, 575), 190, 350, fill=ORANGE, width=stroke)


def centered(draw, text, y, size, max_width=1120, fill=NAVY, bold=True):
    draw.text((630, y), text, anchor="ma", fill=fill, font=fitted(text, max_width, size, bold))


def studio_logo(draw, center_x, center_y, size):
    half = size // 2
    points = [(center_x, center_y - half), (center_x + half, center_y - half // 2),
              (center_x + half, center_y + half // 2), (center_x, center_y + half),
              (center_x - half, center_y + half // 2), (center_x - half, center_y - half // 2)]
    draw.polygon(points, fill=ORANGE)
    inner = max(2, size // 25)
    draw.line(points + [points[0]], fill="white", width=inner)
    draw.text((center_x - 4, center_y - size // 8), "6", anchor="mm", fill="white", font=font(size // 2, True))
    draw.text((center_x + size // 5, center_y - size // 5), "pm", anchor="mm", fill="white", font=font(size // 8, False))
    draw.text((center_x, center_y + size // 4), "Studio", anchor="mm", fill="white", font=font(size // 8, False))


def pill(draw, box, text, size=34):
    x, y, w, h = box
    draw.rounded_rectangle((x, y, x + w, y + h), h // 2, fill=ORANGE)
    draw.text((x + w // 2, y + 9), text, anchor="ma", fill="white", font=fitted(text, w - 24, size))


def card(canvas, page, box, label, label_style="pill"):
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
    draw.rounded_rectangle((x, y, x + w, y + h), 12, outline=ORANGE, width=5)
    if label_style == "pill":
        pill(draw, (x, y + h + 10, w, 54), label, 34)
    elif label_style == "navy":
        draw.text(
            (x + w // 2, y + h + 20),
            label,
            anchor="ma",
            fill=NAVY,
            font=fitted(label, w - 10, 32),
        )


def logo(canvas, page):
    """Compatibility hook; the shared vector logo is drawn by footer()."""
    return None


def compose_cover(month, out, source_page):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, month.upper(), 104, 120, 1080)
    centered(draw, "MORNING WORK MATH", 282, 68, 1120)
    centered(draw, "31 DAILY WORD PROBLEMS · 3 LEVELS", 390, 32, 1120, bold=False)
    centered(draw, "HISTORICAL MINI-STORIES", 444, 32, 1120, bold=False)
    pumpkin_doodle(canvas)
    footer(canvas)
    if source_page:
        logo(canvas, source_page)
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_whats_included(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    accented_title(draw, "WHAT'S INCLUDED", 34, 70, 1120)
    for x, key, label in [(30, "story", "STORY"), (440, "level1", "LEVEL 1"), (850, "level2", "LEVEL 2")]:
        card(canvas, pages[key], (x, 140, 380, 440), label)
    for x, key, label in [(195, "level3", "LEVEL 3"), (645, "answer_key", "ANSWER KEY")]:
        card(canvas, pages[key], (x, 650, 420, 360), label)
    footer(canvas)
    logo(canvas, pages["story"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_different_math(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "ONE STORY", 60, 102, 1120)
    centered(draw, "DIFFERENT MATH", 188, 82, 1120)
    side_lines(draw, 220, 82)
    for box, key, label in [
        ((48, 430, 374, 500), "level1", "LEVEL 1"),
        ((443, 430, 374, 500), "level2", "LEVEL 2"),
        ((838, 430, 374, 500), "level3", "LEVEL 3"),
    ]:
        card(canvas, pages[key], box, label, label_style="navy")
    footer(canvas)
    logo(canvas, pages["level1"])
    canvas.convert("RGB").save(out, "PNG", optimize=True)


def compose_daily_practice(pages, out):
    canvas = base_canvas()
    draw = ImageDraw.Draw(canvas)
    centered(draw, "READY FOR", 46, 102, 1120)
    accented_title(draw, "DAILY PRACTICE", 178, 88, 1120)
    card(canvas, pages["worksheet"], (325, 320, 610, 700), "", label_style="none")
    items = ["MORNING WORK", "BELL RINGERS", "HOMESCHOOL"]
    widths = [draw.textbbox((0, 0), item, font=font(30))[2] for item in items]
    total = sum(widths) + 2 * 62
    x = (SIZE - total) // 2
    for index, item in enumerate(items):
        draw.text((x, 1050), item, anchor="la", fill=NAVY, font=font(30))
        x += widths[index]
        if index < len(items) - 1:
            draw.line((x + 31, 1040, x + 31, 1080), fill=ORANGE, width=6)
            x += 62
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
            "whats_included": {"headline": "WHAT'S INCLUDED", "sourceLayout": "story, level 1, level 2 / level 3, answer key", "headlineEmphasis": "three orange rays on each side"},
            "different_math": {"headline": ["ONE STORY", "DIFFERENT MATH"], "sourceLayout": "level 1, level 2, level 3 in one row", "headlineSideLines": "one orange horizontal line on each side", "labelStyle": "large navy labels"},
            "daily_practice": {"headline": ["READY FOR", "DAILY PRACTICE"], "useCases": ["MORNING WORK", "BELL RINGERS", "HOMESCHOOL"], "headlineEmphasis": "three orange rays on each side", "useCaseSeparators": "vertical orange lines"},
        },
    }
    (args.output_dir / "monthly-thumbnail-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
