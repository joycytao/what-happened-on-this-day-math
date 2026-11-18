export const LEGAL_DECISION_OWNERS = new Set([
  "pm-triage",
  "product-manager",
  "architect",
  "social-expert",
  "developer",
  "quality-engineer",
]);

const REQUIRED_SKILL_SECTIONS = [
  "## Mission",
  "## Inputs",
  "## Authority",
  "## Forbidden actions",
  "## Legal outputs",
  "## Completion criteria",
  "## Return paths",
];

const CANONICAL_OUTPUTS = [
  "state: decision-requested",
  "status: blocked",
  "status: ready to pickup",
  "ready-for-human",
];

const DECISION_COLUMNS = ["id", "question", "type", "blocking", "owner", "consulted", "status"];
const QUESTION_TYPES = new Set(["product", "architecture", "implementation", "domain", "quality", "process"]);
const DECISION_STATUSES = new Set(["open", "decided", "non-blocking"]);

function splitTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}

export function parseDecisionRegister(markdown = "") {
  const lines = String(markdown).replaceAll("\r\n", "\n").split("\n");
  const heading = lines.findIndex((line) => /^###\s+Decision Register\s*$/i.test(line.trim()));
  if (heading < 0) return { valid: false, rows: [], errors: ["decision register heading missing"] };

  const headerIndex = lines.findIndex((line, index) => index > heading && splitTableRow(line)?.length === DECISION_COLUMNS.length);
  if (headerIndex < 0) return { valid: false, rows: [], errors: ["decision register table header missing"] };

  const header = splitTableRow(lines[headerIndex]).map((cell) => cell.toLowerCase());
  const normalizedHeader = header.map((cell) => cell.replaceAll(" ", "_"));
  const expectedHeader = ["id", "question", "type", "blocking", "decision_owner", "consulted", "status"];
  if (normalizedHeader.join("|") !== expectedHeader.join("|")) {
    return { valid: false, rows: [], errors: ["decision register columns must be ID, Question, Type, Blocking, Decision Owner, Consulted, Status"] };
  }

  const rows = [];
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const cells = splitTableRow(lines[index]);
    if (!cells) break;
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    if (cells.length !== DECISION_COLUMNS.length) continue;
    const [id, question, type, blocking, owner, consulted, status] = cells;
    rows.push({ id, question, type: type.toLowerCase(), blocking: blocking.toLowerCase(), owner, consulted, status: status.toLowerCase() });
  }
  return { valid: true, rows, errors: [] };
}

export function validateDecisionRegister(markdown = "", { recommendReadyToPickup = false } = {}) {
  const parsed = parseDecisionRegister(markdown);
  const errors = [...parsed.errors];
  const seenIds = new Set();
  for (const row of parsed.rows) {
    if (!row.id) errors.push("decision id is empty");
    if (seenIds.has(row.id)) errors.push(`duplicate decision id: ${row.id}`);
    seenIds.add(row.id);
    if (!row.question) errors.push(`decision ${row.id} question is empty`);
    if (!QUESTION_TYPES.has(row.type)) errors.push(`decision ${row.id} has unsupported type: ${row.type}`);
    if (!["yes", "no"].includes(row.blocking)) errors.push(`decision ${row.id} blocking must be yes or no`);
    if (!LEGAL_DECISION_OWNERS.has(row.owner)) errors.push(`decision ${row.id} has a non-canonical owner: ${row.owner}`);
    if (!DECISION_STATUSES.has(row.status)) errors.push(`decision ${row.id} has unsupported status: ${row.status}`);
  }
  if (parsed.rows.length === 0) errors.push("decision register must contain at least one question");
  if (recommendReadyToPickup && parsed.rows.some((row) => row.blocking === "yes" && row.status === "open")) {
    errors.push("cannot recommend ready to pickup while blocking decisions are open");
  }
  return { valid: errors.length === 0, rows: parsed.rows, errors: [...new Set(errors)] };
}

export function validatePmTriageSkill(markdown = "") {
  const source = String(markdown);
  const errors = [];
  for (const section of REQUIRED_SKILL_SECTIONS) {
    if (!source.includes(section)) errors.push(`skill section missing: ${section}`);
  }
  for (const output of CANONICAL_OUTPUTS) {
    if (!source.includes(output)) errors.push(`skill output missing: ${output}`);
  }
  if (/\btpt-expert\b/i.test(source)) errors.push("skill names non-canonical owner: tpt-expert");
  if (/\bneeds clarification\b/i.test(source)) errors.push("skill names non-canonical outcome: needs clarification");
  if (!/must not[\s\S]{0,240}(product|architecture|domain|implementation|quality|release)/i.test(source)) {
    errors.push("skill must state that PM triage does not make domain decisions");
  }
  if (!/exactly one[\s\S]{0,160}(owner|decision owner)/i.test(source)) errors.push("skill must require exactly one owner");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
