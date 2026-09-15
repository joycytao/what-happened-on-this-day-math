import { calculateEquation } from "./content-validation.mjs";

const LEVELS = ["level1", "level2", "level3"];

export function validateExampleDrivenContent(content) {
  const errors = [];
  const days = Array.isArray(content?.days) ? content.days : [];
  for (const level of LEVELS) {
    const prompts = new Map();
    for (const day of days) {
      const key = `${day?.month ?? "?"}-${String(day?.day ?? "?").padStart(2, "0")}`;
      const task = day?.mathLevels?.[level];
      const prompt = typeof task?.prompt === "string" ? task.prompt.trim() : "";
      if (!prompt) errors.push(`${key} ${level} prompt is empty`);
      if (/[㐀-鿿]/.test(prompt)) errors.push(`${key} ${level} prompt is not English`);
      if (!prompt.includes("?")) errors.push(`${key} ${level} prompt must ask a question`);
      if (/\b(the same|generic|this story) (numbers?|problem|question)\b/i.test(prompt)) errors.push(`${key} ${level} prompt uses generic scaffolding`);
      const dates = prompts.get(prompt) ?? [];
      dates.push(key);
      prompts.set(prompt, dates);
      const answer = day?.answers?.[level];
      const equations = String(answer?.equation ?? "").split(/\s*;\s*/).filter(Boolean);
      for (const equation of equations) {
        if (/remainder/i.test(equation)) continue;
        const result = calculateEquation(equation);
        if (!result.valid || Math.abs(result.left - result.right) > 1e-3) errors.push(`${key} ${level} equation is incorrect: ${equation}`);
      }
      for (const number of task?.numbersUsed ?? []) {
        const source = String(number?.source ?? "");
        const story = `${day?.readingPassage ?? ""} ${prompt}`;
        if (!numberAppears(number?.value, story) && !/hypothetical|conversion/i.test(source)) errors.push(`${key} ${level} number ${number?.value} lacks passage or task provenance`);
      }
    }
    for (const [prompt, dates] of prompts) if (dates.length > 1) errors.push(`${level} prompt is duplicated on ${dates.join(", ")}: ${prompt}`);
  }
  return { valid: errors.length === 0, errors };
}

function numberAppears(value, text) {
  if (!Number.isFinite(value)) return false;
  return new RegExp(`(?<![0-9])${String(value).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?![0-9])`).test(text);
}
