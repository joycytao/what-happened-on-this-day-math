from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).parent
OUT = ROOT / "output"
ASSET = ROOT / "assets" / "learning-system-week-01.png"
FOLDER_ASSET = ROOT / "assets" / "learning-system-folders-week-01.png"
W, H = 1080, 1350
INK = (32, 50, 69)
CREAM = (246, 240, 226)
BEIGE = (216, 198, 178)
WHITE = (255, 253, 248)
MUTED = (104, 101, 94)

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
VERDANA = "/System/Library/Fonts/Supplemental/Verdana.ttf"
GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"


def font(path, size, index=0):
    return ImageFont.truetype(path, size=size, index=index)


F = {
    "display": font(AVENIR, 66, 2),
    "title": font(AVENIR, 52, 2),
    "subtitle": font(AVENIR, 29, 5),
    "label": font(VERDANA, 18),
    "body": font(GEORGIA, 28),
    "small": font(VERDANA, 20),
}


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def header(im, d, page):
    d.text((80, 58), "@engineermom.worksheets", font=F["label"], fill=INK)
    d.text((900, 58), f"{page}/06", font=F["label"], fill=INK)
    d.line((80, 98, 1000, 98), fill=BEIGE, width=2)


def background():
    src = Image.open(ASSET).convert("RGB")
    scale = W / src.width
    src = src.resize((W, round(src.height * scale)), Image.Resampling.LANCZOS)
    top = max(0, (src.height - H) // 2)
    return src.crop((0, top, W, top + H)).convert("RGBA")


def slide_1():
    im = background()
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, 1080, 1350), fill=(*CREAM, 52))
    im = Image.alpha_composite(im, overlay)
    d = ImageDraw.Draw(im)
    header(im, d, 1)

    panel = Image.new("RGBA", (900, 740), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((0, 0, 900, 740), radius=28, fill=(*CREAM, 178), outline=(*BEIGE, 170), width=3)
    im.alpha_composite(panel, (80, 474))
    d = ImageDraw.Draw(im)

    d.text((126, 526), "A NEW WEEKLY SYSTEM", font=F["label"], fill=INK)
    d.multiline_text(
        (126, 594),
        "I started building\na learning system\nfor my child.",
        font=F["display"], fill=INK, spacing=4,
    )
    d.text((126, 916), "Every worksheet and test now has a place.", font=F["subtitle"], fill=MUTED)
    d.line((126, 1000, 934, 1000), fill=BEIGE, width=2)
    d.text((126, 1040), "SAVE  •  ANALYZE  •  PERSONALIZE", font=F["small"], fill=INK)
    d.text((126, 1114), "Turn scattered papers into a learning record.", font=F["body"], fill=INK)
    return im.convert("RGB")


def slide_2():
    im = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(im)
    header(im, d, 2)

    d.text((80, 150), "THE PROBLEM", font=F["label"], fill=INK)
    d.multiline_text(
        (80, 206),
        "COMPLETED WORKSHEETS\nAND TESTS SHOULDN’T\nDISAPPEAR AFTER GRADING.",
        font=F["title"], fill=INK, spacing=2,
    )

    rr(d, (80, 444, 1000, 760), 24, WHITE, BEIGE, 3)
    d.text((124, 494), "THEY ARE MORE THAN ONE-TIME HOMEWORK", font=F["label"], fill=MUTED)
    d.multiline_text(
        (124, 556),
        "They show what your child practiced,\nunderstood, and still needs to review.",
        font=F["body"], fill=INK, spacing=9,
    )
    d.line((124, 688, 956, 688), fill=BEIGE, width=2)
    d.text((124, 710), "The first step is keeping the evidence.", font=F["subtitle"], fill=INK)

    # Use the lifestyle scene as a quiet visual anchor, not a worksheet close-up.
    photo = background().convert("RGB").crop((0, 770, W, 1350))
    photo = photo.resize((W, 520), Image.Resampling.LANCZOS)
    im.paste(photo, (0, 830))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 830, W, 1350), outline=BEIGE, width=3)
    return im


