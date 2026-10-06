export const SOCIAL_LABELS = Object.freeze({
  productReel: "social:product-reel",
  carousel: "social:carousel",
  utilityReel: "social:utility-reel",
  monthly: "content:monthly",
  utility: "content:utility",
  ready: "status:ready to pickup",
  qa: "status:qa",
  blocked: "status:blocked",
  pending: "status:pending review",
});

const MONTHS = new Set([
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]);

function requiredString(input, field, errors) {
  const value = String(input ?? "").trim();
  if (!value) errors.push(`${field} is required`);
  return value;
}

function baseResult(errors, issues = []) {
  return { valid: errors.length === 0, errors, issues };
}

function monthlyInputs(input) {
  const errors = [];
  const month = requiredString(input.month, "month", errors);
  const year = requiredString(input.year, "year", errors);
  const packageId = requiredString(input.packageId, "packageId", errors);
  const manifestPath = requiredString(input.manifestPath, "manifestPath", errors);
  const contentPath = requiredString(input.contentPath, "contentPath", errors);
  const thumbnailManifestPath = requiredString(input.thumbnailManifestPath, "thumbnailManifestPath", errors);
  const runUrl = requiredString(input.runUrl, "runUrl", errors);
  if (month && !MONTHS.has(month.toLowerCase())) errors.push("month must be an English month name");
  if (year && !/^\d{4}$/.test(year)) errors.push("year must be four digits");
  return { errors, value: { month, year, packageId, manifestPath, contentPath, thumbnailManifestPath, runUrl } };
}

function monthlyParent(value) {
  const marker = `<!-- codex-social-monthly:${value.packageId} -->`;
  const body = [
    marker,
    `# Social monthly queue: ${value.packageId}`,
    "",
    "This Issue is the idempotent queue record for the monthly Product Reel and Carousel workstreams.",
    "GitHub Actions only creates or updates these Issues and adds them to the existing Project. The Codex automation is the production worker; it runs the generator commands in the child Issues.",
    "",
    `- Month/year: ${value.month} ${value.year}`,
    `- Package ID: \`${value.packageId}\``,
    `- Release manifest: \`${value.manifestPath}\``,
    `- Content: \`${value.contentPath}\``,
    `- Thumbnail manifest: \`${value.thumbnailManifestPath}\``,
    `- Source workflow run: ${value.runUrl}`,
    "- Expected Reel artifact: `output/social/product-reels/<month>/workstream.json` and the reviewed MP4/sidecar outputs.",
    "- Expected Carousel artifact: `output/social/carousels/<month>-carousels/workstream.json`.",
    "- QA report and PR URL must be added by the Codex worker before closure.",
    "- Project status remains human-managed; repository labels and this Issue body carry workstream metadata.",
    "- Human QA is required before any publication; automatic social publishing is out of scope.",
  ].join("\n");
  return {
    kind: "monthly-parent",
    key: `monthly:${value.packageId}`,
    title: `[Social monthly] ${value.packageId}`,
    labels: ["type: feature", SOCIAL_LABELS.monthly, SOCIAL_LABELS.pending],
    marker,
    body,
  };
}

function monthlyChild(value, kind, week, dependency = null) {
  const isReel = kind === "product-reel";
  const label = isReel ? SOCIAL_LABELS.productReel : SOCIAL_LABELS.carousel;
  const marker = `<!-- codex-social-monthly:${value.packageId}:${isReel ? "reel" : "carousel"}:${week} -->`;
  const dependencyLine = dependency
    ? `- Dependency: wait for Product Reel week ${dependency} to close before pickup.\n- CODEX_DEPENDS_ON_WEEK:${dependency}`
    : "- Dependency: none; this is the first Codex production step for this week.";
  const command = isReel
    ? `npm run social:product-reels -- --input examples/${value.month.toLowerCase()}-product-reel-workstream.input.json`
    : `npm run social:carousels -- --input examples/${value.month.toLowerCase()}-carousel-workstream.input.json --reels output/social/product-reels/${value.month.toLowerCase()}/workstream.json`;
  const body = [
    marker,
    `# ${isReel ? "Product Reel" : "Carousel"} week ${week}: ${value.packageId}`,
    "",
    "Codex automation is the production worker for this Issue. GitHub Actions does not run the generator or publish the result.",
    `- Parent queue: [Social monthly] ${value.packageId}`,
    `- Package ID: \`${value.packageId}\``,
    `- Week: ${week}`,
    `- Release manifest: \`${value.manifestPath}\``,
    `- Source workflow run: ${value.runUrl}`,
    dependencyLine,
    `- Production command: \`${command}\``,
    `- Expected artifact: \`output/social/${isReel ? "product-reels" : "carousels"}/${value.month.toLowerCase()}${isReel ? "" : "-carousels"}/workstream.json\``,
    "- Add the rendered MP4 (Reel), artifact path, QA report, and PR URL to this Issue before closure.",
    "- Preserve source, mathematics, layout, PDF, renderer, and human-QA gates.",
    "- Record the branch, PR, artifact path, verification, and blocker (or none) in the Issue.",
  ].join("\n");
  return {
    kind,
    week,
    key: `monthly:${value.packageId}:${isReel ? "reel" : "carousel"}:${week}`,
    title: `[Social ${isReel ? "Reel" : "Carousel"}] ${value.packageId} week ${week}`,
    labels: ["type: feature", label, SOCIAL_LABELS.monthly, dependency ? SOCIAL_LABELS.blocked : SOCIAL_LABELS.ready],
    marker,
    body,
  };
}

