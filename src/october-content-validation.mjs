import { calculateEquation } from "./content-validation.mjs";

const LEVELS = ["level1", "level2", "level3"];
const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
  "nineteen", "twenty",
];

export function validateOctoberContent(content, research = null) {
  const contentErrors = [];
  const mathematicsErrors = [];
  const days = Array.isArray(content?.days) ? content.days : [];
  const sources = Array.isArray(content?.sources) ? content.sources : [];

  validateCalendarCoverage(content, days, contentErrors);
  validateDailyContent(days, sources, contentErrors);
  validateResearchAlignment(days, research, contentErrors);
  validatePromptDiversity(days, contentErrors);
  validateMathematics(days, mathematicsErrors);

  return {
    valid: contentErrors.length === 0 && mathematicsErrors.length === 0,
    content: { valid: contentErrors.length === 0, errors: contentErrors },
    mathematics: { valid: mathematicsErrors.length === 0, errors: mathematicsErrors },
    sources: { valid: true, checked: false, errors: [], results: [] },
  };
}

export async function validateOctoberSources(content, fetchImpl = globalThis.fetch) {
  const results = [];
  const errors = [];
  const sources = Array.isArray(content?.sources) ? content.sources : [];

  if (typeof fetchImpl !== "function") {
    return { valid: false, checked: true, errors: ["fetch is unavailable; source URLs were not checked"], results };
  }

  for (const source of sources) {
    const result = { id: source?.id, url: source?.url };
    try {
      const response = await fetchImpl(source.url, {
        redirect: "follow",
        headers: { "user-agent": "math-agentic-workflow/1.0" },
      });
      result.status = response.status;
      result.finalUrl = response.url;
      result.ok = response.ok;
      if (!response.ok) errors.push(`${source.id} source returned HTTP ${response.status}`);
      await response.body?.cancel();
    } catch (error) {
      result.error = `${error.name}: ${error.message}`;
      result.ok = false;
      errors.push(`${source?.id ?? "unknown source"} source request failed: ${result.error}`);
    }
    results.push(result);
  }

  return { valid: errors.length === 0, checked: true, errors, results };
}

function validateCalendarCoverage(content, days, errors) {
  if (content?.schemaVersion !== "2.0.0") errors.push("schemaVersion must be 2.0.0");
  if (content?.month !== 10) errors.push("month must be 10 for the October artifact");
  const dayNumbers = days.map((day) => day?.day);
  const expected = Array.from({ length: 31 }, (_, index) => index + 1);
  if (JSON.stringify(dayNumbers) !== JSON.stringify(expected)) {
    errors.push("October days must appear exactly once in ascending order from 1 through 31");
  }
}

function validateDailyContent(days, sources, errors) {
  const sourceIds = new Set(sources.map((source) => source?.id));
  if (sources.length === 0) errors.push("sources must not be empty");
  for (const day of days) {
    const key = dateKey(day);
    const passage = typeof day?.readingPassage === "string" ? day.readingPassage : "";
    const words = passage.trim().split(/\s+/).filter(Boolean).length;
    if (words < 150 || words > 250) errors.push(`${key} reading passage has ${words} words, expected 150-250`);
    if (!passage.trim().split(/\n\s*\n/)[0].includes("?")) errors.push(`${key} reading passage does not begin with a child-friendly question`);
    if (!Array.isArray(day?.sourceIds) || day.sourceIds.length === 0) errors.push(`${key} has no source ID`);
    for (const sourceId of day?.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) errors.push(`${key} cites unknown source ${sourceId}`);
    }
    for (const level of LEVELS) {
      const task = day?.mathLevels?.[level];
      if (!task?.prompt) errors.push(`${key} ${level} prompt is empty`);
      for (const number of task?.numbersUsed ?? []) {
        if (!numberAppearsInText(number?.value, `${passage} ${task.prompt}`)) {
          errors.push(`${key} ${level} number ${number?.value} is not present in the passage or prompt`);
        }
      }
    }
  }
}

function validatePromptDiversity(days, errors) {
  for (const level of LEVELS) {
    const groups = new Map();
    for (const day of days) {
      const prompt = day?.mathLevels?.[level]?.prompt;
      if (!prompt) continue;
      const group = groups.get(prompt) ?? [];
      group.push(dateKey(day));
      groups.set(prompt, group);
    }
    for (const [prompt, dates] of groups) {
      if (dates.length > 1) {
        errors.push(`${level} prompt is duplicated across ${dates.length} days (${dates.join(", ")}); math context must be independently tied to each historical entry: ${prompt}`);
      }
    }
  }
}

function validateResearchAlignment(days, research, errors) {
  if (!research) return;
  const records = new Map((research.records ?? []).map((record) => [record.day, record]));
  for (const day of days) {
    const record = records.get(day?.day);
    const key = dateKey(day);
    if (!record) {
      errors.push(`${key} is missing from the research artifact`);
      continue;
    }
    if (day.title !== record.title) errors.push(`${key} title does not match the research artifact`);
    if (day.eventYear !== (record.eventYear ?? null)) errors.push(`${key} eventYear does not match the research artifact`);
    if (day.theme !== record.theme) errors.push(`${key} theme does not match the research artifact`);
    if (JSON.stringify(day.sourceIds ?? []) !== JSON.stringify(record.sourceIds ?? [])) errors.push(`${key} sourceIds do not match the research artifact`);
    const story = normalizeText(`${day.readingPassage ?? ""} ${(day.trivia ?? []).join(" ")}`);
    if (!story.includes(normalizeText(record.claim))) errors.push(`${key} research claim is not preserved in reading passage or trivia`);
  }
}

function validateMathematics(days, errors) {
  for (const day of days) {
    const key = dateKey(day);
    for (const level of LEVELS) {
      const answer = day?.answers?.[level];
      const calculation = calculateEquation(answer?.equation ?? "");
      if (!calculation.valid || Math.abs(calculation.left - calculation.right) > 1e-9) {
        errors.push(`${key} ${level} equation evaluates incorrectly: ${answer?.equation ?? "missing"}`);
        continue;
      }
      if (!containsNumber(answer?.finalAnswer, calculation.left)) {
        errors.push(`${key} ${level} final answer does not contain ${calculation.left}`);
      }
    }
  }
}

function dateKey(day) {
  return `${String(day?.month ?? 10).padStart(2, "0")}-${String(day?.day ?? "??").padStart(2, "0")}`;
}

function numberAppearsInText(value, text) {
  if (!Number.isFinite(value)) return false;
  const numeric = new RegExp(`(?<![\\d.])${escapeRegExp(String(value))}(?![\\d.])`).test(text);
  const word = Number.isInteger(value) && value >= 0 && value < NUMBER_WORDS.length ? new RegExp(`\\b${NUMBER_WORDS[value]}\\b`, "i").test(text) : false;
  return numeric || word;
}

function containsNumber(text, value) {
  return typeof text === "string" && (new RegExp(`(?<![\\d.])${escapeRegExp(String(value))}(?![\\d.])`).test(text) || (Number.isInteger(value) && value >= 0 && value < NUMBER_WORDS.length && new RegExp(`\\b${NUMBER_WORDS[value]}\\b`, "i").test(text)));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value).replace(/[ *_]/g, "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
}
