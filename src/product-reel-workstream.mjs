const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const REQUIRED_ASSETS = ["cover", "preview", "readingPassage", "level1", "level2", "level3"];
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const WEEK_PLANS = [
  {
    week: 1,
    hook: "I think I just discovered a simple way to make monthly math practice feel doable.",
    overlay: ["A full month of story-based math practice", "Reading passage + Level 1 + Level 2 + Level 3", "[PRODUCT_NAME]", "See the full package on TPT"],
    scenes: [
      ["cover", "full", "Open with the monthly product cover."],
      ["preview", "controlled-crop", "Move through the product preview."],
      ["readingPassage", "crop", "Show a reading-passage crop."],
      ["level1", "crop"], ["level2", "crop"], ["level3", "crop"],
      ["cover", "full", "End on the cover and monthly CTA."]
    ],
    captionDirection: "Keep the caption focused on what is included rather than making a broad learning claim."
  },
  {
    week: 2,
    hook: "What no one tells you about math practice: one topic can need different levels of support.",
    overlay: ["Same monthly theme", "Three levels of math practice", "Choose the page that fits the learner", "Explore [PRODUCT_NAME]"],
    scenes: [["level1", "crop"], ["level2", "crop"], ["level3", "crop"], ["cover", "full", "Return to the monthly cover and CTA."]],
    captionDirection: "Describe the three-level structure without claiming that one level is universally correct for a child."
  },
  {
    week: 3,
    hook: "I used to believe reading and math had to be practiced separately—until I saw how one monthly topic can connect them.",
    overlay: ["Start with the reading passage", "Notice the numbers and details", "Move into differentiated math practice", "[PRODUCT_NAME]"],
    scenes: [["readingPassage", "crop"], ["readingPassage", "detail-zoom", "Use a controlled zoom on a relevant detail or number."], ["level1", "crop"], ["level2", "crop"], ["level3", "crop"], ["cover", "full", "End with the cover and CTA."]],
    captionDirection: "Explain the sequence from reading passage to math task without implying that every page is shown."
  },
  {
    week: 4,
    hook: "If you are looking for a ready-to-use monthly math routine, this is for you.",
    overlay: ["Choose a day", "Read the short passage", "Complete the math page that fits", "Repeat throughout the month", "Explore [PRODUCT_NAME]"],
    scenes: [["cover", "full", "Show the cover as the starting point."], ["readingPassage", "crop"], ["level2", "crop"], ["preview", "collage", "Show a small collage without inventing a classroom or family scene."], ["cover", "full", "End on the monthly CTA."]],
    captionDirection: "Position the product as a ready-to-use resource for a routine without claiming every family or classroom uses it the same way."
  }
];

