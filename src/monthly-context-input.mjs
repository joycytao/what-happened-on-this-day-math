const MARKER_PATTERN = /<!--\s*monthly-content-input:\s*(\d{4})-(\d{2})\s*-->/i;
const JSON_FENCE_PATTERN = /```json\s*([\s\S]*?)```/i;
const LEVELS = ["level1", "level2", "level3"];

export function expectedDaysInMonth(year, month) {
  return new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
}

export function targetMonthFromSchedulerDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("scheduler date must be valid");
  const sourceYear = date.getUTCFullYear();
  const sourceMonth = date.getUTCMonth() + 1;
  const target = new Date(Date.UTC(sourceYear, sourceMonth + 1, 1));
  const month = target.getUTCMonth() + 1;
  return { year: target.getUTCFullYear(), month, isoMonth: `${target.getUTCFullYear()}-${String(month).padStart(2, "0")}` };
}

function validateInput(input, markerYear, markerMonth) {
  const errors = [];
  const markerIso = `${markerYear}-${String(markerMonth).padStart(2, "0")}`;
  if (!input || typeof input !== "object" || Array.isArray(input)) return ["input must be a JSON object"];
  if (input.month !== markerIso) errors.push(`month must be ${markerIso}`);
  if (!Array.isArray(input.days)) return [...errors, "days must be an array"];

  const expected = expectedDaysInMonth(markerYear, markerMonth);
  if (input.days.length !== expected) errors.push(`expected ${expected} days, found ${input.days.length}`);
  const seen = new Set();
  for (const [index, day] of input.days.entries()) {
    const prefix = `days[${index}]`;
    if (!day || typeof day !== "object") {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (typeof day.date !== "string") errors.push(`${prefix}.date is required`);
    else {
      const match = day.date.match(/^(\d{1,2})\/(\d{1,2})$/);
      const dayMonth = match ? Number(match[1]) : NaN;
      const dayNumber = match ? Number(match[2]) : NaN;
      if (!match || dayMonth !== markerMonth || dayNumber < 1 || dayNumber > expected) errors.push(`${prefix}.date must be a valid ${markerIso} date`);
      else if (seen.has(day.date)) errors.push(`duplicate date: ${day.date}`);
      else seen.add(day.date);
    }
    for (const field of ["title", "context"]) if (typeof day[field] !== "string" || !day[field].trim()) errors.push(`${prefix}.${field} is required`);
    if (!day.questions || typeof day.questions !== "object") {
      errors.push(`${prefix}.questions is required`);
      continue;
    }
    for (const level of LEVELS) {
      const question = day.questions[level];
      if (!question || typeof question !== "object") errors.push(`${prefix}.questions.${level} is required`);
      else {
        if (typeof question.prompt !== "string" || !question.prompt.trim()) errors.push(`${prefix}.questions.${level}.prompt is required`);
        if (typeof question.answer !== "string" || !question.answer.trim()) errors.push(`${prefix}.questions.${level}.answer is required`);
      }
    }
  }
  return errors;
}

export function parseMonthlyContextComment(comments) {
  const candidates = Array.isArray(comments) ? [...comments].reverse() : [];
  for (const comment of candidates) {
    const body = typeof comment?.body === "string" ? comment.body : "";
    const marker = body.match(MARKER_PATTERN);
    if (!marker) continue;
    const json = body.match(JSON_FENCE_PATTERN);
    if (!json) return { valid: false, input: null, commentId: comment.id ?? null, errors: ["comment must contain a ```json fenced block"] };
    let input;
    try {
      input = JSON.parse(json[1]);
    } catch {
      return { valid: false, input: null, commentId: comment.id ?? null, errors: ["comment must contain valid JSON"] };
    }
    const errors = validateInput(input, Number(marker[1]), Number(marker[2]));
    return { valid: errors.length === 0, input: errors.length === 0 ? input : null, commentId: comment.id ?? null, errors };
  }
  return { valid: false, input: null, commentId: null, errors: ["no marked monthly content input comment found"] };
}
