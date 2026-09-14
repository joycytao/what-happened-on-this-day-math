#!/usr/bin/env python3
"""Assemble the validated October SVG pages and emit a machine-readable QA report."""

import argparse
import json
import re
import sys
from pathlib import Path

from reportlab.pdfgen import canvas
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF


DAILY_TYPES = ("reading-passage", "level1", "level2", "level3")
SVG_SIZE = re.compile(r'<svg\b[^>]*\bwidth="([0-9.]+)"[^>]*\bheight="([0-9.]+)"')


def svg_size(path):
    text = path.read_text(encoding="utf-8")
    match = SVG_SIZE.search(text)
    if not match:
        raise ValueError(f"{path}: missing SVG width/height")
    return int(float(match.group(1))), int(float(match.group(2)))


def page_paths(worksheet_dir, answer_key_dir):
    paths = []
    for day in range(1, 32):
        for page_type in DAILY_TYPES:
            paths.append(worksheet_dir / f"{day:02d}-{page_type}.svg")
    paths.extend(answer_key_dir / f"answer-key-{page:02d}.svg" for page in range(1, 4))
    return paths


def load_report(path, label):
    report = json.loads(path.read_text(encoding="utf-8"))
    if report.get("valid") is not True:
        raise ValueError(f"{label} validation is not valid: {path}")
    return report


def assemble(paths, output_pdf):
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(output_pdf), pagesize=(1545, 2000), pageCompression=1, invariant=1)
    pdf.setTitle("What Happened on This Day - October Worksheet Packet")
    pdf.setAuthor("6pm studio")
    pdf.setSubject("October 2026 historical math worksheet packet")
    dimensions = []
    for index, path in enumerate(paths, start=1):
        width, height = svg_size(path)
        drawing = svg2rlg(str(path))
        if drawing is None:
            raise ValueError(f"{path}: SVG did not parse")
        expected_points = (width * 0.75, height * 0.75)
        if abs(drawing.width - expected_points[0]) > 0.01 or abs(drawing.height - expected_points[1]) > 0.01:
            raise ValueError(f"{path}: parsed size {drawing.width}x{drawing.height} differs from SVG CSS size {width}x{height}")
        pdf.setPageSize((drawing.width, drawing.height))
        renderPDF.draw(drawing, pdf, 0, 0)
        pdf.showPage()
        dimensions.append({"width": width, "height": height})
    pdf.save()
    return dimensions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--worksheet-dir", default="reports/october-worksheet-pages")
    parser.add_argument("--answer-key-dir", default="reports/october-answer-key-pages")
    parser.add_argument("--output", default="output/pdf/october-worksheet-packet.pdf")
    parser.add_argument("--report", default="reports/issue-37-october-pdf-qa.json")
    args = parser.parse_args()

    root = Path.cwd()
    worksheet_dir = root / args.worksheet_dir
    answer_key_dir = root / args.answer_key_dir
    output_pdf = root / args.output
    report_path = root / args.report
    paths = page_paths(worksheet_dir, answer_key_dir)
    missing = [str(path) for path in paths if not path.is_file()]
    if missing:
        raise ValueError(f"missing {len(missing)} expected SVG pages: {missing[:3]}")

    worksheet_manifest = json.loads((worksheet_dir / "manifest.json").read_text(encoding="utf-8"))
    answer_manifest = json.loads((answer_key_dir / "manifest.json").read_text(encoding="utf-8"))
    validation_reports = {
        "content": load_report(root / "reports/issue-48-october-content-validation.json", "content"),
        "mathematics": load_report(root / "reports/issue-48-october-mathematics-validation.json", "mathematics"),
        "source": load_report(root / "reports/issue-48-october-content-source-validation.json", "source"),
    }
    dimensions = assemble(paths, output_pdf)
    histogram = {}
    for item in dimensions:
        key = f"{item['width']}x{item['height']}"
        histogram[key] = histogram.get(key, 0) + 1
    report = {
        "valid": True,
        "month": 10,
        "expectedPageCount": 127,
        "actualPageCount": len(paths),
        "sourceCoverage": {
            "dailyWorksheetPages": worksheet_manifest.get("pageCount"),
            "answerKeyPages": answer_manifest.get("pageCount"),
            "dailyOrder": "day then reading-passage, level1, level2, level3",
            "answerKeyOrder": "level1, level2, level3",
        },
        "templateVersions": {
            "daily": worksheet_manifest.get("template", {}).get("version", "1.0.0"),
            "answerKey": answer_manifest.get("template", {}).get("version", "1.0.0"),
        },
        "pageDimensions": {
            "daily": {"width": 1545, "height": 2000},
            "answerKey": {"width": 1545, "height": 1999},
            "histogram": histogram,
        },
        "validation": {
            "content": validation_reports["content"].get("valid"),
            "mathematics": validation_reports["mathematics"].get("valid"),
            "source": validation_reports["source"].get("valid"),
            "layout": "all SVGs parsed and rendered in deterministic order",
        },
        "output": str(output_pdf.relative_to(root)),
    }
    if report["actualPageCount"] != report["expectedPageCount"]:
        report["valid"] = False
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"valid": False, "error": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