function pushError(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function isUrl(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function normalizeMonth(value) {
  const match = MONTHS.find((month) => month.toLowerCase() === String(value ?? "").trim().toLowerCase());
  return match ?? "";
}

function validateSourceRelease(input, errors) {
  const release = input.release;
  if (release === undefined) return null;
  if (!release || typeof release !== "object" || Array.isArray(release)) {
    pushError(errors, "release must be an object when provided");
    return null;
  }
  for (const field of ["manifestPath", "packageId", "packageVersion", "sourceCommit"]) {
    if (typeof release[field] !== "string" || release[field].trim() === "") pushError(errors, `release.${field} is required`);
  }
  if (release.releaseReady !== true && release.sourceGateWaived !== true) {
    pushError(errors, "release must be release-ready unless the source-gate waiver is recorded");
  }
  if (release.stale !== false) pushError(errors, "release manifest must be explicitly non-stale");
  if (!release.gates || typeof release.gates !== "object" || Array.isArray(release.gates)) {
    pushError(errors, "release.gates is required");
  } else {
    for (const gate of ["content", "mathematics", "layout", "pdf", "cover", "derivedAssets"]) {
      if (release.gates[gate] !== true) pushError(errors, `release gate must pass: ${gate}`);
    }
    if (release.gates.source !== true) {
      if (release.sourceGateWaived !== true) pushError(errors, "release source gate is false and no owner waiver is recorded");
      if (typeof release.waiverReason !== "string" || release.waiverReason.trim() === "") pushError(errors, "release.waiverReason is required for a source-gate waiver");
    }
  }
  if (!release.artifactChecksums || typeof release.artifactChecksums !== "object" || Array.isArray(release.artifactChecksums)) {
    pushError(errors, "release.artifactChecksums is required");
  } else {
    for (const asset of REQUIRED_ASSETS) {
      if (!SHA256_PATTERN.test(String(release.artifactChecksums[asset] ?? ""))) pushError(errors, `release artifact checksum is invalid: ${asset}`);
    }
  }
  return release;
}

export function validateProductReelInput(input = {}) {
  const errors = [];
  const month = normalizeMonth(input.month);
  if (!month) pushError(errors, "month must be an English month name");
  const productName = String(input.productName ?? "").trim();
  if (!productName) pushError(errors, "productName is required");
  if (!productName.toLowerCase().includes(month.toLowerCase())) pushError(errors, "productName must identify the requested month");
  const redirectUrl = String(input.redirectUrl ?? "").trim();
  if (!isUrl(redirectUrl)) pushError(errors, "redirectUrl must be an https URL");
  if (month && !redirectUrl.toLowerCase().includes(month.toLowerCase())) pushError(errors, "redirectUrl must identify the requested month");
  const productUrl = String(input.productUrl ?? "").trim();
  if (!isUrl(productUrl)) pushError(errors, "productUrl must be an https URL");
  if (!Number.isInteger(input.numberOfDays) || input.numberOfDays < 1 || input.numberOfDays > 31) pushError(errors, "numberOfDays must be an integer from 1 to 31");
  if (!Array.isArray(input.packageFeatures) || input.packageFeatures.length === 0) pushError(errors, "packageFeatures must contain at least one verified feature");
  const assets = input.assets ?? {};
  for (const key of REQUIRED_ASSETS) if (typeof assets[key] !== "string" || assets[key].trim() === "") pushError(errors, `missing product evidence asset: ${key}`);
  if (typeof assets.answerKey === "string" && assets.answerKey.trim() !== "") pushError(errors, "answer-key assets are not permitted in Product Reels");
  const release = validateSourceRelease(input, errors);
  return {
    valid: errors.length === 0,
    errors,
    normalized: { ...input, month, productName, redirectUrl, productUrl, assets: { ...assets }, release }
  };
}

export function buildProductReelWorkstream(input = {}) {
  const validation = validateProductReelInput(input);
  if (!validation.valid) return { valid: false, errors: validation.errors, records: [] };
  const normalized = validation.normalized;
  const records = WEEK_PLANS.map((plan) => ({
    schemaVersion: "1.0.0",
    id: `${normalized.month.toLowerCase()}-week-${plan.week}`,
    month: normalized.month,
    productName: normalized.productName,
    productUrl: normalized.productUrl,
    canvas: "1080x1920",
    fps: 30,
    durationSeconds: 10,
    audio: "silent-by-default",
    hook: plan.hook,
    overlay: plan.overlay.map((line) => line.replaceAll("[PRODUCT_NAME]", normalized.productName)),
    evidenceAssets: [...new Set(plan.scenes.map(([asset]) => normalized.assets[asset]))],
    scenes: plan.scenes.map(([asset, treatment, note = ""]) => ({ asset: normalized.assets[asset], treatment, note })),
    cta: { text: `Find ${normalized.productName} on TPT`, redirectUrl: normalized.redirectUrl },
    captionDirection: plan.captionDirection,
    claimPolicy: {
      sourceAssetsOnly: true,
      noTestimonials: true,
      noUnsupportedOutcomes: true,
      noAnswerKeyExposure: true
    },
    qa: {
      humanReviewRequired: true,
      answerKeyExposed: false,
      publicDisplayStatus: "review",
      missingAssets: [],
      monthMatch: true,
      redirectMatch: true
    }
  }));
  return {
    valid: true,
    errors: [],
    schemaVersion: "1.0.0",
    campaignId: `${normalized.month.toLowerCase()}-product-reels`,
    month: normalized.month,
    productName: normalized.productName,
    redirectUrl: normalized.redirectUrl,
    numberOfDays: normalized.numberOfDays,
    packageFeatures: [...normalized.packageFeatures],
    ...(normalized.release ? { sourceRelease: structuredClone(normalized.release) } : {}),
    ...(normalized.pairedWorkstream ? { pairedWorkstream: structuredClone(normalized.pairedWorkstream) } : {}),
    records
  };
}

export { MONTHS, REQUIRED_ASSETS, WEEK_PLANS };
