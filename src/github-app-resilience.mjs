const DEFAULT_MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1000];

export function classifyGitHubFailure({ message = "", status, code } = {}) {
  if (status === 401 || status === 403 || /authentication|token|private key/i.test(message)) {
    return "authentication";
  }
  if (status === 429 || (Number.isInteger(status) && status >= 500)) return "transient";
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    /fetch failed|socket hang up|network|timed out|temporary failure/i.test(message)
  ) {
    return "network";
  }
  return "fatal";
}

export async function retryGitHubOperation({
  operation,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  onRetry = () => {},
} = {}) {
  if (typeof operation !== "function") throw new TypeError("operation is required");
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await operation(attempt);
    } catch (error) {
      const category = classifyGitHubFailure(error);
      const retryable = category === "network" || category === "transient";
      if (!retryable || attempt >= maxAttempts) throw error;
      const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      onRetry({ attempt, delay, category, message: error?.message ?? String(error) });
      await sleep(delay);
    }
  }
  throw new Error("GitHub operation exhausted retry attempts");
}

export function buildConnectivityReport({ command, attempts, category, message, retryable }) {
  return {
    command,
    attempts,
    category,
    retryable,
    message,
    nextAction:
      category === "network"
        ? "retry on the next heartbeat; if repeated, inspect DNS/proxy access to api.github.com"
        : "inspect the GitHub App configuration and HTTP response before retrying",
  };
}
