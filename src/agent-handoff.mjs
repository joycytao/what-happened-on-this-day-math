export const HANDOFF_MARKER = "<!-- CODEX_HANDOFF:v1 -->";

export const AGENT_ROLES = Object.freeze([
  "pm-triage",
  "product-manager",
  "architect",
  "social-expert",
  "developer",
  "quality-engineer",
]);

export const HANDOFF_STATUSES = Object.freeze([
  "requested",
  "accepted",
  "completed",
  "blocked",
  "rejected",
]);

const FIELD_DEFINITIONS = Object.freeze([
  ["handoffId", "Handoff ID"],
  ["from", "From"],
  ["to", "To"],
  ["workItem", "Work item"],
  ["status", "Status"],
  ["completed", "Completed"],
  ["requiredNextAction", "Required next action"],
  ["evidence", "Evidence"],
  ["constraints", "Constraints"],
  ["blockers", "Blockers"],
  ["expectedOutput", "Expected output"],
]);

const LIST_FIELDS = new Set(FIELD_DEFINITIONS.filter(([, label]) => !["Handoff ID", "From", "To", "Work item", "Status"].includes(label)).map(([key]) => key));
const SCALAR_FIELDS = new Set(FIELD_DEFINITIONS.filter(([key]) => !LIST_FIELDS.has(key)).map(([key]) => key));

function emptyResult(errors = []) {
  return { valid: errors.length === 0, errors };
}

function unquote(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.replace(/^`(.*)`$/, "$1").trim();
}

function parseFields(markdown) {
  const lines = String(markdown ?? "").replaceAll("\r\n", "\n").split("\n");
  const values = Object.fromEntries(FIELD_DEFINITIONS.map(([key]) => [key, LIST_FIELDS.has(key) ? [] : ""]));
  const labels = new Map(FIELD_DEFINITIONS.map(([key, label]) => [label, key]));
  let currentList = null;

  for (const line of lines) {
    const scalar = line.match(/^- ([^:]+):\s*(.*)$/);
    if (scalar && labels.has(scalar[1])) {
      const key = labels.get(scalar[1]);
      if (SCALAR_FIELDS.has(key)) values[key] = unquote(scalar[2]);
      currentList = LIST_FIELDS.has(key) ? key : null;
      continue;
    }
    const listItem = line.match(/^\s{2}-\s*(.*)$/);
    if (listItem && currentList) values[currentList].push(unquote(listItem[1]));
  }
  return values;
}

export function validateHandoff(handoff) {
  const errors = [];
  if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) return emptyResult(["handoff_invalid"]);

  for (const field of ["handoffId", "from", "to", "workItem", "status"]) {
    if (typeof handoff[field] !== "string" || !handoff[field].trim()) errors.push(`${field}_missing`);
  }
  for (const field of LIST_FIELDS) {
    if (!Array.isArray(handoff[field])) errors.push(`${field}_invalid`);
    else if (handoff[field].length === 0 || handoff[field].some((item) => typeof item !== "string" || !item.trim())) errors.push(`${field}_empty`);
  }
  if (handoff.from && !AGENT_ROLES.includes(handoff.from)) errors.push("from_role_invalid");
  if (handoff.to && !AGENT_ROLES.includes(handoff.to)) errors.push("to_role_invalid");
  if (handoff.status && !HANDOFF_STATUSES.includes(handoff.status)) errors.push("status_invalid");
  if (handoff.workItem && !/^[^/\s]+\/[^#\s]+#\d+$/.test(handoff.workItem)) errors.push("work_item_invalid");
  if (handoff.requiredNextAction?.some((item) => !item.trim())) errors.push("required_next_action_empty");
  return emptyResult([...new Set(errors)]);
}

export function parseHandoff(markdown) {
  const source = String(markdown ?? "");
  const errors = [];
  if (!source.includes(HANDOFF_MARKER)) errors.push("marker_missing");
  const handoff = parseFields(source);
  const validation = validateHandoff(handoff);
  errors.push(...validation.errors);
  return { valid: errors.length === 0, errors: [...new Set(errors)], ...(errors.length === 0 ? { handoff } : { handoff }) };
}

export function findDuplicateHandoffIds(handoffs) {
  const seen = new Set();
  const duplicates = [];
  for (const handoff of handoffs ?? []) {
    const id = handoff?.handoffId;
    if (!id) continue;
    if (seen.has(id) && !duplicates.includes(id)) duplicates.push(id);
    seen.add(id);
  }
  return duplicates;
}

function renderList(label, values) {
  return [`- ${label}:`, ...(values ?? []).map((value) => `  - ${value}`)];
}

export function renderHandoff(handoff) {
  const validation = validateHandoff(handoff);
  if (!validation.valid) throw new Error(`Cannot render invalid handoff: ${validation.errors.join(", ")}`);
  const lines = [HANDOFF_MARKER, "", "## Handoff", ""];
  const scalar = new Map([
    ["Handoff ID", handoff.handoffId],
    ["From", handoff.from],
    ["To", handoff.to],
    ["Work item", handoff.workItem],
    ["Status", handoff.status],
  ]);
  for (const [label, value] of scalar) lines.push(`- ${label}: \`${value}\``);
  lines.push(...renderList("Completed", handoff.completed));
  lines.push(...renderList("Required next action", handoff.requiredNextAction));
  lines.push(...renderList("Evidence", handoff.evidence));
  lines.push(...renderList("Constraints", handoff.constraints));
  lines.push(...renderList("Blockers", handoff.blockers));
  lines.push(...renderList("Expected output", handoff.expectedOutput));
  return `${lines.join("\n")}\n`;
}
