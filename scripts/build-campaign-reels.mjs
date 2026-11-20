import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildCampaignReelPlan } from "../src/campaign-reel-contract.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function argument(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] ?? "").trim() : fallback;
}

function monthDay(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function longDate(isoDate) {
  const [, month, day] = isoDate.split("-");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[Number(month) - 1]} ${Number(day)}`;
}

function recordsByType(records, campaignType) {
  return records.filter((record) => record.campaignType === campaignType);
}

function renderEnvironment(records, outputDir) {
  const free = recordsByType(records, "free-worksheets");
  const sale = recordsByType(records, "early-bird-sale");
  const freeStart = free.find((record) => record.trigger === "START");
  const freeEnding = free.find((record) => record.trigger === "ENDING_SOON");
  const saleStart = sale.find((record) => record.trigger === "START");
  const saleEnding = sale.find((record) => record.trigger === "ENDING_SOON");
  const first = records[0];
  return {
    AVATAR: path.resolve(ROOT, first.avatarPath),
    FREE_SCENE: path.resolve(ROOT, freeStart.scenePath),
    EARLY_BIRD_SCENE: path.resolve(ROOT, saleStart.scenePath),
    FREE_START_DATE: monthDay(freeStart.campaignStartDate),
    FREE_ENDING_DATE: monthDay(freeEnding.publicationDate),
    SALE_START_DATE: monthDay(saleStart.campaignStartDate),
    SALE_ENDING_DATE: monthDay(saleEnding.publicationDate),
    FREE_DEADLINE: longDate(freeStart.campaignEndDate),
    SALE_DEADLINE: longDate(saleStart.campaignEndDate),
    SALE_PRICE: saleStart.salePrice,
    FREE_START_TITLE: freeStart.copy.title,
    FREE_START_LINE1: freeStart.copy.line1,
    FREE_START_LINE2: freeStart.copy.line2,
    FREE_ENDING_TITLE: freeEnding.copy.title,
    FREE_ENDING_LINE1: freeEnding.copy.line1,
    FREE_ENDING_LINE2: freeEnding.copy.line2,
    SALE_START_TITLE: saleStart.copy.title,
    SALE_START_LINE1: saleStart.copy.line1,
    SALE_START_LINE2: saleStart.copy.line2,
    SALE_ENDING_TITLE: saleEnding.copy.title,
    SALE_ENDING_LINE1: saleEnding.copy.line1,
    SALE_ENDING_LINE2: saleEnding.copy.line2,
    OUT: outputDir,
    TMP: path.join(outputDir, ".tmp"),
  };
}

function assertAssets(records) {
  const errors = [];
  for (const record of records) {
    for (const field of ["scenePath", "avatarPath"]) {
      const absolute = path.resolve(ROOT, record[field]);
      if (!fs.existsSync(absolute)) errors.push(`${record.contentId}: missing ${field} ${record[field]}`);
    }
  }
  return errors;
}

const inputPath = argument("--input");
if (!inputPath) {
  console.error("--input <campaign JSON> is required");
  process.exit(1);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), inputPath), "utf8"));
} catch (error) {
  console.error(`Unable to read campaign input: ${error.message}`);
  process.exit(1);
}

const plan = buildCampaignReelPlan(input);
const assetErrors = plan.valid ? assertAssets(plan.records) : [];
const errors = [...plan.errors, ...assetErrors];
if (errors.length) {
  console.error(errors.map((error) => `Campaign input error: ${error}`).join("\n"));
  process.exit(1);
}

const campaignIds = [...new Set(plan.records.map((record) => record.campaignId))].join("-");
const outputDir = path.resolve(process.cwd(), argument("--output", path.join("output", "social", "campaign-reels", campaignIds)));
const manifest = {
  schemaVersion: "1.0.0",
  campaignIds: [...new Set(plan.records.map((record) => record.campaignId))],
  outputs: plan.records.map((record) => ({
    contentId: record.contentId,
    campaignId: record.campaignId,
    variant: record.variant,
    trigger: record.trigger,
    publicationDate: record.publicationDate,
    outputFile: record.outputFile,
    outputPath: path.join(outputDir, record.outputFile),
    templateId: record.templateId,
    campaignStartDate: record.campaignStartDate,
    campaignEndDate: record.campaignEndDate,
    sourceAssets: [record.scenePath, record.avatarPath],
  })),
};
const copy = {
  schemaVersion: "1.0.0",
  outputs: plan.records.map((record) => ({
    contentId: record.contentId,
    variant: record.variant,
    caption: record.caption,
    hashtags: record.hashtags,
    offerClaim: record.offerClaim,
    cta: record.cta,
  })),
};

if (process.argv.includes("--plan-only")) {
  console.log(JSON.stringify({ manifest, copy }, null, 2));
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });
const environment = { ...process.env, ...renderEnvironment(plan.records, outputDir) };
const render = spawnSync("bash", [path.join(ROOT, "reels", "campaign-reminder-template", "build_campaign_reels.sh")], {
  cwd: ROOT,
  env: environment,
  encoding: "utf8",
  stdio: "inherit",
});
if (render.status !== 0) process.exit(render.status ?? 1);

fs.rmSync(path.join(outputDir, ".tmp"), { recursive: true, force: true });
fs.writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "copy.json"), `${JSON.stringify(copy, null, 2)}\n`);
console.log(`Created four campaign Reel variants in ${outputDir}`);
