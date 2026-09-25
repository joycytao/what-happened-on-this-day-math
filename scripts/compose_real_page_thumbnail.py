#!/usr/bin/env python3
"""Legacy one-template entry point; the reusable five-template pipeline lives in generate_monthly_thumbnails.py."""

from argparse import ArgumentParser
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageFilter, ImageOps


BG = "#FEFFEF"
NAVY = "#2B313F"
ORANGE = "#FF8A00"


def font(path: str | None, size: int):
    candidates = [
        path,
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def fitted_font(text, max_width, start_size):
    size = start_size
    while size > 12:
        candidate = font(None, size)
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textbbox((0, 0), text, font=candidate)[2] <= max_width:
            return candidate
        size -= 1
    return font(None, 12)


def add_card(canvas, page, box, label, label_font, pill_width):
    x, y, w, h = box
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x + 8, y + 10, x + w + 8, y + h + 10), 12, fill=(43, 49, 63, 45))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    canvas.alpha_composite(shadow)

    card = Image.new("RGB", (w, h), "white")
    source = Image.open(page).convert("RGB")
    fitted = ImageOps.contain(source, (w - 12, h - 12), method=Image.Resampling.LANCZOS)
    card.paste(fitted, ((w - fitted.width) // 2, (h - fitted.height) // 2))
    canvas.paste(card, (x, y))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((x, y, x + w, y + h), 12, outline=ORANGE, width=3)
    pill_y = y + h + 10
    draw.rounded_rectangle((x + (w - pill_width) // 2, pill_y, x + (w + pill_width) // 2, pill_y + 54), 27, fill=ORANGE)
    text_box = draw.textbbox((0, 0), label, font=label_font)
    draw.text((x + (w - (text_box[2] - text_box[0])) / 2, pill_y + 7), label, fill="white", font=label_font)


def extract_page_logo(page):
    source = Image.open(page).convert("RGBA")
    crop = source.crop((source.width - 260, source.height - 260, source.width, source.height))
    white = Image.new("RGBA", crop.size, "white")
    diff = ImageChops.difference(crop.convert("RGB"), white.convert("RGB"))
    bbox = diff.getbbox()
    if bbox is not None:
        crop = crop.crop(bbox)
    pixels = crop.load()
    for y in range(crop.height):
        for x in range(crop.width):
            r, g, b, a = pixels[x, y]
            if r > 245 and g > 245 and b > 245:
                pixels[x, y] = (r, g, b, 0)
    return crop


def main():
    parser = ArgumentParser()
    parser.add_argument("--pages-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    pages = {
        "READING PASSAGE": args.pages_dir / "page-001.png",
        "LEVEL 1": args.pages_dir / "page-002.png",
        "LEVEL 2": args.pages_dir / "page-003.png",
        "LEVEL 3": args.pages_dir / "page-004.png",
        "ANSWER KEY": args.pages_dir / "page-125.png",
    }
    missing = [str(path) for path in pages.values() if not path.exists()]
    if missing:
        raise FileNotFoundError(f"missing rendered source pages: {missing}")

    canvas = Image.new("RGBA", (1260, 1260), BG)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((30, 30, 1230, 1230), 26, outline=ORANGE, width=8)

    title_font = fitted_font("WHAT'S INCLUDED", 920, 91)
    label_font = fitted_font("READING PASSAGE", 300, 34)

    draw.text((630, 28), "WHAT'S INCLUDED", anchor="ma", fill=NAVY, font=title_font)
    for points in [((184, 42), (210, 62)), ((176, 78), (208, 78)), ((184, 114), (210, 94)), ((1076, 42), (1050, 62)), ((1084, 78), (1052, 78)), ((1076, 114), (1050, 94))]:
        draw.line(points, fill=ORANGE, width=10)

    card_w, card_h = 380, 440
    top_y, bottom_y = 134, 656
    top_x = [31, 437, 843]
    bottom_x = [196, 646]
    for x, label in zip(top_x, list(pages)[:3]):
        add_card(canvas, pages[label], (x, top_y, card_w, card_h), label, label_font, 320)
    for x, label in zip(bottom_x, list(pages)[3:]):
        add_card(canvas, pages[label], (x, bottom_y, card_w, card_h), label, label_font, 340)

    draw = ImageDraw.Draw(canvas)
    draw.line((50, 1140, 560, 1140), fill=ORANGE, width=5)
    draw.line((700, 1140, 1210, 1140), fill=ORANGE, width=5)
    logo = extract_page_logo(pages["READING PASSAGE"])
    logo.thumbnail((115, 115), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, ((1260 - logo.width) // 2, 1070))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(args.output, "PNG", optimize=True)


if __name__ == "__main__":
    main()
