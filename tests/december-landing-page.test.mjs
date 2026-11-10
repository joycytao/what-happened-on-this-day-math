import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const output = path.join(root, "output/tpt/december-morning-work-math/visual-assets");
const handoff = JSON.parse(fs.readFileSync(path.join(output, "landing-page-handoff.json"), "utf8"));

test("December landing-page handoff is tied to the approved release PDF", () => {
  assert.equal(handoff.month, "december");
  assert.equal(handoff.landingPage.monthSlug, "december");
  assert.equal(handoff.landingPage.title, "December Morning Work Math");
  assert.equal(handoff.landingPage.description, "31 daily word problems across 3 levels, with separate answer keys.");
  assert.equal(handoff.landingPage.productUrl, "https://6pm-studio.com/go/december");
  assert.equal(handoff.sourcePdf.pageCount, 128);
  assert.equal(handoff.sourcePdf.sha256, "dcf77438c586212eab7e6e09c118a011dba9ac48dbc770086b078b5b02ea472d");
  assert.deepEqual(handoff.sourcePages.landing_page.source_pages, {
    reading_passage: 2,
    level1: 3,
    level2: 4,
    level3: 5,
    answer_key: 125,
  });
});

test("December landing-page image is 1260x1260 and checksum-stable", () => {
  const imagePath = path.join(root, handoff.landingPageImage.path);
  const bytes = fs.readFileSync(imagePath);
  const checksum = crypto.createHash("sha256").update(bytes).digest("hex");
  assert.equal(handoff.landingPageImage.id, "landing-page");
  assert.equal(handoff.landingPageImage.width, 1260);
  assert.equal(handoff.landingPageImage.height, 1260);
  assert.equal(handoff.landingPageImage.sha256, checksum);
});
