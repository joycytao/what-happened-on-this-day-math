import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { LEVEL3_TEMPLATE, loadLevel3Template, renderLevel3 } from "../src/level3-renderer.mjs";

const example = JSON.parse(await readFile(new URL("../examples/monthly-content.example.json", import.meta.url), "utf8"));
const day = example.days[0];

test("renderLevel3 emits one template-sized page with the daily prompt", () => {
  const svg = renderLevel3(day);

  assert.equal((svg.match(/<svg\b/g) ?? []).length, 1);
  assert.match(svg, /<svg[^>]+width="1545"[^>]+height="2000"/);
  assert.match(svg, /data-template-variant="level3"/);
  assert.match(svg, /data-date="1969-07-20"/);
  assert.match(svg, /Apollo 11 launched on July 16/);
  assert.match(svg, /font-size="46"/);
  assert.match(svg, /Level/);
  assert.match(svg, />3</);
  assert.match(svg, /stroke="#477db7"/);
  assert.match(svg, />Name:</);
  assert.match(svg, />6<\/text>/);
});

test("loadLevel3Template returns the canonical manifest variant", async () => {
  const template = await loadLevel3Template();

  assert.deepEqual(template, {
    id: "level-3",
    filename: LEVEL3_TEMPLATE.filename,
    pageType: "level3",
    dimensions: { width: 1545, height: 2000 },
    fields: ["Date", "Math_Level_3"],
    version: LEVEL3_TEMPLATE.version,
  });
});

test("renderLevel3 rejects missing, wrong-level, and overlong prompts", () => {
  assert.throws(() => renderLevel3({ date: day.date, mathLevels: {} }), /mathLevels\.level3 is required/);
  assert.throws(() => renderLevel3({ date: day.date, mathLevels: { level3: { pageType: "level1", prompt: "Question" } } }), /pageType must be level3/);
  assert.throws(() => renderLevel3({ date: day.date, mathLevels: { level3: { pageType: "level3", prompt: "word ".repeat(56) } } }), /exceeds the template text area/);
});
