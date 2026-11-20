const CAMPAIGN_TYPES = Object.freeze({
  "free-worksheets": Object.freeze({ templateId: "free-worksheets-campaign-reel", requiredFact: "freeScope" }),
  "early-bird-sale": Object.freeze({ templateId: "early-bird-sale-reel", requiredFact: "salePrice" }),
});

const VARIANTS = Object.freeze([
  Object.freeze({ type: "free-worksheets", trigger: "START", variant: "free-start", outputFile: "free-worksheets-start.mp4" }),
  Object.freeze({ type: "free-worksheets", trigger: "ENDING_SOON", variant: "free-ending-soon", outputFile: "free-worksheets-ending-soon.mp4" }),
  Object.freeze({ type: "early-bird-sale", trigger: "START", variant: "early-bird-start", outputFile: "early-bird-sale-start.mp4" }),
  Object.freeze({ type: "early-bird-sale", trigger: "ENDING_SOON", variant: "early-bird-ending-soon", outputFile: "early-bird-sale-ending-soon.mp4" }),
]);

function requiredString(input, field, errors) {
  const value = String(input?.[field] ?? "").trim();
  if (!value) errors.push(`${field} is required`);
  return value;
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function copyFor(input, trigger, errors) {
  const copy = input.copy?.[trigger];
  if (!copy || typeof copy !== "object") {
    errors.push(`${trigger} copy is required`);
    return { title: "", line1: "", line2: "" };
  }
  const normalized = {};
  for (const field of ["title", "line1", "line2"]) normalized[field] = requiredString(copy, field, errors);
  return normalized;
}

export function validateCampaignInput(input = {}) {
  const errors = [];
  const campaignId = requiredString(input, "campaignId", errors);
  const campaignName = requiredString(input, "campaignName", errors);
  const campaignType = requiredString(input, "campaignType", errors).toLowerCase();
  const campaignStartDate = requiredString(input, "campaignStartDate", errors);
  const campaignEndDate = requiredString(input, "campaignEndDate", errors);
  const templateId = requiredString(input, "templateId", errors);
  const offerClaim = requiredString(input, "offerClaim", errors);
  const campaignStart = parseDate(campaignStartDate);
  const campaignEnd = parseDate(campaignEndDate);
  if (campaignStartDate && !campaignStart) errors.push("campaignStartDate must be a valid YYYY-MM-DD date");
  if (campaignEndDate && !campaignEnd) errors.push("campaignEndDate must be a valid YYYY-MM-DD date");
  if (campaignStart && campaignEnd && campaignEnd < campaignStart) errors.push("campaignEndDate must not precede campaignStartDate");

  const typeConfig = CAMPAIGN_TYPES[campaignType];
  if (!typeConfig) errors.push(`campaignType "${campaignType}" is unsupported`);
  if (typeConfig && templateId !== typeConfig.templateId) errors.push(`templateId must be ${typeConfig.templateId} for ${campaignType}`);
  if (typeConfig?.requiredFact === "freeScope" && !String(input.freeScope ?? "").trim()) errors.push("freeScope is required for free-worksheets");
  if (typeConfig?.requiredFact === "salePrice") {
    const price = Number(input.salePrice);
    if (!Number.isFinite(price) || price <= 0) errors.push("salePrice is required for early-bird-sale");
    if (!/^[A-Z]{3}$/.test(String(input.currency ?? "").trim())) errors.push("currency must be a three-letter uppercase code for early-bird-sale");
  }

  const contentIds = input.contentIds && typeof input.contentIds === "object" ? input.contentIds : {};
  const startContentId = String(contentIds.START ?? "").trim();
  const endingContentId = String(contentIds.ENDING_SOON ?? "").trim();
  if (!startContentId) errors.push("contentIds.START is required");
  if (!endingContentId) errors.push("contentIds.ENDING_SOON is required");
  if (startContentId && endingContentId && startContentId === endingContentId) errors.push("content IDs must be unique");

  const scenePath = requiredString(input, "scenePath", errors);
  const avatarPath = requiredString(input, "avatarPath", errors);
  const cta = requiredString(input, "cta", errors);
  const caption = requiredString(input, "caption", errors);
  const hashtags = Array.isArray(input.hashtags) ? input.hashtags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  if (hashtags.length === 0) errors.push("hashtags must contain at least one value");
  const copy = {
    START: copyFor(input, "START", errors),
    ENDING_SOON: copyFor(input, "ENDING_SOON", errors),
  };
  const endingSoonDate = campaignEnd ? addDays(campaignEnd, -3) : "";
  if (campaignStart && endingSoonDate && endingSoonDate < campaignStartDate) errors.push("ending-soon publication date must not precede campaign start");

  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      campaignId,
      campaignName,
      campaignType,
      templateId,
      campaignStartDate,
      campaignEndDate,
      offerClaim,
      freeScope: String(input.freeScope ?? "").trim(),
      salePrice: String(input.salePrice ?? "").trim(),
      currency: String(input.currency ?? "").trim(),
      contentIds: { START: startContentId, ENDING_SOON: endingContentId },
      scenePath,
      avatarPath,
      cta,
      caption,
      hashtags,
      copy,
    },
  };
}

export function buildCampaignReelPlan({ campaigns = [] } = {}) {
  const errors = [];
  if (!Array.isArray(campaigns) || campaigns.length === 0) return { valid: false, errors: ["campaigns must be a non-empty array"], records: [] };
  const records = [];
  for (const input of campaigns) {
    const result = validateCampaignInput(input);
    errors.push(...result.errors.map((error) => `${input?.campaignId || "campaign"}: ${error}`));
    if (!result.valid) continue;
    const campaign = result.normalized;
    for (const definition of VARIANTS.filter((variant) => variant.type === campaign.campaignType)) {
      records.push({
        contentId: campaign.contentIds[definition.trigger],
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        campaignType: campaign.campaignType,
        templateId: campaign.templateId,
        trigger: definition.trigger,
        variant: definition.variant,
        publicationDate: definition.trigger === "START" ? campaign.campaignStartDate : addDays(new Date(`${campaign.campaignEndDate}T00:00:00Z`), -3),
        campaignStartDate: campaign.campaignStartDate,
        campaignEndDate: campaign.campaignEndDate,
        offerClaim: campaign.offerClaim,
        freeScope: campaign.freeScope,
        salePrice: campaign.salePrice,
        currency: campaign.currency,
        outputFile: definition.outputFile,
        scenePath: campaign.scenePath,
        avatarPath: campaign.avatarPath,
        cta: campaign.cta,
        caption: campaign.caption,
        hashtags: campaign.hashtags,
        copy: campaign.copy[definition.trigger],
      });
    }
  }
  const ids = records.map((record) => record.contentId);
  if (new Set(ids).size !== ids.length) errors.push("content IDs across campaign records must be unique");
  if (records.length !== VARIANTS.length) errors.push(`exactly ${VARIANTS.length} supported campaign outputs are required`);
  const variants = new Set(records.map((record) => record.variant));
  for (const definition of VARIANTS) if (!variants.has(definition.variant)) errors.push(`missing supported variant ${definition.variant}`);
  return { valid: errors.length === 0, errors, records: errors.length === 0 ? records : [] };
}

export { CAMPAIGN_TYPES, VARIANTS };
