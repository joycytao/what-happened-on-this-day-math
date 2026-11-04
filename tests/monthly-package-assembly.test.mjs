import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";

import {
  assembleMonthlyPackage,
  buildMonthlyPackageContract,
  validateMonthlyPackageInputs,
} from "../src/monthly-package-assembly.mjs";

const roles = (dayCount, coverPages) => ({
  cover: coverPages ? { pageCount: coverPages, pages: [{ role: "cover" }] } : null,
  daily: {
    pageCount: dayCount * 4,
    pages: Array.from({ length: dayCount }, (_, index) => ["reading-passage", "level1", "level2", "level3"].map((pageType) => ({ role: "daily", day: index + 1, pageType }))).flat(),
  },
  answerKey: { pageCount: 3, pages: ["level1", "level2", "level3"].map((level) => ({ role: "answer_key", level })) },
  followUp: { pageCount: 1, pages: [{ role: "follow_up", asset: "follow-up-page-reference.png" }], visualQa: { passed: true, artifacts: ["overlay.png", "pixel-diff-heatmap.png"] } },
});

async function pdf(path, count) {
  const document = await PDFDocument.create();
  for (let index = 0; index < count; index += 1) document.addPage([612, 792]);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path, await document.save({ useObjectStreams: false }));
}

test("builds approved component-level contracts without an existing combined source PDF", () => {
  assert.deepEqual(buildMonthlyPackageContract(30), { dayCount: 30, coverPages: 1, dailyPages: 120, answerKeyPages: 3, followUpPages: 1, totalPages: 125 });
  assert.deepEqual(buildMonthlyPackageContract(31), { dayCount: 31, coverPages: 0, dailyPages: 124, answerKeyPages: 3, followUpPages: 1, totalPages: 128 });
});

test("validates separate cover, daily, Answer Key, and follow-up manifests", () => {
  const result = validateMonthlyPackageInputs({ dayCount: 30, components: roles(30, 1), finalExists: false });
  assert.equal(result.valid, true, result.errors.join("; "));
  assert.deepEqual(result.pageRanges, { cover: [1, 1], daily: [2, 121], answerKey: [122, 124], followUp: [125, 125] });
});

test("rejects incomplete or stale component assembly before writing output", () => {
  const components = roles(30, 1);
  components.daily.pages[4] = { role: "daily", day: 2, pageType: "level1" };
  components.followUp.visualQa = { passed: false, artifacts: [] };
  const result = validateMonthlyPackageInputs({ dayCount: 30, components, finalExists: true });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /daily component pages must remain in calendar order/);
  assert.match(result.errors.join("\n"), /visual QA must pass/);
  assert.match(result.errors.join("\n"), /stale final output/);
});

test("assembles independent PDFs and preserves component bytes", async () => {
  const directory = join(tmpdir(), `monthly-package-${Date.now()}`);
  await mkdir(directory, { recursive: true });
  const paths = { cover: join(directory, "cover.pdf"), daily: join(directory, "daily.pdf"), answerKey: join(directory, "answer-key.pdf"), followUp: join(directory, "follow-up.pdf"), final: join(directory, "final.pdf") };
  await pdf(paths.cover, 1);
  await pdf(paths.daily, 120);
  await pdf(paths.answerKey, 3);
  await pdf(paths.followUp, 1);
  const before = await Promise.all([paths.cover, paths.daily, paths.answerKey, paths.followUp].map(async (path) => [path, await readFile(path)]));
  const result = await assembleMonthlyPackage({ dayCount: 30, components: paths, outputPdf: paths.final, componentManifests: roles(30, 1), pageCounts: { cover: 1, daily: 120, answerKey: 3, followUp: 1 } });
  assert.equal(result.actualPageCount, 125);
  assert.deepEqual(result.pageRanges, { cover: [1, 1], daily: [2, 121], answerKey: [122, 124], followUp: [125, 125] });
  for (const [path, bytes] of before) assert.deepEqual(await readFile(path), bytes);
});
