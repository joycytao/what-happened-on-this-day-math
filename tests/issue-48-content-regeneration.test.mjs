import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import { validateOctoberContent } from "../src/october-content-validation.mjs";

const content = JSON.parse(await readFile(new URL("../content/monthly/month-10.json", import.meta.url), "utf8"));
const research = JSON.parse(await readFile(new URL("../research/october-events.json", import.meta.url), "utf8"));

describe("Issue #48 regenerated October content", () => {
  it("passes independent content and mathematics validation", () => {
    const report = validateOctoberContent(content, research);
    assert.equal(report.content.valid, true, report.content.errors.join("\n"));
    assert.equal(report.mathematics.valid, true, report.mathematics.errors.join("\n"));
  });

  it("tracks only sources cited by the 31 daily records", () => {
    const cited = new Set(content.days.flatMap((day) => day.sourceIds));
    const tracked = new Set(content.sources.map((source) => source.id));
    assert.deepEqual(tracked, cited);
    assert.equal(content.sources.length, 31);
  });

  it("enforces the original differentiated level contract for every event", () => {
    for (const day of content.days) {
      const { level1, level2, level3 } = day.mathLevels;
      assert.match(level1.skill, /addition|subtraction/);
      assert.match(level1.prompt, new RegExp(day.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(level2.skill, /multiplication|division|sharing|scale/);
      assert.match(level2.prompt, new RegExp(day.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(level3.skill, /multi_step|conversion|time|money|proportion/);
      assert.match(level3.prompt, new RegExp(day.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.ok((day.answers.level3.equation.match(/[+*\/\-]/g) ?? []).length >= 2, `${day.day}: Level 3 must use at least two operations`);
    }
  });

  it("rejects mathematically correct prompts that violate the level contract", () => {
    const malformed = structuredClone(content);
    malformed.days[0].mathLevels.level1.skill = "generic_arithmetic";
    malformed.days[0].answers.level3.equation = "1 + 1 = 2";
    const report = validateOctoberContent(malformed, research);
    assert.equal(report.content.valid, false);
    assert.match(report.content.errors.join("\n"), /level1 must use direct addition or subtraction/);
    assert.match(report.content.errors.join("\n"), /level3 must contain at least two operations/);
  });
});
