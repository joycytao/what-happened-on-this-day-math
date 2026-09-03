import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { LEVEL2_TEMPLATE, loadLevel2Template, renderLevel2 } from "../src/level2-renderer.mjs";

const example = JSON.parse(await readFile(new URL("../examples/monthly-content.example.json", import.meta.url), "utf8"));
const day = example.days[0];

test("renderLevel2 emits one template-sized page with the daily prompt", () => {
  const svg = renderLevel2(day);

  assert.equal((svg.match(/<svg\b/g) ?? []).length, 1);
  assert.match(svg, /<svg[^>]+width="1545"[^>]+height="2000"/);
  assert.match(svg, /data-template-variant="level2"/);
  assert.match(svg, /data-date="1969-07-20"/);
  assert.match(svg, /Three astronauts flew on Apollo 11/);
  assert.match(svg, /font-size="46"/);
  assert.match(svg, /Level/);
  assert.match(svg, />Q2</);
  assert.match(svg, /stroke="#477db7"/);
  assert.match(svg, />Name:</);
  assert.match(svg, />6<\/text>/);
});

test("loadLevel2Template returns the canonical manifest variant", async () => {
  const template = await loadLevel2Template();

  assert.deepEqual(template, {
    id: "level-2",
    filename: LEVEL2_TEMPLATE.filename,
    pageType: "level2",
    dimensions: { width: 1545, height: 2000 },
    fields: ["Date", "Math_Level_2"],
    version: LEVEL2_TEMPLATE.version,
  });
});

test("renderLevel2 rejects missing, wrong-level, and overlong prompts", () => {
  assert.throws(() => renderLevel2({ date: day.date, mathLevels: {} }), /mathLevels\.level2 is required/);
  assert.throws(() => renderLevel2({ date: day.date, mathLevels: { level2: { pageType: "level1", prompt: "Question" } } }), /pageType must be level2/);
  assert.throws(() => renderLevel2({ date: day.date, mathLevels: { level2: { pageType: "level2", prompt: "word ".repeat(56) } } }), /exceeds the template text area/);
});
