const DEFAULT_FIELD_NAMES = Object.freeze({
  workstream: "Workstream",
  contentType: "Content Type",
  month: "Month",
  sourceRelease: "Source Release",
  targetDate: "Target Date",
  qaStatus: "QA Status",
  artifactUrl: "Artifact URL",
  workflowRun: "Workflow Run",
  manifest: "Manifest"
});

function requiredString(value, field, errors) {
  if (typeof value !== "string" || value.trim() === "") errors.push(String(field) + " is required");
  return typeof value === "string" ? value.trim() : "";
}

export function normaliseTptProjectConfig(input = {}) {
  const errors = [];
  const owner = requiredString(input.owner, "project owner", errors);
  const numberValue = String(input.number ?? "").trim();
  const number = Number(numberValue);
  if (!/^[1-9]\d*$/.test(numberValue) || !Number.isInteger(number)) errors.push("project number must be a positive integer");
  const fieldNames = { ...DEFAULT_FIELD_NAMES, ...(input.fieldNames ?? {}) };
  for (const [key, value] of Object.entries(fieldNames)) {
    if (typeof value !== "string" || value.trim() === "") errors.push("field name " + key + " is required");
    else fieldNames[key] = value.trim();
  }
  return {
    valid: errors.length === 0,
    errors,
    config: { owner, number, fieldNames }
  };
}

export function projectStatusForResult(result = {}) {
  return result.status === "qa" ? "QA" : "Blocked";
}

export function buildTptProjectPlan({
  result = {},
  issueNumber,
  issueNodeId = "",
  runUrl = "",
  manifestPath = "",
  artifactUrl = "",
  config = {}
} = {}) {
  const configResult = normaliseTptProjectConfig(config);
  const errors = [...configResult.errors];
  if (!Number.isInteger(issueNumber) || issueNumber < 1) errors.push("issueNumber must be a positive integer");
  if (typeof issueNodeId !== "string" || issueNodeId.trim() === "") errors.push("issueNodeId is required");
  if (typeof result.packageId !== "string" || result.packageId.trim() === "") errors.push("result.packageId is required");
  if (typeof result.idempotencyKey !== "string" || result.idempotencyKey.trim() === "") errors.push("result.idempotencyKey is required");
  if (errors.length) return { valid: false, errors };

  const { fieldNames } = configResult.config;
  const qaStatus = projectStatusForResult(result);
  const fields = {
    [fieldNames.workstream]: "TPT",
    [fieldNames.contentType]: "Monthly Package",
    [fieldNames.month]: String(result.month ?? ""),
    [fieldNames.sourceRelease]: String(result.sourceCommit ?? ""),
    [fieldNames.targetDate]: result.targetDate ? String(result.targetDate) : "",
    [fieldNames.qaStatus]: qaStatus,
    [fieldNames.artifactUrl]: artifactUrl,
    [fieldNames.workflowRun]: runUrl,
    [fieldNames.manifest]: manifestPath
  };
  return {
    valid: true,
    errors: [],
    plan: {
      schemaVersion: "1.0.0",
      idempotencyKey: result.idempotencyKey,
      publicationStatus: "review",
      project: {
        owner: configResult.config.owner,
        number: configResult.config.number,
        fieldNames
      },
      issue: { number: issueNumber, nodeId: issueNodeId },
      fields,
      expectedProjectItemAction: "find-or-add-then-update",
      status: qaStatus,
      package: {
        id: result.packageId,
        version: result.packageVersion ?? "",
        month: result.month ?? "",
        year: result.year ?? "",
        manifestPath,
        reportPath: result.reportPath ?? "",
        outputDir: result.outputDir ?? ""
      }
    }
  };
}

export { DEFAULT_FIELD_NAMES };
