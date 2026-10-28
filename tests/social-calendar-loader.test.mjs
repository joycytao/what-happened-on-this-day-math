import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import XLSX from "xlsx";
import { loadSocialCalendar } from "../src/social-calendar-loader.mjs";

const headers = ["Content ID", "Content Type", "Template ID", "Trigger", "Publication Date", "Asset Paths", "Hook", "Caption", "Hashtags"];
const validRows = [
  ["reel-02", "Reel", "reel-v1", "ENDING_SOON", "2026-11-12", "assets/reel.png", "A quick hook", "A caption", "#math #learning"],
  ["carousel-01", "Carousel", "carousel-v1", "START", "2026-11-03", "assets/page-1.png;assets/page-2.png", "A useful hook", "A caption", "#math #school"],
];

async function workbookPath(rows = validRows, columns = headers) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "social-calendar-"));
  const file = path.join(directory, "content-calendar.xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Content Calendar");
  XLSX.writeFile(workbook, file);
  return file;
}

test("loads Carousel and Reel rows in deterministic date order", async () => {
  const result = loadSocialCalendar({ workbookPath: await workbookPath(), month: "2026-11" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.rows.map((row) => row.contentId), ["carousel-01", "reel-02"]);
  assert.deepEqual(result.rows[0].assetPaths, ["assets/page-1.png", "assets/page-2.png"]);
  assert.deepEqual(result.rows[1].hashtags, ["#math", "#learning"]);
});

test("reports row-specific errors for missing required fields", async () => {
  const result = loadSocialCalendar({ workbookPath: await workbookPath([["bad-01", "Carousel", "", "START", "", "", "", "", ""]]), month: "2026-11" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /Row 2: Template ID is required/);
  assert.match(result.errors.join("\n"), /Row 2: Publication Date is required/);
  assert.match(result.errors.join("\n"), /Row 2: Asset Paths is required/);
  assert.match(result.errors.join("\n"), /Row 2: Hashtags is required/);
});

test("rejects duplicate Content IDs and unsupported templates", async () => {
  const result = loadSocialCalendar({ workbookPath: await workbookPath([validRows[0], ["reel-02", "Reel", "carousel-v1", "START", "2026-11-13", "assets/reel-2.png", "Hook", "Caption", "#math"]]), month: "2026-11" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicate Content ID "reel-02"/);
  assert.match(result.errors.join("\n"), /does not match Reel \(reel-v1\)/);
});

test("rejects unsupported content types and invalid triggers", async () => {
  const result = loadSocialCalendar({ workbookPath: await workbookPath([["bad-02", "Story", "story-v1", "MAYBE", "2026-11-04", "assets/story.png", "Hook", "Caption", "#math"]]), month: "2026-11" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /Content Type "story" is unsupported/);
  assert.match(result.errors.join("\n"), /Trigger "MAYBE" is unsupported/);
});

test("requires the workbook path and YYYY-MM month", () => {
  const result = loadSocialCalendar({});
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["workbookPath is required", "month must use YYYY-MM format"]);
});
