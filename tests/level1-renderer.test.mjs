import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadLevel1Template, renderLevel1 } from "../src/level1-renderer.mjs";

const example = JSON.parse(await readFile(new URL("../examples/monthly-content.example.json", import.meta.url), "utf8"));
const day = example.days[0];

test("renderLevel1 emits one template-sized page with the daily prompt", () => {
  const svg = renderLevel1(day);

  assert.match(svg, /^<svg[^>]+width="1545"[^>]+height="2000"/);
  assert.match(svg, /viewBox="0 0 1545 2000"/);
  assert.match(svg, /data-template-variant="level1"/);
  assert.match(svg, /data-date="1969-07-20"/);
  assert.match(svg, /Level/);
  assert.match(svg, /Eagle had about 30 seconds of fuel left/);
  assert.match(svg, /font-size="46"/);
  assert.match(svg, /stroke="#477db7"/);
  assert.match(svg, /<text x="155" y="205"/);
  assert.match(svg, />6<\/text>/);
  assert.match(svg, />pm<\/text>/);
  assert.match(svg, />studio<\/text>/);
  assert.equal((svg.match(/<svg\b/g) || []).length, 1);
});

test("loadLevel1Template returns the canonical manifest variant", async () => {
  const template = await loadLevel1Template();
  assert.equal(template.id, "level-1");
  assert.equal(template.filename, "level-1.png");
  assert.equal(template.version, "1.0.0");
  assert.deepEqual(template.dimensions, { width: 1545, height: 2000 });
});

test("renderLevel1 rejects missing, wrong-level, and overlong prompts", () => {
  assert.throws(() => renderLevel1({ date: day.date, mathLevels: {} }), /mathLevels.level1 is required/);
  assert.throws(() => renderLevel1({ date: day.date, mathLevels: { level1: { pageType: "level2", prompt: "x" } } }), /pageType must be level1/);
  assert.throws(() => renderLevel1({
    date: day.date,
    mathLevels: { level1: { pageType: "level1", prompt: "word ".repeat(200) } },
  }), /level1 prompt exceeds the template text area/);
});
