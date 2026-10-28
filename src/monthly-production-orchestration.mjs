const WORKSTREAMS = [
  { key: "context-source", title: "Context and source validation", blockedBy: [], ready: true },
  { key: "content-conversion", title: "Chinese-to-English content conversion", blockedBy: ["context-source"] },
  { key: "math-validation", title: "Math and content validation", blockedBy: ["content-conversion"] },
  { key: "worksheet-answer-key", title: "Worksheet pages and answer key", blockedBy: ["math-validation"] },
  { key: "cover", title: "Worksheet cover", blockedBy: ["math-validation"] },
  { key: "follow-up-pages", title: "Last and follow-up pages", blockedBy: ["math-validation"] },
  { key: "release-qa", title: "PDF assembly and release QA", blockedBy: ["worksheet-answer-key", "cover", "follow-up-pages"] },
  { key: "landing-page", title: "Landing-page assets and copy", blockedBy: ["release-qa"] },
  { key: "tpt", title: "TPT assets and copy", blockedBy: ["release-qa"] },
];

const LABELS = {
  feature: "type: feature",
  monthly: "content:monthly",
  ready: "status: ready to pickup",
  blocked: "status: blocked",
  review: "status: pending review",
};

function requiredErrors(input) {
  const errors = [];
  for (const key of ["month", "inputIssue", "inputArtifact", "runUrl"]) if (!input?.[key]) errors.push(`${key} is required`);
  if (input?.month && !/^\d{4}-\d{2}$/.test(input.month)) errors.push("month must use YYYY-MM");
  if (input?.project && (!input.project.owner || !Number.isInteger(Number(input.project.number)))) errors.push("project owner and number are required");
  return errors;
}

function issueBody({ month, inputIssue, inputArtifact, runUrl, project, key, title, blockedBy }) {
  const dependencyText = blockedBy.length ? blockedBy.map((dependency) => `- ${dependency}`).join("\n") : "- none";
  return [
    `<!-- monthly-production:${month}:${key} -->`,
    `# ${title}: ${month}`,
    "",
    `- Month: \`${month}\``,
    `- Source context Issue: #${inputIssue}`,
    `- Raw input evidence: \`${inputArtifact}\``,
    `- Orchestration run: ${runUrl}`,
    ...(project ? [`- Math Production Project: ${project.owner}/${project.number}`] : ["- Math Production Project: not configured"]),
    "",
    "## Dependencies",
    dependencyText,
    "",
    "## Completion evidence",
    "Record artifact paths, validation reports, and any blocker reason here. Downstream Issues must not be marked ready until the listed dependencies are complete.",
  ].join("\n");
}

function issueFor(input, descriptor) {
  const marker = `<!-- monthly-production:${input.month}:${descriptor.key} -->`;
  const labels = [LABELS.feature, LABELS.monthly, descriptor.ready ? LABELS.ready : LABELS.blocked];
  return {
    key: descriptor.key,
    marker,
    title: `[${descriptor.key}] ${descriptor.title}: ${input.month}`,
    body: issueBody({ ...input, ...descriptor }),
    labels,
    blockedBy: [...descriptor.blockedBy],
  };
}

export function buildMonthlyProductionPlan(input = {}) {
  const errors = requiredErrors(input);
  if (errors.length) return { valid: false, errors, parent: null, issues: [], dependencies: [] };
  const parent = {
    key: "monthly-parent",
    marker: `<!-- monthly-production:${input.month}:parent -->`,
    title: `[Monthly production] ${input.month}`,
    body: [
      `<!-- monthly-production:${input.month}:parent -->`,
      `# Monthly production: ${input.month}`,
      "",
      `- Context input Issue: #${input.inputIssue}`,
      `- Raw input evidence: \`${input.inputArtifact}\``,
      `- Orchestration run: ${input.runUrl}`,
      ...(input.project ? [`- Math Production Project: ${input.project.owner}/${input.project.number}`] : ["- Math Production Project: not configured"]),
      "- Landing-page and TPT work are parallel only after release QA.",
    ].join("\n"),
    labels: [LABELS.feature, LABELS.monthly, LABELS.review],
    blockedBy: [],
  };
  const issues = WORKSTREAMS.map((descriptor) => issueFor(input, descriptor));
  const dependencies = issues.flatMap((issue) => issue.blockedBy.map((dependency) => [dependency, issue.key]));
  return { valid: true, errors: [], parent, issues, dependencies };
}
