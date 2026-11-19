import { generateMonthDates } from "./calendar-pages.mjs";
import { calculateEquation, containsNumber, validateContent } from "./content-validation.mjs";
import { validateMonthlyCsv } from "./monthly-csv-validation.mjs";

const LEVELS = ["level1", "level2", "level3"];
const STUDENT_FIELDS = ["title", "hook", "readingPassage", "trivia"];
const CJK_PATTERN = /[\u3400-\u9fff]/u;

export function validateMonthlyMath({ content, csv, source }) {
  const errors = [];
  const contentResult = validateContent(content);
  const csvResult = validateMonthlyCsv(csv);
  errors.push(...contentResult.errors.map((error) => `content: ${error}`));
  errors.push(...csvResult.errors.map((error) => `csv: ${error}`));

  const month = content?.month;
  const expectedDates = month ? safeMonthDates(month, errors) : [];
  const expectedDateSet = new Set(expectedDates);
  const contentDates = Array.isArray(content?.days) ? content.days.map((day) => day?.date) : [];
  const sourceDates = normalizeSourceDates(source, month, errors);
  const sourceDateSet = new Set(sourceDates);

  if (month && expectedDates.length > 0 && contentDates.length !== expectedDates.length) {
    errors.push(`content must contain ${expectedDates.length} days; found ${contentDates.length}`);
  }
  for (const date of expectedDates) {
    if (!contentDates.includes(date)) errors.push(`content is missing ${date}`);
    if (!sourceDateSet.has(date)) errors.push(`raw source is missing ${date}`);
  }
  for (const date of contentDates) {
    if (date && !expectedDateSet.has(date)) errors.push(`content contains unexpected date ${date}`);
  }

  let equationsChecked = 0;
  let studentFacingFieldsChecked = 0;
  let provenanceMappingsChecked = 0;
  for (const [dayIndex, day] of (content?.days || []).entries()) {
    if (!day || typeof day !== "object") continue;
    for (const field of STUDENT_FIELDS) {
      const values = Array.isArray(day[field]) ? day[field] : [day[field]];
      for (const value of values) {
        studentFacingFieldsChecked += 1;
        if (typeof value === "string" && CJK_PATTERN.test(value)) {
          errors.push(`days[${dayIndex}].${field} contains non-English CJK text`);
        }
      }
    }
    for (const level of LEVELS) {
      const answer = day.answers?.[level];
      if (!answer || typeof answer !== "object") continue;
      const equations = [answer.equation, ...String(answer.work || "").split(";")]
        .map((equation) => equation.trim())
        .filter(Boolean);
      for (const equation of equations) {
        const calculation = calculateEquation(equation);
        equationsChecked += 1;
        if (!calculation.valid) {
          errors.push(`days[${dayIndex}].answers.${level} invalid equation ${JSON.stringify(equation)}: ${calculation.error}`);
          continue;
        }
        if (Math.abs(calculation.left - calculation.right) >= 1e-9) {
          errors.push(`days[${dayIndex}].answers.${level} equation does not balance: ${equation}`);
        }
      }
      const finalEquation = equations.at(-1);
      if (finalEquation) {
        const calculation = calculateEquation(finalEquation);
        if (calculation.valid && !containsNumber(answer.finalAnswer, calculation.left)) {
          errors.push(`days[${dayIndex}].answers.${level}.finalAnswer omits ${formatNumber(calculation.left)}`);
        }
      }
    }
    if (day.sourceIds?.length && sourceDateSet.has(day.date)) provenanceMappingsChecked += 1;
  }

  return {
    valid: errors.length === 0,
    errors,
    report: {
      month: month || null,
      expectedDays: expectedDates.length || null,
      contentDays: contentDates.length,
      csvRows: csvResult.report?.rowCount ?? null,
      sourceDays: sourceDates.length,
      equationsChecked,
      studentFacingFieldsChecked,
      provenanceMappingsChecked,
    },
  };
}

function normalizeSourceDates(source, month, errors) {
  if (!source || typeof source !== "object" || !Array.isArray(source.days)) {
    errors.push("raw source must contain a days array");
    return [];
  }
  if (month && source.month !== month) errors.push(`raw source month ${source.month} does not match ${month}`);
  return source.days.map((day, index) => {
    const match = typeof day?.date === "string" ? day.date.match(/^(\d{1,2})\/(\d{1,2})$/) : null;
    if (!match || !month) {
      errors.push(`raw source days[${index}].date must use M/D and match the target month`);
      return null;
    }
    return `${month}-${String(Number(match[2])).padStart(2, "0")}`;
  }).filter(Boolean);
}

function safeMonthDates(month, errors) {
  const match = /^(\d{4})-(\d{2})$/.exec(month || "");
  if (!match) {
    errors.push(`month must use YYYY-MM; found ${month}`);
    return [];
  }
  try {
    return generateMonthDates(Number(match[1]), Number(match[2]));
  } catch (error) {
    errors.push(`month is invalid: ${error.message}`);
    return [];
  }
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}
