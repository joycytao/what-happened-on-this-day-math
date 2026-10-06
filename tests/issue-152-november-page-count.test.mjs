import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { buildNovemberPageMappings, NOVEMBER_FINAL_PAGE_COUNT } from "../src/november-orchestration.mjs";

test("Issue #152 records the 125-page November final release contract", async () => {
  const root = new URL("..", import.meta.url).pathname;
  const pdf = await PDFDocument.load(await readFile(`${root}output/pdf/november-worksheet-packet-final.pdf`));
  assert.equal(pdf.getPageCount(), NOVEMBER_FINAL_PAGE_COUNT);
  assert.deepEqual(buildNovemberPageMappings().followUp.finalPages, [125]);
  const handoff = JSON.parse(await readFile(`${root}output/tpt/november-morning-work-math/visual-assets/landing-page-handoff.json`, "utf8"));
  assert.equal(handoff.sourcePdf.pageCount, 125);
  assert.equal(handoff.landingPage.productUrl, "https://6pm-studio.com/go/november");
});
