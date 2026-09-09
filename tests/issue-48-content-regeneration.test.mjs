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
});
