from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent
W, H = 1080, 1350
BG = "#F6F0E2"
INK = "#203245"
SOFT = "#D8C6B2"
WHITE = "#FFFDFC"
MUTED = "#6E6A63"

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf"
VERDANA = "/System/Library/Fonts/Supplemental/Verdana.ttf"


def font(path, size, index=0):
    return ImageFont.truetype(path, size=size, index=index)


F = {
    "display": font(AVENIR, 78, 2),
    "title": font(AVENIR, 54, 2),
    "subtitle": font(AVENIR, 30, 5),
    "label": font(VERDANA, 18, 0),
    "body": font(GEORGIA, 28, 0),
    "card_body": font(GEORGIA, 26, 0),
    "small": font(VERDANA, 20, 0),
    "button": font(AVENIR, 26, 2),
}


def rr(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def centered(draw, text, y, fnt, fill=INK):
    box = draw.textbbox((0, 0), text, font=fnt)
    draw.text(((W - (box[2] - box[0])) / 2, y), text, font=fnt, fill=fill)


def multiline(draw, xy, text, fnt, fill=INK, spacing=8, anchor=None):
    draw.multiline_text(xy, text, font=fnt, fill=fill, spacing=spacing, anchor=anchor)


def base(page):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((96, 66), "@engineermom.worksheets", font=F["label"], fill=MUTED)
    d.line((96, 104, 984, 104), fill=SOFT, width=2)
    d.text((900, 66), f"0{page}/05", font=F["label"], fill=MUTED)
    return im, d


def slide_1():
    im, d = base(1)
    d.text((96, 154), "SERIES / TOPIC", font=F["label"], fill=INK)
    multiline(d, (96, 210), "YOUR SHORT\nHOOK GOES HERE", F["display"], spacing=0)
    d.text((96, 404), "One sentence that tells the reader why this matters.", font=F["subtitle"], fill=MUTED)
    rr(d, (96, 520, 984, 950), 24, WHITE, SOFT, 3)
    d.rectangle((140, 564, 940, 906), outline=SOFT, width=3)
    d.text((360, 704), "PRIMARY VISUAL", font=F["title"], fill=SOFT)
    d.text((404, 774), "worksheet / product / photo", font=F["small"], fill=MUTED)
    d.line((96, 1030, 984, 1030), fill=SOFT, width=2)
    d.text((96, 1068), "SAVE THIS POST", font=F["label"], fill=INK)
    d.text((96, 1110), "A short supporting line or category label.", font=F["body"], fill=INK)
    return im


def slide_2():
    im, d = base(2)
    d.text((96, 154), "01  THE CONTEXT", font=F["label"], fill=INK)
    multiline(d, (96, 210), "THE MATERIAL IS GOOD.\nTHE PAGE NEEDS A FRESH START.", F["title"], spacing=0)
    rr(d, (96, 390, 984, 790), 22, WHITE, SOFT, 3)
    d.text((140, 440), "WHEN THE PAGE IS ALREADY USED", font=F["label"], fill=MUTED)
    multiline(d, (140, 500), "The questions are still useful.\nBut answers, marks, and notes can make\nthe worksheet harder to reuse.", F["card_body"], spacing=8)
    d.line((140, 680, 940, 680), fill=SOFT, width=2)
    d.text((140, 720), "THE CLEAN WORKSHEET GOAL", font=F["subtitle"], fill=INK)
    centered(d, "Clear the page. Keep the practice.", 945, F["body"], fill=INK)
    return im


def slide_3():
    im, d = base(3)
    d.text((96, 154), "02  THE PROMPT", font=F["label"], fill=INK)
    multiline(d, (96, 210), "ONE PROMPT.\nTHREE SIMPLE STEPS.", F["title"], spacing=0)
    cards = [
        ("01", "PRESERVE", "Keep the original\nlayout and\nquestions."),
        ("02", "CLEAN", "Remove answers,\nhandwriting, marks,\nand smudges."),
        ("03", "REUSE", "Create a fresh\nprintable for\nreview."),
    ]
    xs = [96, 416, 736]
    for x, (number, label, body) in zip(xs, cards):
        rr(d, (x, 400, x + 248, 850), 20, WHITE, SOFT, 3)
        d.text((x + 28, 438), number, font=F["title"], fill=SOFT)
        d.line((x + 28, 520, x + 220, 520), fill=SOFT, width=2)
        d.text((x + 28, 564), label, font=F["subtitle"], fill=INK)
        multiline(d, (x + 28, 630), body, F["small"], fill=MUTED, spacing=10)
    centered(d, "Keep the structure. Clear the page. Use it again.", 980, F["body"])
    return im


def slide_4():
    im, d = base(4)
    d.text((96, 154), "03  THE DETAIL", font=F["label"], fill=INK)
    multiline(d, (96, 210), "MAKE THE\nMETHOD VISIBLE", F["title"], spacing=0)
    rr(d, (96, 390, 984, 1010), 22, WHITE, SOFT, 3)
    d.rectangle((164, 462, 916, 900), outline=SOFT, width=3)
    d.text((344, 652), "DETAIL / EXAMPLE", font=F["title"], fill=SOFT)
    d.text((356, 724), "insert a worksheet, diagram,", font=F["small"], fill=MUTED)
    d.text((398, 754), "screenshot, or proof point", font=F["small"], fill=MUTED)
    d.text((96, 1080), "Use one visual anchor per slide.", font=F["body"], fill=INK)
    d.text((96, 1132), "Keep annotations small and aligned to the same grid.", font=F["small"], fill=MUTED)
    return im


def slide_5():
    im, d = base(5)
    rr(d, (390, 170, 690, 470), 150, SOFT, SOFT, 0)
    d.ellipse((420, 200, 660, 440), fill=BG, outline=INK, width=4)
    centered(d, "PORTRAIT", 292, F["label"], fill=INK)
    centered(d, "@engineermom.worksheets", 520, F["label"], fill=MUTED)
    centered(d, "FOLLOW FOR MORE", 590, F["title"], fill=INK)
    centered(d, "A short promise about what people will get.", 700, F["body"], fill=INK)
    rr(d, (330, 820, 750, 906), 43, INK, INK, 0)
    centered(d, "SAVE • SHARE • FOLLOW", 846, F["button"], fill=BG)
    centered(d, "CTA can be changed per post, but keep this position fixed.", 1010, F["small"], fill=MUTED)
    d.line((96, 1160, 984, 1160), fill=SOFT, width=2)
    centered(d, "YOUR BRAND LINE / WEBSITE / HANDLE", 1195, F["label"], fill=INK)
    return im


def main():
    pages = [slide_1(), slide_2(), slide_3(), slide_4(), slide_5()]
    for i, im in enumerate(pages, 1):
        im.save(OUT / f"slide-{i}.png")
    pages[0].save(OUT / "ig-carousel-template.pdf", save_all=True, append_images=pages[1:], resolution=144)
    contact = Image.new("RGB", (W, int(H * 1.5)), BG)
    for i, im in enumerate(pages):
        contact.paste(im.resize((W // 2, H // 2)), ((i % 2) * (W // 2), (i // 2) * (H // 2)))
    contact.save(OUT / "ig-carousel-template-preview.png")


if __name__ == "__main__":
    main()
