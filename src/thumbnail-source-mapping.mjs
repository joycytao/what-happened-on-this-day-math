export const PAGE_TEMPLATE_NAMES = ["whats_included", "different_math", "daily_practice", "landing_page"];

export const REQUIRED_SOURCE_LABELS = {
  whats_included: ["story", "level1", "level2", "level3", "answer_key"],
  different_math: ["story", "level1", "level2", "level3"],
  daily_practice: ["worksheet"],
  landing_page: ["reading_passage", "level1", "level2", "level3", "answer_key"],
};

export function validateThumbnailSourceMapping(manifest) {
  const errors = [];
  const templates = manifest?.templates ?? {};
  const pageCount = manifest?.pdf?.page_count;

  for (const name of PAGE_TEMPLATE_NAMES) {
    const sourcePages = templates[name]?.source_pages;
    if (!sourcePages || typeof sourcePages !== "object" || Array.isArray(sourcePages)) continue;

    for (const label of REQUIRED_SOURCE_LABELS[name]) {
      if (sourcePages[label] === undefined || sourcePages[label] === null || sourcePages[label] === "") {
        errors.push(`templates.${name}.source_pages.${label} is required`);
        continue;
      }
      const page = sourcePages[label];
      if (!Number.isInteger(page) || page < 1) {
        errors.push(`templates.${name}.source_pages.${label} must be a positive integer page number`);
      } else if (Number.isInteger(pageCount) && page > pageCount) {
        errors.push(`templates.${name}.source_pages.${label} requests page ${page}, but pdf.page_count is ${pageCount}`);
      }
    }

    for (const [label, page] of Object.entries(sourcePages)) {
      if (!REQUIRED_SOURCE_LABELS[name].includes(label)) {
        errors.push(`templates.${name}.source_pages.${label} is not an allowed source label`);
      }
    }
  }

  return errors;
}

export function resolveThumbnailSourcePages(manifest, templateName) {
  const sourcePages = manifest?.templates?.[templateName]?.source_pages;
  if (!PAGE_TEMPLATE_NAMES.includes(templateName)) {
    throw new Error(`template ${templateName} does not use source-page mappings`);
  }
  const errors = validateThumbnailSourceMapping(manifest);
  if (errors.length > 0) throw new Error(errors.join("; "));
  for (const label of REQUIRED_SOURCE_LABELS[templateName]) {
    if (!Number.isInteger(sourcePages?.[label])) {
      throw new Error(`templates.${templateName}.source_pages.${label} is required`);
    }
  }
  return { ...sourcePages };
}
