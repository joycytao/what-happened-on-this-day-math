import test from "node:test";
import assert from "node:assert/strict";

import {
  buildConnectivityReport,
  classifyGitHubFailure,
  retryGitHubOperation,
} from "../src/github-app-resilience.mjs";

test("retries bounded network failures and succeeds without waiting in tests", async () => {
  let attempts = 0;
  const delays = [];

  const result = await retryGitHubOperation({
    operation: async () => {
      attempts += 1;
      if (attempts < 3) throw new TypeError("fetch failed");
      return "ok";
    },
    maxAttempts: 3,
    sleep: async (delay) => delays.push(delay),
  });

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test("does not retry authentication failures", async () => {
  let attempts = 0;

  await assert.rejects(
    retryGitHubOperation({
      operation: async () => {
        attempts += 1;
        const error = new Error("GitHub installation token request failed with HTTP 401");
        error.status = 401;
        throw error;
      },
      maxAttempts: 3,
      sleep: async () => {},
    }),
    /HTTP 401/
  );

  assert.equal(attempts, 1);
  assert.equal(classifyGitHubFailure({ status: 401 }), "authentication");
});

test("reports actionable network evidence without secrets", () => {
  const report = buildConnectivityReport({
    command: "gh pr list --repo joycytao/what-happened-on-this-day-math",
    attempts: 3,
    category: "network",
    message: "fetch failed",
    retryable: true,
  });

  assert.deepEqual(report, {
    command: "gh pr list --repo joycytao/what-happened-on-this-day-math",
    attempts: 3,
    category: "network",
    retryable: true,
    message: "fetch failed",
    nextAction: "retry on the next heartbeat; if repeated, inspect DNS/proxy access to api.github.com",
  });
  assert.doesNotMatch(JSON.stringify(report), /token|private|BEGIN/);
});
