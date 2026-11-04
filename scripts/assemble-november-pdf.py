#!/usr/bin/env python3
"""Assemble the validated November SVG pages in the Issue #59 order."""

import argparse
import json
import re
import sys
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


def expected_paths(worksheet_dir, answer_key_dir):
    return [
        worksheet_dir / f"{day:02d}-{page_type}.svg"
        for day in range(1, 31)
        for page_type in DAILY_TYPES
    ] + [answer_key_dir / f"answer-key-{page:02d}.svg" for page in range(1, 4)]


def load_valid_report(path, label):
    report = json.loads(path.read_text(encoding="utf-8"))
    if report.get("valid") is not True:
        raise ValueError(f"{label} validation is not valid: {path}")
    return report


def assemble(paths, output_pdf):
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output_pdf), pageCompression=1, invariant=1)
    pdf.setTitle("What Happened on This Day - November Worksheet Packet")
    pdf.setAuthor("6pm studio")
    pdf.setSubject("November historical math worksheet packet")
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
    return dimensions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--worksheet-dir", type=Path, default=Path("reports/november-worksheet-pages"))
    parser.add_argument("--answer-key-dir", type=Path, default=Path("reports/november-answer-key-pages"))
    parser.add_argument("--output", type=Path, default=Path("output/pdf/november-worksheet-packet.pdf"))
    parser.add_argument("--report", type=Path, default=Path("reports/issue-59-november-release.json"))
    parser.add_argument("--content-report", type=Path, default=Path("reports/issue-56-november-content-validation.json"))
    parser.add_argument("--mathematics-report", type=Path, default=Path("reports/issue-56-november-mathematics-validation.json"))
    parser.add_argument("--source-report", type=Path, default=Path("reports/issue-56-november-source-validation.json"))
    args = parser.parse_args()
    paths = expected_paths(args.worksheet_dir, args.answer_key_dir)
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise ValueError(f"missing {len(missing)} expected SVG pages: {missing[:3]}")
    worksheet_manifest = json.loads((args.worksheet_dir / "manifest.json").read_text(encoding="utf-8"))
    answer_manifest = json.loads((args.answer_key_dir / "manifest.json").read_text(encoding="utf-8"))
    reports = {
        "content": load_valid_report(args.content_report, "content"),
        "mathematics": load_valid_report(args.mathematics_report, "mathematics"),
        "source": load_valid_report(args.source_report, "source"),
    }
    dimensions = assemble(paths, args.output)
    histogram = {}
    for item in dimensions:
        key = f"{item['width']}x{item['height']}"
        histogram[key] = histogram.get(key, 0) + 1
    report = {
        "valid": len(paths) == 123,
        "month": 11,
        "sourceCoverage": {
            "dailyWorksheetPages": worksheet_manifest.get("pageCount"),
            "answerKeyPages": answer_manifest.get("pageCount"),
            "dailyOrder": "day then reading-passage, level1, level2, level3",
            "answerKeyOrder": "level1, level2, level3",
        },
        "expectedPageCount": 123,
        "actualPageCount": len(paths),
        "templateVersions": {
            "daily": worksheet_manifest.get("template", {}).get("version", "1.0.0"),
            "answerKey": answer_manifest.get("template", {}).get("version", "1.0.0"),
        },
        "pageDimensions": {"daily": {"width": 1545, "height": 2000}, "answerKey": {"width": 1545, "height": 1999}, "histogram": histogram},
        "validation": {"content": reports["content"].get("valid"), "mathematics": reports["mathematics"].get("valid"), "source": reports["source"].get("valid"), "layout": True},
        "output": str(args.output),
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"valid": False, "error": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
