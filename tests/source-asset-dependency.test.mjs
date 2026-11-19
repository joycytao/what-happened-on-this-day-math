import test from "node:test";
import assert from "node:assert/strict";

import {
  parseSourceAssetDependencies,
  renderSourceAssetDependency,
  validateSourceAssetDependency,
} from "../src/source-asset-dependency.mjs";
import { parseIssueContract, validateGovernanceIssue } from "../src/issue-governance.mjs";
import { buildMonthlySocialIssuePlan } from "../src/social-orchestration.mjs";
import { auditIssue } from "../src/pm-triage-audit.mjs";

const line = (value) => `CODEX_SOURCE_ASSET_DEPENDENCY: ${JSON.stringify(value)}`;

test("source asset dependency contract parses and validates machine-readable fields", () => {
  const dependency = { id: "december-source-assets", paths: ["releases/december-2026.manifest.json"], required: true, status: "available" };
  const parsed = parseSourceAssetDependencies(line(dependency));
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.dependencies, [dependency]);
  assert.equal(validateSourceAssetDependency(dependency).valid, true);
});

test("missing source asset dependency is invalid for ready pickup", () => {
  const body = [
    "# Reel",
    "CODEX_WORK_ITEM_KIND: implementation",
    "CODEX_INPUTS_VALIDATED: true",
    "## Acceptance Criteria",
    "- render the reel",
    line({ id: "december-source-assets", paths: [], required: true, status: "missing", reason: "source package not supplied" }),
  ].join("\n");
  const issue = { number: 1, state: "open", body, labels: ["agent: developer", "status: ready to pickup"] };
  const contract = parseIssueContract(issue);
  const validation = validateGovernanceIssue(issue, []);
  assert.equal(contract.sourceAssetDependencies.length, 1);
  assert.equal(contract.sourceAssetsSatisfied, false);
  assert.ok(validation.errors.some((error) => /source asset dependency unresolved/i.test(error)));
});

test("PM audit blocks ready pickup when its machine-readable source asset is unresolved", () => {
  const body = [
    "# Reel",
    "CODEX_WORK_ITEM_KIND: implementation",
    "CODEX_INPUTS_VALIDATED: true",
    "## Acceptance Criteria",
    "- render the reel",
    line({ id: "december-source-assets", paths: [], required: true, status: "missing", reason: "source package not supplied" }),
  ].join("\n");
  const result = auditIssue({ number: 2, state: "open", body, labels: ["agent: developer", "status: ready to pickup"] });
  assert.equal(result.category, "source-asset-blocked");
  assert.deepEqual(result.repair.labels, ["agent: pm-triage", "status: blocked"]);
  assert.match(result.nextAction, /source asset dependency/i);
});

test("free-text asset blocker is not treated as a dependency contract", () => {
  const parsed = parseSourceAssetDependencies("- Asset readiness blocker: December source files are missing");
  assert.deepEqual(parsed.dependencies, []);
  assert.deepEqual(parsed.errors, []);
});

test("social pickup requires the machine-readable source asset contract", () => {
  const issue = {
    number: 3,
    state: "open",
    labels: ["agent: developer", "status: ready to pickup", "social: product-reel"],
    body: "# Reel\n\n- Asset readiness blocker: source files are missing\n\n## Acceptance Criteria\n- render the reel",
  };
  const contract = parseIssueContract(issue);
  const validation = validateGovernanceIssue(issue, []);
  assert.equal(contract.sourceAssetsSatisfied, false);
  assert.ok(validation.errors.some((error) => /CODEX_SOURCE_ASSET_DEPENDENCY/i.test(error)));
  assert.equal(auditIssue(issue).category, "source-asset-blocked");
});

test("social issue plans emit a source asset dependency marker", () => {
  const plan = buildMonthlySocialIssuePlan({
    month: "December",
    year: "2026",
    packageId: "december-v1.0",
    manifestPath: "releases/december-2026.manifest.json",
    contentPath: "data/monthly/2026-12-content-v2.json",
    thumbnailManifestPath: "examples/december-thumbnail-manifest.json",
    assetResources: [],
    runUrl: "https://github.com/example/actions/runs/1",
  });
  assert.equal(plan.assetReady, false);
  assert.match(plan.issues[1].body, /CODEX_SOURCE_ASSET_DEPENDENCY:/);
  const parsed = parseSourceAssetDependencies(plan.issues[1].body);
  assert.equal(parsed.dependencies[0].status, "missing");
  assert.ok(plan.issues[1].labels.includes("status: blocked"));
});

test("source asset dependency renderer is deterministic", () => {
  assert.equal(
    renderSourceAssetDependency({ id: "cover", paths: ["assets/cover.png"], required: true, status: "pending", reason: "awaiting upload" }),
    'CODEX_SOURCE_ASSET_DEPENDENCY: {"id":"cover","paths":["assets/cover.png"],"required":true,"status":"pending","reason":"awaiting upload"}',
  );
});
