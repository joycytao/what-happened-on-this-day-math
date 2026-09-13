import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));

test("October content follows the attached 31-day examples", () => {
  assert.match(content.days[0].mathLevels.level1.prompt, /4 tires/);
  assert.match(content.days[0].mathLevels.level2.prompt, /12 cars/);
  assert.match(content.days[30].mathLevels.level3.prompt, /60 metric tons/);
});