def slide_3():
    src = Image.open(ROOT / "assets" / "learning-system-digital-week-01.png").convert("RGB")
    scale = W / src.width
    src = src.resize((W, round(src.height * scale)), Image.Resampling.LANCZOS)
    top = max(0, (src.height - H) // 2)
    im = src.crop((0, top, W, top + H)).convert("RGBA")

    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    vd.rectangle((0, 0, W, H), fill=(*CREAM, 38))
    im = Image.alpha_composite(im, veil)
    d = ImageDraw.Draw(im)
    header(im, d, 3)

    panel = Image.new("RGBA", (530, 520), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((0, 0, 530, 520), radius=26, fill=(*CREAM, 158), outline=(*BEIGE, 135), width=3)
    im.alpha_composite(panel, (80, 660))
    d = ImageDraw.Draw(im)
    d.text((124, 732), "STEP 1", font=F["label"], fill=INK)
    d.multiline_text((124, 790), "SAVE THE\nEVIDENCE.", font=F["title"], fill=INK, spacing=0)
    d.multiline_text(
        (124, 960),
        "Keep the worksheets and tests\nthat show how your child is learning.",
        font=F["body"], fill=INK, spacing=8,
    )
    d.line((124, 1028, 566, 1028), fill=BEIGE, width=2)
    d.multiline_text(
        (124, 1048),
        "Scan it. Sort it.\nKeep it searchable.",
        font=F["subtitle"], fill=MUTED, spacing=2,
    )

    # Exact digital folder labels are rendered here rather than left to the photo model.
    ui = Image.new("RGBA", (340, 224), (0, 0, 0, 0))
    ud = ImageDraw.Draw(ui)
    ud.rounded_rectangle((0, 0, 340, 224), radius=10, fill=(*CREAM, 172), outline=(*BEIGE, 145), width=2)
    ud.text((20, 14), "LEARNING ARCHIVE", font=F["label"], fill=INK)
    labels = ["Math", "Reading", "History", "Science", "Review"]
    for i, label in enumerate(labels):
        y = 49 + i * 32
        ud.rounded_rectangle((20, y, 37, y + 17), radius=3, fill=BEIGE)
        ud.text((52, y - 2), label, font=F["small"], fill=INK)
    im.alpha_composite(ui, (650, 105))

    return im.convert("RGB")


def slide_4():
    src = Image.open(ROOT / "assets" / "learning-system-digital-week-01.png").convert("RGB")
    scale = W / src.width
    src = src.resize((W, round(src.height * scale)), Image.Resampling.LANCZOS)
    top = max(0, (src.height - H) // 2)
    im = src.crop((0, top, W, top + H)).convert("RGBA")

    veil = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(veil)
    vd.rectangle((0, 0, W, H), fill=(*CREAM, 42))
    im = Image.alpha_composite(im, veil)
    d = ImageDraw.Draw(im)
    header(im, d, 4)

    panel = Image.new("RGBA", (530, 520), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((0, 0, 530, 520), radius=26, fill=(*CREAM, 158), outline=(*BEIGE, 135), width=3)
    im.alpha_composite(panel, (80, 660))
    d = ImageDraw.Draw(im)
    d.text((124, 732), "STEP 2", font=F["label"], fill=INK)
    d.multiline_text((124, 790), "LET AI FIND\nTHE PATTERNS.", font=F["title"], fill=INK, spacing=0)
    d.multiline_text(
        (124, 960),
        "One page shows a moment.\nSeveral pages reveal a pattern.",
        font=F["body"], fill=INK, spacing=8,
    )
    d.line((124, 1040, 566, 1040), fill=BEIGE, width=2)
    d.multiline_text(
        (124, 1060),
        "Track strengths, recurring mistakes,\nand question types to review.",
        font=F["subtitle"], fill=MUTED, spacing=4,
    )

    # A dashboard is composited into the laptop screen, not placed as a floating card.
    screen = Image.new("RGBA", (350, 215), (0, 0, 0, 0))
    sd = ImageDraw.Draw(screen)
    sd.rounded_rectangle((0, 0, 350, 215), radius=8, fill=(*CREAM, 220), outline=(*BEIGE, 150), width=2)
    sd.text((16, 12), "AI ANALYSIS", font=F["small"], fill=INK)
    sd.line((16, 42, 334, 42), fill=BEIGE, width=1)
    blocks = [("STRENGTHS", "3 areas", 68), ("REVIEW NEXT", "2 topics", 117), ("QUESTION TYPES", "4 patterns", 166)]
    for label, value, y in blocks:
        sd.rounded_rectangle((18, y, 176, y + 31), radius=6, fill=(*BEIGE, 115))
        sd.text((29, y + 8), label, font=font(AVENIR, 12, 5), fill=INK)
        sd.text((205, y + 7), value, font=font(AVENIR, 14, 5), fill=MUTED)
    im.alpha_composite(screen, (650, 105))
    return im.convert("RGB")


def slide_5():
    # Fill the entire carousel with the real weekly printable, enlarged 1.5x and cropped.
    page = Image.open(ROOT / "assets" / "weekly-math-printable-page-01.png").convert("RGBA")
    page = page.resize((round(page.width * 1.5), round(page.height * 1.5)), Image.Resampling.LANCZOS)
    im = page.crop((0, 0, W, H)).convert("RGBA")

    wash = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wash)
    wd.rectangle((0, 0, W, H), fill=(*CREAM, 28))
    im = Image.alpha_composite(im, wash)
    d = ImageDraw.Draw(im)
    header(im, d, 5)

    panel = Image.new("RGBA", (530, 520), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((0, 0, 530, 520), radius=26, fill=(255, 253, 248, 210), outline=(*BEIGE, 155), width=3)
    im.alpha_composite(panel, (80, 660))
    d = ImageDraw.Draw(im)
    d.text((124, 732), "STEP 3", font=F["label"], fill=INK)
    d.multiline_text((124, 790), "TURN PATTERNS\nINTO PRACTICE.", font=F["title"], fill=INK, spacing=0)
    d.multiline_text(
        (124, 960),
        "AI creates a focused set of\nquestions for the week ahead.",
        font=F["body"], fill=INK, spacing=8,
    )
    d.line((124, 1040, 566, 1040), fill=BEIGE, width=2)
    d.multiline_text(
        (124, 1060),
        "One week. One clear focus.\nLess guesswork.",
        font=F["subtitle"], fill=MUTED, spacing=4,
    )
    return im.convert("RGB")


def main():
    OUT.mkdir(exist_ok=True)
    slide_1().save(OUT / "01-cover-learning-system.png", quality=95)
    slide_2().save(OUT / "02-problem-learning-system.png", quality=95)
    slide_3().save(OUT / "03-save-evidence-learning-system.png", quality=95)
    slide_4().save(OUT / "04-analyze-patterns-learning-system.png", quality=95)
    slide_5().save(OUT / "05-personalize-practice-learning-system.png", quality=95)


if __name__ == "__main__":
    main()
