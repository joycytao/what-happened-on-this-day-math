import { calculateEquation } from "./content-validation.mjs";

const THEMES = new Set(["inventions_daily_life", "animals_dinosaurs", "incredible_challenges"]);
const LEVELS = ["level1", "level2", "level3"];

export function validateMonthlyContentV2(content) {
  const errors = [];
  if (!content || typeof content !== "object" || Array.isArray(content)) return { valid: false, errors: ["content must be an object"] };
  if (content.schemaVersion !== "2.0.0") errors.push("schemaVersion must be 2.0.0");
  if (!Number.isInteger(content.month) || content.month < 1 || content.month > 12) errors.push("month must be an integer from 1 to 12");
  if (content.month !== 10) errors.push("October artifact must use month 10");
  if (!Array.isArray(content.days) || content.days.length !== 31) errors.push("days must contain exactly 31 October records");
  if (!Array.isArray(content.sources) || content.sources.length === 0) errors.push("sources must be a non-empty array");
  const sourceIds = new Set((content.sources || []).map((source) => source?.id));
  const seen = new Set();
  for (const [index, day] of (content.days || []).entries()) {
    const path = `days[${index}]`;
    if (!day || typeof day !== "object") { errors.push(`${path} must be an object`); continue; }
    if (day.month !== content.month) errors.push(`${path}.month must equal top-level month`);
    if (!Number.isInteger(day.day) || day.day < 1 || day.day > 31) errors.push(`${path}.day must be 1..31`);
    if (seen.has(day.day)) errors.push(`${path}.day is duplicated: ${day.day}`);
    seen.add(day.day);
    if (Object.hasOwn(day, "date")) errors.push(`${path} must not contain a year-bearing date field`);
    if (!(day.eventYear === null || (Number.isInteger(day.eventYear) && day.eventYear > 0))) errors.push(`${path}.eventYear must be a positive integer or null`);
    if (day.eventYear === null && typeof day.eventYearNote !== "string") errors.push(`${path}.eventYearNote is required for null eventYear`);
    for (const field of ["emoji", "title", "hook", "readingPassage"]) if (typeof day[field] !== "string" || !day[field].trim()) errors.push(`${path}.${field} must not be empty`);
    const words = typeof day.readingPassage === "string" ? day.readingPassage.trim().split(/\s+/).filter(Boolean).length : 0;
    if (words < 150 || words > 250) errors.push(`${path}.readingPassage must contain 150-250 words; found ${words}`);
    if (typeof day.readingPassage === "string" && !day.readingPassage.trim().split(/\n\s*\n/)[0].includes("?")) errors.push(`${path}.readingPassage must begin with a child-friendly question`);
    if (!THEMES.has(day.theme)) errors.push(`${path}.theme is not approved`);
    if (!Array.isArray(day.sourceIds) || day.sourceIds.length === 0) errors.push(`${path}.sourceIds must be non-empty`);
    for (const sourceId of day.sourceIds || []) if (!sourceIds.has(sourceId)) errors.push(`${path}.sourceIds cites unknown source: ${sourceId}`);
    for (const level of LEVELS) {
      const task = day.mathLevels?.[level];
      const answer = day.answers?.[level];
      if (!task || task.pageType !== level || typeof task.prompt !== "string" || !task.prompt.trim()) errors.push(`${path}.mathLevels.${level} is invalid`);
      if (!Array.isArray(task?.numbersUsed) || task.numbersUsed.length === 0) errors.push(`${path}.mathLevels.${level}.numbersUsed must be non-empty`);
      if (!answer || typeof answer.equation !== "string" || typeof answer.work !== "string" || typeof answer.finalAnswer !== "string") errors.push(`${path}.answers.${level} is invalid`);
      const calculation = answer?.equation ? calculateEquation(answer.equation) : { valid: false };
      if (!calculation.valid || Math.abs(calculation.left - calculation.right) > 1e-9) errors.push(`${path}.answers.${level}.equation must evaluate correctly`);
      if (!Array.isArray(day.answerKeyEntries) || !day.answerKeyEntries.includes(`${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}:${level}`)) errors.push(`${path}.answerKeyEntries is missing ${level}`);
    }
  }
  const expectedDays = Array.from({ length: 31 }, (_, index) => index + 1);
  if (JSON.stringify([...seen].sort((a, b) => a - b)) !== JSON.stringify(expectedDays)) errors.push("days must cover October 1..31 exactly once");
  return { valid: errors.length === 0, errors };
}
