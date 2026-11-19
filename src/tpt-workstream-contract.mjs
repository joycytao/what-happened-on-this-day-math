const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function requiredString(value, field, errors) {
  if (typeof value !== "string" || value.trim() === "") errors.push(`${field} is required`);
  return typeof value === "string" ? value.trim() : "";
}

export function normaliseTptWorkflowInputs(input = {}) {
  const errors = [];
  const monthValue = requiredString(input.month, "month", errors);
  const monthNumber = /^\d+$/.test(monthValue) ? Number(monthValue) : MONTHS.findIndex((name) => name.toLowerCase() === monthValue.toLowerCase()) + 1;
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) errors.push("month must be 1-12 or an English month name");

  const yearValue = requiredString(String(input.year ?? ""), "year", errors);
  const year = Number(yearValue);
  if (!/^\d{4}$/.test(yearValue) || !Number.isInteger(year) || year < 2000) errors.push("year must be a four-digit year");

  const packageId = requiredString(input.packageId, "packageId", errors);
  const manifestPath = requiredString(input.manifestPath, "manifestPath", errors);
  const contentPath = requiredString(input.contentPath, "contentPath", errors);
  if (manifestPath.startsWith("/") || manifestPath.split("/").includes("..")) errors.push("manifestPath must stay inside the repository");
  if (contentPath.startsWith("/") || contentPath.split("/").includes("..")) errors.push("contentPath must stay inside the repository");

  return {
    valid: errors.length === 0,
    errors,
    inputs: {
      month: monthNumber,
      monthName: MONTHS[monthNumber - 1],
      year,
      packageId,
      manifestPath,
      contentPath,
      idempotencyKey: `${packageId}@${year}`
    }
  };
}

export function buildTptIssueBody({ result, runUrl = "", artifactName = "tpt-workstream" }) {
  const marker = `<!-- tpt-package-id:${result.packageId} -->`;
  const status = result.status === "qa" ? "QA" : "Blocked";
  const failure = result.failureReason ? `\n- Failure reason: ${result.failureReason}` : "";
  return [
    marker,
    `# TPT package: ${result.packageId}`,
    "",
    `- Status: **${status}**`,
    `- Package version: \`${result.packageVersion ?? "unknown"}\``,
    `- Month: ${result.month ?? "unknown"}`,
    `- Source commit: \`${result.sourceCommit ?? "unknown"}\``,
    `- Idempotency key: \`${result.idempotencyKey}\``,
    `- Workflow run: ${runUrl || "not available"}`,
    `- Workflow artifact: \`${artifactName}\``,
    `- Output directory: \`${result.outputDir ?? "not written"}\``,
    `- QA report: \`${result.reportPath ?? "not written"}\``,
    failure,
    "",
    "Human QA is required before publication. This workflow never publishes automatically."
  ].join("\n").replace(/\n\n\n/g, "\n\n");
}

export { MONTHS };
