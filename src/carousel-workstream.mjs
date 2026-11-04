const WEEKS = [1, 2, 3, 4];
const REQUIRED_ASSETS = ["cover", "preview", "readingPassage", "level1", "level2", "level3"];

const PLAN_TEMPLATES = [
  { title: "What is inside [PRODUCT_NAME]?", slides: [
    ["Title", "What is inside [PRODUCT_NAME]?", "cover"],
    ["Context", "A monthly package built around story-based math practice.", "preview"],
    ["Evidence", "Start with the reading passage, then move into math practice.", "readingPassage"],
    ["Evidence", "Choose from the three visible levels of math practice.", "level1"],
    ["Recap", "Use the preview to see how the package is organized.", "preview"],
    ["CTA", "Explore [PRODUCT_NAME] on TPT.", "cover"]
  ]},
  { title: "How the three levels of [PRODUCT_NAME] are different", slides: [
    ["Title", "How the three levels are different", "cover"],
    ["Context", "One monthly package, three ways into the math.", "preview"],
    ["Evidence", "Level 1: inspect the task shown in the package.", "level1"],
    ["Evidence", "Level 2: inspect the task shown in the package.", "level2"],
    ["Evidence", "Level 3: inspect the task shown in the package.", "level3"],
    ["Interpretation", "Compare the visible wording and task structure in the preview.", "preview"],
    ["CTA", "See all three levels in [PRODUCT_NAME] on TPT.", "cover"]
  ]},
  { title: "How reading and math connect in one monthly package", slides: [
    ["Title", "How reading and math connect in one monthly package", "readingPassage"],
    ["Context", "Start with the reading passage.", "readingPassage"],
    ["Evidence", "Notice the details and numbers in the passage.", "readingPassage"],
    ["Evidence", "Move into the related math practice.", "level1"],
    ["Interpretation", "Compare the three level options shown in the package.", "level2"],
    ["Recap", "A connected routine can make the materials easier to navigate.", "preview"],
    ["CTA", "Explore [PRODUCT_NAME] on TPT.", "cover"]
  ]},
  { title: "A simple way to use [PRODUCT_NAME] throughout the month", slides: [
    ["Title", "A simple way to use [PRODUCT_NAME] throughout the month", "cover"],
    ["Context", "Choose the day's reading passage.", "readingPassage"],
    ["Use case", "Select the math level that fits the learner and context.", "level2"],
    ["Use case", "Use the page for morning work, homeschool practice, or extra practice when appropriate.", "preview"],
    ["Recap", "Repeat the routine with the next available page.", "cover"],
    ["CTA", "Find [PRODUCT_NAME] on TPT.", "cover"]
  ]}
];

function error(errors, message) { if (!errors.includes(message)) errors.push(message); }

function isHttps(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validateCarouselInput(input = {}) {
  const errors = [];
  const month = String(input.month ?? "").trim();
  const productName = String(input.productName ?? "").trim();
  const redirectUrl = String(input.redirectUrl ?? "").trim();
  if (!month) error(errors, "month is required");
  if (!productName || !productName.toLowerCase().includes(month.toLowerCase())) error(errors, "productName must identify the requested month");
  if (!isHttps(redirectUrl) || !redirectUrl.toLowerCase().includes(month.toLowerCase())) error(errors, "redirectUrl must be an https URL for the requested month");
  const assets = input.assets ?? {};
  for (const name of REQUIRED_ASSETS) if (typeof assets[name] !== "string" || !assets[name].trim()) error(errors, `missing product evidence asset: ${name}`);
  const reels = Array.isArray(input.productReels) ? input.productReels : input.productReels?.records;
  if (!Array.isArray(reels) || reels.length !== 4) error(errors, "productReels must contain exactly four weekly records");
  if (Array.isArray(reels)) {
    for (const week of WEEKS) {
      const reel = reels.find((record) => record.id === `${month.toLowerCase()}-week-${week}` || record.week === week);
      if (!reel) { error(errors, `missing Product Reel record for week ${week}`); continue; }
      if (!reel.hook || !reel.cta?.redirectUrl) error(errors, `Product Reel week ${week} is missing hook or CTA`);
      if (reel.cta?.redirectUrl !== redirectUrl) error(errors, `Product Reel week ${week} CTA does not match redirectUrl`);
      if (reel.qa?.answerKeyExposed) error(errors, `Product Reel week ${week} exposes an answer key`);
    }
  }
  return { valid: errors.length === 0, errors, normalized: { ...input, month, productName, redirectUrl, assets, productReels: reels ?? [] } };
}

export function buildCarouselWorkstream(input = {}) {
  const validation = validateCarouselInput(input);
  if (!validation.valid) return { valid: false, errors: validation.errors, records: [] };
  const { month, productName, redirectUrl, assets, productReels } = validation.normalized;
  const records = PLAN_TEMPLATES.map((template, index) => {
    const week = index + 1;
    const reel = productReels.find((record) => record.id === `${month.toLowerCase()}-week-${week}` || record.week === week);
    const slides = template.slides.map(([type, copy, asset]) => ({
      type,
      copy: copy.replaceAll("[PRODUCT_NAME]", productName),
      visual: { asset: assets[asset], treatment: type === "Evidence" ? "controlled-crop" : type === "Title" ? "full-frame" : "supporting-crop" }
    }));
    return {
      schemaVersion: "1.0.0",
      id: `${month.toLowerCase()}-carousel-week-${week}`,
      week,
      month,
      productName,
      pairedReelId: reel.id,
      pairedReelHook: reel.hook,
      canvas: "1080x1080",
      slideCount: slides.length,
      slides,
      cta: { text: `Explore ${productName} on TPT`, redirectUrl },
      captionDirection: "Explain the visible product evidence without unsupported grade, mastery, testimonial, or outcome claims.",
      claimPolicy: { sourceAssetsOnly: true, noTestimonials: true, noUnsupportedOutcomes: true, noAnswerKeyExposure: true },
      qa: { humanReviewRequired: true, answerKeyExposed: false, publicDisplayStatus: "review", hookMatch: true, monthMatch: true, redirectMatch: true }
    };
  });
  return { valid: true, errors: [], schemaVersion: "1.0.0", campaignId: `${month.toLowerCase()}-carousels`, month, productName, redirectUrl, records };
}

export { REQUIRED_ASSETS, PLAN_TEMPLATES };
