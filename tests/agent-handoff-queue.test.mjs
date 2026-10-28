import test from "node:test";
import assert from "node:assert/strict";

import { buildAgentHandoffPlan } from "../src/agent-handoff-queue.mjs";

function event(label, labels = []) {
  return {
    label: { name: label },
    repository: { full_name: "joycytao/what-happened-on-this-day-math" },
    issue: {
      number: 191,
      html_url: "https://github.com/joycytao/what-happened-on-this-day-math/issues/191",
      labels: labels.map((name) => ({ name })),
    },
  };
}

test("needs-triage routes to pm-triage", () => {
  const plan = buildAgentHandoffPlan(event("needs-triage"));
  assert.equal(plan.kind, "handoff");
  assert.equal(plan.role, "pm-triage");
  assert.equal(plan.skill, "skills/pm-triage/SKILL.md");
  assert.deepEqual(plan.addLabels, ["agent-requested"]);
});

test("ready-for-agent routes through exactly one agent label", () => {
  const plan = buildAgentHandoffPlan(event("ready-for-agent", ["agent: architect"]));
  assert.equal(plan.kind, "handoff");
  assert.equal(plan.role, "architect");
  assert.match(plan.marker, /:191:ready-for-agent:architect -->$/);
});

test("decision-owner labels preserve the existing owner routing", () => {
  const plan = buildAgentHandoffPlan(event("decision-owner: product-manager"));
  assert.equal(plan.role, "product-manager");
  assert.match(plan.prompt, /Decision Owner is `product-manager`/);
});

test("decision-owner social-expert routes to the social skill", () => {
  const plan = buildAgentHandoffPlan(event("decision-owner: social-expert"));
  assert.equal(plan.role, "social-expert");
  assert.equal(plan.skill, "skills/social-expert/SKILL.md");
});

for (const role of ["social-expert", "developer", "quality-engineer"]) {
  test(`ready-for-agent routes to ${role}`, () => {
    const plan = buildAgentHandoffPlan(event("ready-for-agent", [`agent: ${role}`]));
    assert.equal(plan.kind, "handoff");
    assert.equal(plan.role, role);
    assert.match(plan.skill, new RegExp(`skills/${role}/SKILL\\.md`));
  });
}

test("adding an agent label directly queues that agent", () => {
  const plan = buildAgentHandoffPlan(event("agent: developer", ["status: ready to pickup", "agent: developer"]));
  assert.equal(plan.kind, "handoff");
  assert.equal(plan.role, "developer");
});

test("ready-for-agent without a role is blocked", () => {
  const plan = buildAgentHandoffPlan(event("ready-for-agent"));
  assert.equal(plan.kind, "blocked");
  assert.deepEqual(plan.addLabels, ["needs-info"]);
  assert.match(plan.body, /exactly one supported `agent:` label/);
});

test("multiple agent labels are blocked instead of selecting one", () => {
  const plan = buildAgentHandoffPlan(event("status: ready to pickup", ["agent: architect", "agent: product-manager"]));
  assert.equal(plan.kind, "blocked");
  assert.match(plan.body, /exactly one supported `agent:` label/);
});

test("unsupported labels and pull requests are ignored", () => {
  assert.equal(buildAgentHandoffPlan(event("priority: high")), null);
  const pullRequestEvent = event("ready-for-agent", ["agent: architect"]);
  pullRequestEvent.issue.pull_request = { url: "https://api.github.com/repos/example/pulls/1" };
  assert.equal(buildAgentHandoffPlan(pullRequestEvent), null);
});
