import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  CANONICAL_HEADERS,
  parseCsv,
  serializeMonthlyCsv,
  upsertMonthlyCsv,
} from "../src/monthly-csv.mjs";

import example from "../examples/monthly-content.example.json" with { type: "json" };

describe("monthly CSV contract", () => {
  it("uses the confirmed canonical headers and round-trips escaped fields", () => {
    const content = structuredClone(example);
    content.days[0].title = 'A "quoted", surprising\ntitle';
    content.days[0].trivia[0] = "A comma, a quote (\"), and an emoji 🚀";

    const csv = serializeMonthlyCsv(content);
    const [header, row] = parseCsv(csv);

    assert.deepEqual(header, CANONICAL_HEADERS);
    assert.equal(row[2], content.days[0].title);
    assert.equal(row[5], JSON.stringify(content.days[0].trivia));
    assert.equal(row[6], content.days[0].mathLevels.level1.prompt);
    assert.equal(row[12], JSON.stringify(content.days[0].sourceIds));
  });

  it("creates a CSV and preserves unrelated existing rows during updates", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "monthly-csv-test-"));
    const outputPath = path.join(directory, "history_today_1969-07.csv");

    try {
      const first = serializeMonthlyCsv(example);
      await writeFile(outputPath, `${first}1969-07-21,🧪,Unrelated,,,,,,,,,,,,,\n`);

      const updated = structuredClone(example);
      updated.days[0].title = "Updated title";
      await upsertMonthlyCsv(updated, outputPath);

      const rows = parseCsv(await readFile(outputPath, "utf8"));
      assert.equal(rows.length, 3);
      assert.equal(rows[1][2], "Updated title");
      assert.equal(rows[2][0], "1969-07-21");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects an existing file whose header is not canonical", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "monthly-csv-test-"));
    const outputPath = path.join(directory, "history_today_1969-07.csv");

    try {
      await writeFile(outputPath, "Date,Math_Challenge\n");
      await assert.rejects(
        upsertMonthlyCsv(example, outputPath),
        /existing CSV headers do not match canonical headers/,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
