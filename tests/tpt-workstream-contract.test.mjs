import test from "node:test";
import assert from "node:assert/strict";
import { buildTptIssueBody, normaliseTptWorkflowInputs } from "../src/tpt-workstream-contract.mjs";

test("normalises month names and preserves an idempotent workflow input contract", () => {
  const result = normaliseTptWorkflowInputs({
    month: "November",
    year: "2026",
    packageId: "november-morning-work-math",
    manifestPath: "releases/november-v1.0.manifest.json",
    contentPath: "content/monthly/month-11.json"
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.inputs, {
    month: 11,
    monthName: "November",
    year: 2026,
    packageId: "november-morning-work-math",
    manifestPath: "releases/november-v1.0.manifest.json",
    contentPath: "content/monthly/month-11.json",
    idempotencyKey: "november-morning-work-math@2026"
  });
});

test("rejects unsafe or incomplete workflow inputs", () => {
  const result = normaliseTptWorkflowInputs({ month: "13", year: "26", packageId: "", manifestPath: "../secret.json", contentPath: "/tmp/content.json" });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /month/);
  assert.match(result.errors.join("\n"), /year/);
  assert.match(result.errors.join("\n"), /manifestPath/);
  assert.match(result.errors.join("\n"), /contentPath/);
});

test("builds a review-gated issue body with a stable package marker", () => {
  const body = buildTptIssueBody({
    result: { packageId: "october-morning-work-math", packageVersion: "v1.0.0", month: "October", sourceCommit: "abc123", idempotencyKey: "october-morning-work-math@v1.0.0", status: "qa", outputDir: "output/tpt/october", reportPath: "output/tpt/october/workstream.json" },
    runUrl: "https://github.com/example/actions/runs/1",
    artifactName: "tpt-october-morning-work-math"
  });
  assert.match(body, /<!-- tpt-package-id:october-morning-work-math -->/);
  assert.match(body, /Status: \*\*QA\*\*/);
  assert.match(body, /Human QA is required/);
});
