#!/usr/bin/env python3
"""Generate one deterministic monthly cover from the canonical compositor."""

import argparse
import datetime
import hashlib
import json
from pathlib import Path

from generate_monthly_thumbnails import compose_cover, SIZE


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--content", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    content = json.loads(args.content.read_text(encoding="utf-8"))
    month = content["month"]
    month_name = datetime.date.fromisoformat(f"{month}-01").strftime("%B").upper()
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"{month}-cover.png"
    compose_cover(month_name, len(content["days"]), output, None)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    report = {
        "schemaVersion": "monthly-cover/v1",
        "month": month,
        "output": str(output.resolve()),
        "dimensions": {"width": SIZE, "height": SIZE},
        "copy": [month_name, "MORNING WORK MATH", "31 DAILY WORD PROBLEMS", "3 LEVELS"],
        "palette": {"background": "#FEFFEF", "ink": "#2B313F", "accent": "#FF8A00"},
        "sha256": digest,
        "deterministic": True,
    }
    (output_dir / "monthly-cover-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
