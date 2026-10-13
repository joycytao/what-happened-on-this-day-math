import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const PRODUCT_CONFIRMED_SCHEMA = "product-confirmed/v1";
export const PRODUCT_CONFIRMED_EVENT = "product.confirmed";
export const PRODUCT_REEL_TEMPLATE_ID = "reel-v1";
export const PRODUCT_CAROUSEL_TEMPLATE_ID = "carousel-v1";
export const APPROVAL_LABEL = "status: ready to dispatch";
export const STORY_LABELS = ["status: ready to pickup", "type: feature"];

const MONTHS = new Set([
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
]);
const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;

function add(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function requiredString(value, field, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    add(errors, `${field} is required`);
    return "";
  }
  return value.trim();
}

function isHttps(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function repoRelativePath(value, field, root, errors) {
  const relative = requiredString(value, field, errors);
  if (!relative) return "";
  if (path.isAbsolute(relative) || relative.split(path.sep).includes("..")) {
    add(errors, `${field} must be repository-relative`);
    return relative;
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) add(errors, `${field} escapes repository root`);
  if (!fs.existsSync(resolved)) add(errors, `${field} does not exist: ${relative}`);
  return relative;
}

function checksum(relative, root) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.resolve(root, relative))).digest("hex");
}

function validatePdf(pdf, root, errors) {
  if (!pdf || typeof pdf !== "object" || Array.isArray(pdf)) {
    add(errors, "pdf is required");
    return null;
  }
  const result = {
    path: repoRelativePath(pdf.path, "pdf.path", root, errors),
    sha256: requiredString(pdf.sha256, "pdf.sha256", errors),
    page_count: pdf.page_count
  };
  if (!SHA256.test(result.sha256)) add(errors, "pdf.sha256 must be a 64-character lowercase SHA-256");
  if (!Number.isInteger(result.page_count) || result.page_count < 1) add(errors, "pdf.page_count must be a positive integer");
  if (result.path && fs.existsSync(path.resolve(root, result.path)) && SHA256.test(result.sha256) && checksum(result.path, root) !== result.sha256) {
    add(errors, "pdf_checksum_mismatch");
  }
  return result;
}

export function validateProductConfirmedInput(input = {}, { root = process.cwd() } = {}) {
  const errors = [];
  if (input.schema_version !== PRODUCT_CONFIRMED_SCHEMA) add(errors, `schema_version must be ${PRODUCT_CONFIRMED_SCHEMA}`);
  if (input.event !== PRODUCT_CONFIRMED_EVENT) add(errors, `event must be ${PRODUCT_CONFIRMED_EVENT}`);
  const handoffId = requiredString(input.handoff_id, "handoff_id", errors);
  if (handoffId && !/^what-happened-on-this-day-math:[a-z0-9-]+:(reel|carousel)$/.test(handoffId)) add(errors, "handoff_id must identify one monthly reel or carousel handoff");
  const productId = requiredString(input.product_id, "product_id", errors);
  const month = requiredString(input.month, "month", errors);
  if (month && !MONTHS.has(month.toLowerCase())) add(errors, "month must be an English month name");
  const productTitle = requiredString(input.product_title, "product_title", errors);
  const tptUrl = requiredString(input.tpt_url, "tpt_url", errors);
  if (tptUrl && !isHttps(tptUrl)) add(errors, "tpt_url must be an https URL");
  const redirectUrl = requiredString(input.month_redirect_url, "month_redirect_url", errors);
  if (redirectUrl && !isHttps(redirectUrl)) add(errors, "month_redirect_url must be an https URL");
  const sourceRevision = requiredString(input.source_revision, "source_revision", errors);
  if (sourceRevision && !SHA1.test(sourceRevision)) add(errors, "source_revision must be a 40-character lowercase git SHA");
  const pdf = validatePdf(input.pdf, root, errors);
  const previewImagePath = repoRelativePath(input.preview_image_path, "preview_image_path", root, errors);
  if (!Array.isArray(input.worksheet_asset_paths) || input.worksheet_asset_paths.length !== 3) {
    add(errors, "worksheet_asset_paths must contain exactly three public worksheet assets");
  }
  const worksheetAssetPaths = Array.isArray(input.worksheet_asset_paths)
    ? input.worksheet_asset_paths.map((value, index) => repoRelativePath(value, `worksheet_asset_paths[${index}]`, root, errors))
    : [];
  if (!input.template || typeof input.template !== "object") add(errors, "template is required");
  const template = input.template ?? {};
  const expectedTemplate = handoffId.endsWith(":carousel") ? PRODUCT_CAROUSEL_TEMPLATE_ID : PRODUCT_REEL_TEMPLATE_ID;
  if (template.template_id !== expectedTemplate) add(errors, `template.template_id must be ${expectedTemplate}`);
  const templateVersion = requiredString(template.template_version, "template.template_version", errors);
  if (!input.approval || typeof input.approval !== "object") add(errors, "approval is required");
  const approval = input.approval ?? {};
  if (approval.label !== APPROVAL_LABEL) add(errors, "approval_label_missing");
  if (!Number.isInteger(approval.issue_number) || approval.issue_number < 1) add(errors, "approval.issue_number must be a positive integer");
  if (!productId || !productTitle || !pdf) return { valid: false, errors, payload: null };
  const payload = {
    schema_version: PRODUCT_CONFIRMED_SCHEMA,
    event: PRODUCT_CONFIRMED_EVENT,
    handoff_id: handoffId,
    product_id: productId,
    month,
    product_title: productTitle,
    tpt_url: tptUrl,
    month_redirect_url: redirectUrl,
    source_revision: sourceRevision,
    pdf,
    preview_image_path: previewImagePath,
    worksheet_asset_paths: worksheetAssetPaths,
    template: { template_id: template.template_id, template_version: templateVersion },
    approval: { label: approval.label, issue_number: approval.issue_number }
  };
  return { valid: errors.length === 0, errors, payload };
}

