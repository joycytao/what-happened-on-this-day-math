import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import XLSX from "xlsx";

import { CANONICAL_HEADERS, loadSocialCalendar } from "../src/social-calendar-loader.mjs";

const validRows = [
  ["reel-02", "Reel", "reel-v1", "scheduled", new Date("2026-10-20T00:00:00Z"), "assets/reel-02.png;assets/cover.png", "A Reel hook", "A Reel caption", "#math #6PM", "october-2026", 3, "mp4", "ready"],
  ["carousel-01", "Carousel", "carousel-v1", "monthly-release", new Date("2026-10-05T00:00:00Z"), "assets/carousel-01.png", "A Carousel hook", "A Carousel caption", "math,learning", "october-2026", 1, "png", "planned"]
];

async function workbookPath(rows = validRows) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "social-calendar-"));
  const filePath = path.join(directory, "content-calendar.xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([CANONICAL_HEADERS, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Content Calendar");
  XLSX.writeFile(workbook, filePath);
  return filePath;
}

test("loads Carousel and Reel rows in deterministic date order", async () => {
  const result = loadSocialCalendar({ workbookPath: await workbookPath(), month: "2026-10" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.records.map((record) => record.contentId), ["carousel-01", "reel-02"]);
  assert.deepEqual(result.records[0].hashtags, ["#math", "#learning"]);
  assert.deepEqual(result.records[1].assetPaths, ["assets/reel-02.png", "assets/cover.png"]);
});

test("reports missing required fields with row and field", async () => {
  const row = [...validRows[0]];
  row[5] = "";
  row[7] = "";
  row[8] = "";
  row[4] = "";
  const result = loadSocialCalendar({ workbookPath: await workbookPath([row]), month: "2026-10" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.filter((item) => item.row === 2).map((item) => item.field).sort(), ["Asset Paths", "Caption", "Hashtags", "Publish Date"]);
});

test("rejects duplicate Content ID values", async () => {
  const result = loadSocialCalendar({ workbookPath: await workbookPath([validRows[0], validRows[0]]), month: "2026-10" });
  assert.equal(result.valid, false);
  assert.match(result.errors.find((item) => item.field === "Content ID").message, /duplicates row 2/);
});

test("rejects unsupported template IDs before generation", async () => {
  const row = [...validRows[0]];
  row[2] = "unknown-v9";
  const result = loadSocialCalendar({ workbookPath: await workbookPath([row]), month: "2026-10" });
  assert.equal(result.valid, false);
  assert.equal(result.errors[0].field, "Template ID");
});

test("ignores valid rows outside the requested month", async () => {
  const row = [...validRows[0]];
  row[0] = "november-reel";
  row[4] = new Date("2026-11-20T00:00:00Z");
  const result = loadSocialCalendar({ workbookPath: await workbookPath([validRows[1], row]), month: "2026-10" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.records.map((record) => record.contentId), ["carousel-01"]);
});
