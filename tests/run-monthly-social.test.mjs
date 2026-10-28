import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import XLSX from "xlsx";
import { runMonthlySocial } from "../scripts/run-monthly-social.mjs";

async function createCalendar(root) {
  const calendarPath = path.join(root, "calendar.xlsx");
  const headers = ["Content ID", "Content Type", "Template ID", "Trigger", "Publication Date", "Asset Paths", "Hook", "Caption", "Hashtags"];
  const row = ["reel-01", "Reel", "reel-v1", "START", "2026-12-03", "assets/cover.png", "Hook", "Caption", "#math"];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, row]), "Content Calendar");
  XLSX.writeFile(workbook, calendarPath);
  return calendarPath;
}

test("dry-run writes a deterministic manifest without media output directories", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "monthly-social-run-"));
  const calendarPath = await createCalendar(root);
  const outputRoot = path.join(root, "output");

  const first = await runMonthlySocial({ month: "2026-12", calendar: calendarPath, output: outputRoot, dryRun: true });
  const second = await runMonthlySocial({ month: "2026-12", calendar: calendarPath, output: outputRoot, dryRun: true });

  assert.equal(first.valid, true);
  assert.equal(first.dryRun, true);
  assert.deepEqual(first, second);
  assert.equal(await fs.readFile(first.manifestPath, "utf8"), `${JSON.stringify(first.manifest, null, 2)}\n`);
  assert.equal(first.manifest.rows[0].generator, "product-reel");
  await assert.rejects(fs.access(path.join(outputRoot, "2026-12", "reel-01")));
});
