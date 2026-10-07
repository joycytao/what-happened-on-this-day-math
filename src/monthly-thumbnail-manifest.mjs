import { readFile } from "node:fs/promises";
import { PAGE_TEMPLATE_NAMES, REQUIRED_SOURCE_LABELS, validateThumbnailSourceMapping } from "./thumbnail-source-mapping.mjs";

const TEMPLATE_NAMES = ["cover", ...PAGE_TEMPLATE_NAMES];

export async function loadMonthlyThumbnailManifest(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function validateMonthlyThumbnailManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { valid: false, errors: ["manifest must be an object"] };
  }

  const required = (value, path) => {
    if (value === undefined || value === null || value === "") errors.push(`${path} is required`);
  };
  required(manifest.pdf, "pdf");
  required(manifest.templates, "templates");

  if (manifest.pdf) {
    required(manifest.pdf.path, "pdf.path");
    required(manifest.pdf.sha256, "pdf.sha256");
    required(manifest.pdf.page_count, "pdf.page_count");
    if (typeof manifest.pdf.page_count !== "number" || !Number.isInteger(manifest.pdf.page_count) || manifest.pdf.page_count < 1) {
      errors.push("pdf.page_count must be a positive integer");
    }
    if (typeof manifest.pdf.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(manifest.pdf.sha256)) {
      errors.push("pdf.sha256 must be a 64-character lowercase hexadecimal checksum");
    }
  }
  const templates = manifest.templates ?? {};
  for (const name of TEMPLATE_NAMES) {
    const template = templates[name];
    required(template, `templates.${name}`);
    if (!template) continue;
    required(template.output, `templates.${name}.output`);
    if (PAGE_TEMPLATE_NAMES.includes(name)) {
      required(template.source_pages, `templates.${name}.source_pages`);
      if (!template.source_pages || typeof template.source_pages !== "object") continue;
      for (const label of REQUIRED_SOURCE_LABELS[name]) {
        required(template.source_pages[label], `templates.${name}.source_pages.${label}`);
      }
    }
  }

  errors.push(...validateThumbnailSourceMapping(manifest));

  return { valid: errors.length === 0, errors };
}