export function buildProductConfirmedStory(input, options = {}) {
  const validation = validateProductConfirmedInput(input, options);
  if (!validation.valid) return { ...validation, story: null };
  const payload = validation.payload;
  const isCarousel = payload.template.template_id === PRODUCT_CAROUSEL_TEMPLATE_ID;
  const workstream = isCarousel ? "Carousel" : "Product Reel";
  const templateId = payload.template.template_id;
  const marker = `<!-- product-handoff-id: ${payload.handoff_id} -->`;
  const story = [
    marker,
    `# ${workstream} handoff: ${payload.product_title}`,
    "",
    "This story was emitted from a validated `product.confirmed` release handoff.",
    "",
    "## Confirmed payload",
    "",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
    "",
    `## Fixed ${templateId} checklist`,
    "",
    `- [ ] Confirm the four weekly ${isCarousel ? "carousel" : "reel"} records use only the referenced public assets.`,
    isCarousel ? "- [ ] Confirm every carousel has 1080x1080 slides and is human-reviewed." : "- [ ] Confirm the rendered reel is 1080x1920, 30 fps, and human-reviewed.",
    "- [ ] Confirm answer keys and unsupported claims are not exposed.",
    `- [ ] Confirm the CTA uses ${payload.month_redirect_url} and ${payload.tpt_url} is the approved listing.`,
    "- [ ] Attach the rendered MP4/sidecar, QA report, branch, and PR before closure.",
    "",
    isCarousel
      ? "Production command: `npm run social:carousels -- --input <validated-input> --reels <validated-reel-output> --output output/social/carousels/<month>-carousels/workstream.json`"
      : "Production command: `npm run social:product-reels -- --input <validated-input> --output output/social/product-reels/<month>/workstream.json`",
    "Publication remains blocked until human QA is complete.",
  ].join("\n");
  return { ...validation, marker, labels: [...STORY_LABELS], story };
}

export function buildProductReelStory(input, options = {}) {
  return buildProductConfirmedStory(input, options);
}

export function buildProductCarouselStory(input, options = {}) {
  return buildProductConfirmedStory(input, options);
}

export function findProductReelStory(issues, handoffId) {
  const marker = `<!-- product-handoff-id: ${handoffId} -->`;
  return (issues ?? []).find((issue) => !issue.pull_request && String(issue.body ?? "").includes(marker)) ?? null;
}
