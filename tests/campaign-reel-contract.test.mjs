import test from "node:test";
import assert from "node:assert/strict";
import { buildCampaignReelPlan, validateCampaignInput } from "../src/campaign-reel-contract.mjs";

const campaign = {
  campaignId: "free-november-2026",
  campaignName: "Free November Worksheets",
  campaignType: "free-worksheets",
  templateId: "free-worksheets-campaign-reel",
  campaignStartDate: "2026-11-10",
  campaignEndDate: "2026-11-21",
  offerClaim: "Free November worksheets through November 21.",
  freeScope: "November worksheets",
  contentIds: { START: "reminder-001", ENDING_SOON: "reminder-002" },
  scenePath: "reels/campaign-reminder-template/assets/free-scene.png",
  avatarPath: "reels/campaign-reminder-template/assets/profile-avatar.png",
  cta: "Link in bio",
  caption: "Free November worksheets are ready. Download before the deadline.",
  hashtags: ["#freeworksheets", "#homeschooling", "#education"],
  copy: {
    START: { title: "FREE NOVEMBER WORKSHEETS", line1: "Free through November 21", line2: "Link in bio" },
    ENDING_SOON: { title: "FREE WORKSHEETS END IN 3 DAYS", line1: "Download before November 21", line2: "Link in bio" },
  },
};

const saleCampaign = {
  campaignId: "early-bird-2026",
  campaignName: "Early-Bird Sale",
  campaignType: "early-bird-sale",
  templateId: "early-bird-sale-reel",
  campaignStartDate: "2026-11-22",
  campaignEndDate: "2026-11-30",
  offerClaim: "Early-bird pricing is $2.75 through November 30.",
  salePrice: "2.75",
  currency: "USD",
  contentIds: { START: "reminder-003", ENDING_SOON: "reminder-004" },
  scenePath: "reels/campaign-reminder-template/assets/early-bird-scene.png",
  avatarPath: "reels/campaign-reminder-template/assets/profile-avatar.png",
  cta: "Link in bio",
  caption: "The early-bird sale is live. Save before the campaign ends.",
  hashtags: ["#teacherspayteachers", "#education", "#printables"],
  copy: {
    START: { title: "EARLY-BIRD SALE IS LIVE", line1: "Get the complete resource for $2.75", line2: "Through November 30 • Link in bio" },
    ENDING_SOON: { title: "EARLY-BIRD PRICING ENDS IN 3 DAYS", line1: "Save through November 30", line2: "Link in bio" },
  },
};

test("valid campaign input expands to the four supported publication variants", () => {
  const result = buildCampaignReelPlan({ campaigns: [campaign, saleCampaign] });
  assert.equal(result.valid, true);
  assert.deepEqual(result.records.map((record) => record.variant), ["free-start", "free-ending-soon", "early-bird-start", "early-bird-ending-soon"]);
  assert.equal(result.records.length, 4);
  assert.equal(result.records[0].contentId, "reminder-001");
  assert.equal(result.records[1].publicationDate, "2026-11-18");
  assert.equal(result.records[1].outputFile, "free-worksheets-ending-soon.mp4");
});

test("requires dates, exact offer facts, approved template mapping, and copy before rendering", () => {
  const result = validateCampaignInput({
    ...campaign,
    campaignEndDate: "",
    offerClaim: "",
    templateId: "",
    copy: { START: campaign.copy.START },
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /campaignEndDate/);
  assert.match(result.errors.join("\n"), /offerClaim/);
  assert.match(result.errors.join("\n"), /templateId/);
  assert.match(result.errors.join("\n"), /ENDING_SOON copy/);
});

test("requires sale price and rejects an ending-soon date before campaign start", () => {
  const result = validateCampaignInput({
    ...saleCampaign,
    campaignStartDate: "2026-11-20",
    campaignEndDate: "2026-11-21",
    salePrice: "",
    currency: "USD",
    copy: saleCampaign.copy,
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /salePrice/);
  assert.match(result.errors.join("\n"), /ending-soon publication date/);
});

test("rejects unsupported campaign types and duplicate content IDs", () => {
  const result = validateCampaignInput({
    ...campaign,
    campaignType: "invented-offer",
    contentIds: { START: "same-id", ENDING_SOON: "same-id" },
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /campaignType/);
  assert.match(result.errors.join("\n"), /unique/);
});