export function buildMonthlySocialIssuePlan(input = {}) {
  const parsed = monthlyInputs(input);
  if (parsed.errors.length) return baseResult(parsed.errors);
  const parent = monthlyParent(parsed.value);
  const issues = [parent];
  for (let week = 1; week <= 4; week += 1) {
    issues.push(monthlyChild(parsed.value, "product-reel", week));
    issues.push(monthlyChild(parsed.value, "carousel", week, week));
  }
  return baseResult([], issues);
}

export function buildUtilitySocialIssuePlan(input = {}) {
  const errors = [];
  const cycleId = requiredString(input.cycleId, "cycleId", errors);
  const intakeIssueNumber = Number(input.intakeIssueNumber);
  const runUrl = requiredString(input.runUrl, "runUrl", errors);
  if (!Number.isInteger(intakeIssueNumber) || intakeIssueNumber < 1) errors.push("intakeIssueNumber must be a positive integer");
  if (errors.length) return baseResult(errors);

  const parentMarker = `<!-- codex-social-utility:${cycleId} -->`;
  const issues = [{
    kind: "utility-parent",
    key: `utility:${cycleId}`,
    title: `[Utility Reel cycle] ${cycleId}`,
    labels: ["type: feature", SOCIAL_LABELS.utility, SOCIAL_LABELS.pending],
    marker: parentMarker,
    body: [
      parentMarker,
      `# Utility Reel cycle: ${cycleId}`,
      "",
      "This queue record is created only after the owner marks a GitHub Issue Form intake ready.",
      "GitHub Actions only creates or updates Issues. Codex automation performs the validated generation after privacy and human-review gates pass.",
      `- Intake Issue: #${intakeIssueNumber}`,
      `- Cycle ID: \`${cycleId}\``,
      `- Queue workflow run: ${runUrl}`,
      "- Original, clean review copy, and redaction report follow the 90-day retention contract.",
      "- Automatic publication is out of scope.",
    ].join("\n"),
  }];
  for (let week = 1; week <= 3; week += 1) {
    const marker = `<!-- codex-social-utility:${cycleId}:week:${week} -->`;
    const dependency = week === 1 ? "- Dependency: none; start only after the intake Issue is owner-approved." : `- Dependency: wait for Utility Reel week ${week - 1} to close.\n- CODEX_DEPENDS_ON_UTILITY_WEEK:${week - 1}`;
    issues.push({
      kind: `utility-week-${week}`,
      week,
      key: `utility:${cycleId}:week:${week}`,
      title: `[Utility Reel] ${cycleId} week ${week}`,
      labels: ["type: feature", SOCIAL_LABELS.utilityReel, SOCIAL_LABELS.utility, week === 1 ? SOCIAL_LABELS.ready : SOCIAL_LABELS.blocked],
      marker,
      body: [
        marker,
        `# Utility Reel week ${week}: ${cycleId}`,
        "",
        "Codex automation is the production worker. GitHub Actions does not diagnose, render, or publish student material.",
        `- Intake Issue: #${intakeIssueNumber}`,
        `- Cycle ID: \`${cycleId}\``,
        dependency,
        "- Production command: `npm run social:utility-reels -- --input examples/utility-reel-intake.example.json`",
        "- Preserve checksum, privacy, clean-copy, redaction-report, mathematics, layout, and human-QA gates.",
      ].join("\n"),
    });
  }
  return baseResult([], issues);
}
