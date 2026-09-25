#!/usr/bin/env python3
"""Render exactly the unique PDF pages referenced by a monthly thumbnail manifest."""

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path


def load_manifest(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_path(value: str, manifest_path: Path) -> Path:
    candidate = Path(value)
    if candidate.is_absolute():
        return candidate
    from_cwd = (Path.cwd() / candidate).resolve()
    if from_cwd.exists():
        return from_cwd
    return (manifest_path.parent / candidate).resolve()


def source_pages(manifest: dict) -> dict[int, list[str]]:
    pages: dict[int, list[str]] = {}
    for template_name, template in manifest["templates"].items():
        for label, page in template.get("source_pages", {}).items():
            pages.setdefault(page, []).append(f"{template_name}.{label}")
    return pages


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    manifest_path = args.manifest.resolve()
    manifest = load_manifest(manifest_path)
    pdf = resolve_path(manifest["pdf"]["path"], manifest_path)
    if not pdf.exists():
        raise FileNotFoundError(f"manifest PDF does not exist: {pdf}")

    page_map = source_pages(manifest)
    page_count = manifest["pdf"]["page_count"]
    invalid = [page for page in page_map if page < 1 or page > page_count]
    if invalid:
        raise ValueError(f"manifest source pages outside 1..{page_count}: {sorted(invalid)}")

    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise RuntimeError("pdftoppm is required to render monthly thumbnail source pages")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    rendered = []
    for page in sorted(page_map):
        output_base = args.output_dir / f"page-{page:03d}"
        command = [pdftoppm, "-f", str(page), "-l", str(page), "-png", "-singlefile", str(pdf), str(output_base)]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or f"pdftoppm failed for page {page}")
        rendered_path = output_base.with_suffix(".png")
        if not rendered_path.exists():
            raise RuntimeError(f"pdftoppm did not produce {rendered_path}")
        rendered.append({"page": page, "types": sorted(page_map[page]), "path": str(rendered_path)})

    checksum = hashlib.sha256(pdf.read_bytes()).hexdigest()
    report = {
        "pdf": {"path": str(pdf), "expected_sha256": manifest["pdf"]["sha256"], "actual_sha256": checksum},
        "pages": rendered,
    }
    (args.output_dir / "source-pages.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
