import fs from "node:fs/promises";
import path from "node:path";

export const DISPOSITIONS = Object.freeze(["close_duplicate", "backlog", "blocked", "preserve_closed", "review_required"]);

function labelsFor(issue) {
  return (issue?.labels || []).map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}

function markersFor(issue) {
  if (Array.isArray(issue?.bodyMarkers)) return issue.bodyMarkers;
  return [...String(issue?.body || "").matchAll(/<!--\s*([^<>\n]+?)\s*-->/g)].map((match) => match[1].trim()).filter(Boolean);
}

export function classifyIssue(issue, context = {}) {
  const number = Number(issue?.number);
  const labels = labelsFor(issue);
  const markers = markersFor(issue);
  const markerOwners = context.markerOwners || {};
  const duplicateMarker = markers.find((marker) => markerOwners[marker] && Number(markerOwners[marker]) !== number);
  if (duplicateMarker) return {
    disposition: "close_duplicate",
    reason: "A stable marker is already owned by another Issue.",
    evidence: [`marker: ${duplicateMarker}`, `replacementIssue: ${markerOwners[duplicateMarker]}`],
    replacement: { issueNumber: Number(markerOwners[duplicateMarker]) },
  };
  if (String(issue?.state).toLowerCase() === "closed") return {
    disposition: "preserve_closed",
    reason: "Issue is closed historical evidence and is preserved.",
    evidence: ["state: closed"],
    replacement: null,
  };
  if (labels.some((label) => /status:\s*blocked|blocked/i.test(label)) || /CODEX_(?:DEPENDS|DEPENDENCY)_/i.test(issue?.body || "")) return {
    disposition: "blocked",
    reason: "Issue contains an explicit dependency or blocked status.",
    evidence: [...labels.filter((label) => /blocked/i.test(label)), ...markers.filter((marker) => /CODEX_(?:DEPENDS|DEPENDENCY)_/i.test(marker))],
    replacement: null,
  };
  if (Array.isArray(context.backlogNumbers) && context.backlogNumbers.map(Number).includes(number)) return {
    disposition: "backlog",
    reason: "Owner-provided triage context explicitly marks this Issue for backlog.",
    evidence: [`context.backlogNumbers includes issue #${number}`],
    replacement: null,
  };
  return {
    disposition: "review_required",
    reason: "No explicit duplicate, backlog, blocked, or closed evidence was found.",
    evidence: markers.map((marker) => `marker: ${marker}`),
    replacement: null,
  };
}

export function buildDispositionReport(issues, context = {}) {
  return {
    requiresHumanReview: true,
    generatedAt: new Date().toISOString(),
    dispositions: (issues || []).map((issue) => ({ issue: { number: issue.number, title: issue.title, state: issue.state }, ...classifyIssue(issue, context) })),
    reviewNote: "No close or backlog mutation is authorized until the owner approves each disposition.",
  };
}

export async function writeDispositionReport(report, outputPath) {
  if (!outputPath) throw new Error("outputPath is required");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputPath;
}
