import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderNovemberAnswerKeyPages } from "../src/answer-key-renderer.mjs";

test("November Answer Key renderer emits three level-ordered pages covering 30 days", async () => {
  const content = JSON.parse(await readFile(new URL("../content/monthly/month-11.json", import.meta.url), "utf8"));
  const pages = renderNovemberAnswerKeyPages(content);

  assert.deepEqual(pages.map((page) => [page.level, page.page]), [
    ["level1", 1],
    ["level2", 1],
    ["level3", 1],
  ]);
  assert.equal(pages.length, 3);
  assert.equal(pages.flatMap((page) => page.entryIds).length, 90);
  assert.equal(new Set(pages.flatMap((page) => page.entryIds)).size, 90);
  assert.ok(pages.every((page) => page.width === 1545 && page.height === 1999));
  assert.ok(pages.every((page) => page.svg.includes('data-template-variant="answer-key"')));
});
