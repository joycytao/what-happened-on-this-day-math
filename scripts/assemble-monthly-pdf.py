#!/usr/bin/env python3
"""Assemble month/day SVG pages and Answer Keys in deterministic order."""

import argparse
import json
import re
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas
from svglib.svglib import svg2rlg

DAILY_TYPES = ("reading-passage", "level1", "level2", "level3")
SVG_SIZE = re.compile(r'<svg\b[^>]*\bwidth="([0-9.]+)"[^>]*\bheight="([0-9.]+)"')

def svg_size(path):
    match = SVG_SIZE.search(path.read_text(encoding="utf-8"))
    if not match:
        raise ValueError(f"{path}: missing SVG width/height")
    return int(float(match.group(1))), int(float(match.group(2)))

def day_count(month):
    if month == 2:
        return 28
    return 31 if month in (1, 3, 5, 7, 8, 10, 12) else 30

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--month", type=int, required=True)
    parser.add_argument("--worksheet-dir", type=Path, required=True)
    parser.add_argument("--answer-key-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--content-report", type=Path, required=True)
    args = parser.parse_args()
    paths = [args.worksheet_dir / f"{day:02d}-{page_type}.svg" for day in range(1, day_count(args.month) + 1) for page_type in DAILY_TYPES]
    paths.extend(args.answer_key_dir / f"answer-key-{page:02d}.svg" for page in range(1, 4))
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise ValueError(f"missing {len(missing)} expected SVG pages: {missing[:3]}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(args.output), pagesize=(1545, 2000), pageCompression=1, invariant=1)
    pdf.setTitle(f"What Happened on This Day - Month {args.month} Worksheet Packet")
    pdf.setAuthor("6pm studio")
    dimensions = []
    for path in paths:
        width, height = svg_size(path)
        drawing = svg2rlg(str(path))
        if drawing is None:
            raise ValueError(f"{path}: SVG did not parse")
        expected_points = (width * 0.75, height * 0.75)
        if abs(drawing.width - expected_points[0]) > 0.01 or abs(drawing.height - expected_points[1]) > 0.01:
            raise ValueError(f"{path}: parsed size differs from SVG CSS size")
        pdf.setPageSize((drawing.width, drawing.height))
        renderPDF.draw(drawing, pdf, 0, 0)
        pdf.showPage()
        dimensions.append({"width": width, "height": height})
    pdf.save()
    content_report = json.loads(args.content_report.read_text(encoding="utf-8"))
    expected = day_count(args.month) * 4 + 3
    report = {"valid": len(paths) == expected, "month": args.month, "expectedPageCount": expected, "actualPageCount": len(paths), "validation": {"content": content_report.get("content", {}).get("valid", False), "mathematics": content_report.get("mathematics", {}).get("valid", False), "source": content_report.get("sources", {}).get("valid", False), "layout": True}, "pageDimensions": {"histogram": histogram(dimensions)}, "output": str(args.output)}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if not report["valid"]:
        raise ValueError("assembled page count does not match the month contract")

def histogram(dimensions):
    counts = {}
    for item in dimensions:
        key = f"{item['width']}x{item['height']}"
        counts[key] = counts.get(key, 0) + 1
    return counts

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"valid": False, "error": str(error)}))
        raise SystemExit(1)
