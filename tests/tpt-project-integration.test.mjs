import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTptProjectPlan,
  normaliseTptProjectConfig,
  projectStatusForResult
} from "../src/tpt-project-integration.mjs";

const result = {
  packageId: "november-morning-work-math",
  packageVersion: "v1.0.0",
  month: "November",
  year: 2026,
  sourceCommit: "abc123",
  idempotencyKey: "november-morning-work-math@v1.0.0",
  status: "qa",
  outputDir: "output/tpt/november-morning-work-math",
  reportPath: "output/tpt/november-morning-work-math/workstream.json"
};

test("normalises a configured GitHub Project target and required field names", () => {
  const config = normaliseTptProjectConfig({
    owner: "joycytao",
    number: "7"
  });
  assert.equal(config.valid, true);
  assert.deepEqual(config.config, {
    owner: "joycytao",
    number: 7,
    fieldNames: {
      workstream: "Workstream",
      contentType: "Content Type",
      month: "Month",
      sourceRelease: "Source Release",
      targetDate: "Target Date",
      qaStatus: "QA Status",
      artifactUrl: "Artifact URL",
      workflowRun: "Workflow Run",
      manifest: "Manifest"
    }
  });
});

test("missing Project configuration fails closed with an actionable blocker", () => {
  const config = normaliseTptProjectConfig({});
  assert.equal(config.valid, false);
  assert.match(config.errors.join(" "), /owner/);
  assert.match(config.errors.join(" "), /number/);
});

test("builds an idempotent field update plan and never marks publication ready", () => {
  const plan = buildTptProjectPlan({
    result,
    issueNumber: 204,
    issueNodeId: "I_kwDOexample",
    runUrl: "https://github.com/joycytao/what-happened-on-this-day-math/actions/runs/42",
    manifestPath: "releases/november.manifest.json",
    artifactUrl: "https://github.com/joycytao/what-happened-on-this-day-math/actions/runs/42/artifacts/1",
    config: { owner: "joycytao", number: 7 }
  });
  assert.equal(plan.valid, true);
  assert.equal(plan.plan.project.owner, "joycytao");
  assert.equal(plan.plan.project.number, 7);
  assert.equal(plan.plan.issue.number, 204);
  assert.equal(plan.plan.idempotencyKey, result.idempotencyKey);
  assert.equal(plan.plan.fields.Workstream, "TPT");
  assert.equal(plan.plan.fields["Content Type"], "Monthly Package");
  assert.equal(plan.plan.fields["QA Status"], "QA");
  assert.equal(plan.plan.publicationStatus, "review");
  assert.equal(plan.plan.fields.Status, undefined);
});

test("maps failed generation to Blocked and successful generation to QA", () => {
  assert.equal(projectStatusForResult({ status: "qa" }), "QA");
  assert.equal(projectStatusForResult({ status: "blocked" }), "Blocked");
  assert.equal(projectStatusForResult({ status: "unexpected" }), "Blocked");
});
