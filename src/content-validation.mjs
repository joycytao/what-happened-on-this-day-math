const APPROVED_THEMES = new Set([
  "inventions_daily_life",
  "animals_dinosaurs",
  "incredible_challenges",
]);

const REQUIRED_DAILY_FIELDS = [
  "date",
  "emoji",
  "theme",
  "title",
  "hook",
  "readingPassage",
  "trivia",
  "mathLevels",
  "answers",
  "answerKeyEntries",
  "sourceIds",
];

const LEVELS = ["level1", "level2", "level3"];

export function validateContent(content) {
  const errors = [];

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return { valid: false, errors: ["monthly content must be an object"] };
  }

  requireValue(content, "schemaVersion", errors);
  requireValue(content, "month", errors);
  requireValue(content, "days", errors);
  requireValue(content, "answerKey", errors);
  requireValue(content, "sources", errors);

  if (content.schemaVersion !== "1.0.0") {
    errors.push("schemaVersion must be 1.0.0");
  }
  if (!isMonth(content.month)) {
    errors.push("month must use YYYY-MM and be a real calendar month");
  }

  const sources = validateSources(content.sources, errors);
  const days = Array.isArray(content.days) ? content.days : [];
  if (!Array.isArray(content.days) || days.length === 0) {
    errors.push("days must contain at least one daily record");
  }

  const seenDates = new Set();
  days.forEach((day, index) => {
    validateDailyRecord(day, index, content.month, sources, content.answerKey, errors, seenDates);
  });

  validateAnswerKey(content.answerKey, days, errors);

  return { valid: errors.length === 0, errors };
}

function validateDailyRecord(day, index, month, sources, answerKey, errors, seenDates) {
  const path = `days[${index}]`;
  if (!day || typeof day !== "object" || Array.isArray(day)) {
    errors.push(`${path} must be an object`);
    return;
  }

  for (const field of REQUIRED_DAILY_FIELDS) {
    requireValue(day, field, errors, path);
  }

  if (!isDate(day.date)) {
    errors.push(`${path}.date must be a real date in YYYY-MM-DD format`);
  } else {
    if (month && !day.date.startsWith(`${month}-`)) {
      errors.push(`${path}.date must be inside month ${month}`);
    }
    if (seenDates.has(day.date)) {
      errors.push(`${path}.date is duplicated: ${day.date}`);
    }
    seenDates.add(day.date);
  }

  if (typeof day.emoji !== "string" || Array.from(day.emoji).length !== 1) {
    errors.push(`${path}.emoji must contain exactly one emoji`);
  }
  if (!APPROVED_THEMES.has(day.theme)) {
    errors.push(`${path}.theme must use an approved theme`);
  }
  for (const field of ["title", "hook", "readingPassage"]) {
    if (typeof day[field] !== "string" || day[field].trim().length === 0) {
      errors.push(`${path}.${field} must not be empty`);
    }
  }
  if (typeof day.readingPassage === "string") {
    const count = wordCount(day.readingPassage);
    if (count < 150 || count > 250) {
      errors.push(`${path}.readingPassage must contain 150-250 words; found ${count}`);
    }
    if (!day.readingPassage.trim().split(/\n\s*\n/)[0].includes("?")) {
      errors.push(`${path}.readingPassage first paragraph must begin with a child-friendly question`);
    }
  }
  if (!Array.isArray(day.trivia) || day.trivia.length < 1 || day.trivia.length > 2) {
    errors.push(`${path}.trivia must contain one or two items`);
  }

  const storyText = [day.title, day.hook, day.readingPassage, ...(day.trivia || [])]
    .filter((value) => typeof value === "string")
    .join(" ");
  for (const levelName of LEVELS) {
    const level = day.mathLevels?.[levelName];
    const answer = day.answers?.[levelName];
    validateMathLevel(level, levelName, path, storyText, errors);
    validateAnswer(answer, levelName, path, errors);
    if (!Array.isArray(day.answerKeyEntries) || !day.answerKeyEntries.includes(`${day.date}:${levelName}`)) {
      errors.push(`${path}.answerKeyEntries must include ${day.date}:${levelName}`);
    }
    validateAnswerKeyLink(answerKey, day, levelName, answer, errors);
  }
  validateSourceIds(day.sourceIds, sources, path, errors);
}

function validateMathLevel(level, levelName, path, storyText, errors) {
  const levelPath = `${path}.mathLevels.${levelName}`;
  if (!level || typeof level !== "object") {
    errors.push(`${levelPath} is required`);
    return;
  }
  if (level.pageType !== levelName) {
    errors.push(`${levelPath}.pageType must be ${levelName}`);
  }
  if (typeof level.skill !== "string" || level.skill.trim().length === 0) {
    errors.push(`${levelPath}.skill must not be empty`);
  } else if (!skillMatchesLevel(level.skill, levelName)) {
    errors.push(`${levelPath}.skill is not valid for ${levelName}; level${levelName.slice(-1)} must use ${skillDescription(levelName)}`);
  }
  if (typeof level.prompt !== "string" || level.prompt.trim().length === 0) {
    errors.push(`${levelPath}.prompt must not be empty`);
  }
  if (!Array.isArray(level.numbersUsed) || level.numbersUsed.length === 0) {
    errors.push(`${levelPath}.numbersUsed must contain at least one number`);
    return;
  }
  level.numbersUsed.forEach((numberUsed, numberIndex) => {
    const numberPath = `${levelPath}.numbersUsed[${numberIndex}]`;
    if (!numberUsed || typeof numberUsed !== "object" || !Number.isFinite(numberUsed.value)) {
      errors.push(`${numberPath}.value must be a finite number`);
      return;
    }
    if (typeof numberUsed.unit !== "string" || numberUsed.unit.trim().length === 0) {
      errors.push(`${numberPath}.unit must not be empty`);
    }
    if (typeof numberUsed.source !== "string" || numberUsed.source.trim().length === 0) {
      errors.push(`${numberPath}.source must not be empty`);
    }
    if (!numberAppearsInStory(numberUsed.value, storyText) && !isExplicitTaskFact(numberUsed.source)) {
      errors.push(`${numberPath} value ${numberUsed.value} is not present in the passage or marked as an explicit task fact`);
    }
    if (levelName === "level1" && Math.abs(numberUsed.value) > 50) {
      errors.push(`${levelPath} numbers must be within 50 for direct Level 1 arithmetic`);
    }
  });
}

function validateAnswer(answer, levelName, path, errors) {
  const answerPath = `${path}.answers.${levelName}`;
  if (!answer || typeof answer !== "object") {
    errors.push(`${answerPath} is required`);
    return;
  }
  for (const field of ["equation", "work", "finalAnswer"]) {
    if (typeof answer[field] !== "string" || answer[field].trim().length === 0) {
      errors.push(`${answerPath}.${field} must not be empty`);
    }
  }
  if (typeof answer.equation !== "string") return;
  const calculation = calculateEquation(answer.equation);
  if (!calculation.valid) {
    errors.push(`${answerPath}.equation is invalid: ${calculation.error}`);
    return;
  }
  if (!nearlyEqual(calculation.left, calculation.right)) {
    errors.push(`${answerPath} equation evaluates to ${formatNumber(calculation.left)}, not ${formatNumber(calculation.right)}`);
  }
  if (typeof answer.finalAnswer === "string" && !containsNumber(answer.finalAnswer, calculation.left)) {
    errors.push(`${answerPath}.finalAnswer must include computed result ${formatNumber(calculation.left)}`);
  }
}

function validateSources(sources, errors) {
  if (!Array.isArray(sources) || sources.length === 0) {
    errors.push("sources must contain at least one source");
    return new Set();
  }
  const ids = new Set();
  sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (!source || typeof source !== "object") {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const field of ["id", "title", "publisher", "url", "accessedDate"]) {
      if (typeof source[field] !== "string" || source[field].trim().length === 0) {
        errors.push(`${path}.${field} must not be empty`);
      }
    }
    if (typeof source.url === "string" && !source.url.startsWith("https://")) {
      errors.push(`${path}.url must use https://`);
    }
    if (typeof source.accessedDate === "string" && !isDate(source.accessedDate)) {
      errors.push(`${path}.accessedDate must be a real date in YYYY-MM-DD format`);
    }
    if (typeof source.id === "string") {
      if (ids.has(source.id)) errors.push(`${path}.id is duplicated: ${source.id}`);
      ids.add(source.id);
    }
  });
  return ids;
}

function validateSourceIds(sourceIds, sources, path, errors) {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
    errors.push(`${path}.sourceIds must cite at least one source`);
    return;
  }
  sourceIds.forEach((sourceId) => {
    if (!sources.has(sourceId)) errors.push(`${path}.sourceIds cites unknown source: ${sourceId}`);
  });
}

function validateAnswerKey(answerKey, days, errors) {
  if (!answerKey || typeof answerKey !== "object") {
    errors.push("answerKey is required");
    return;
  }
  for (const levelName of LEVELS) {
    if (!Array.isArray(answerKey[levelName])) {
      errors.push(`answerKey.${levelName} must be an array`);
    }
  }
  const expected = new Set(days.flatMap((day) => LEVELS.map((level) => `${day?.date}:${level}`)));
  for (const levelName of LEVELS) {
    for (const entry of answerKey[levelName] || []) {
      if (!entry || entry.entryId !== `${entry.date}:${entry.level}`) {
        errors.push(`answerKey.${levelName} contains an entry with a mismatched entryId`);
      }
      if (entry?.level !== levelName) errors.push(`answerKey.${levelName} contains an entry with the wrong level`);
      if (entry?.entryId && !expected.has(entry.entryId)) errors.push(`answerKey.${levelName} contains an unknown entry: ${entry.entryId}`);
    }
  }
}

function validateAnswerKeyLink(answerKey, day, levelName, answer, errors) {
  const entryId = `${day.date}:${levelName}`;
  const entry = answerKey?.[levelName]?.find((candidate) => candidate?.entryId === entryId);
  if (!entry) {
    errors.push(`answerKey.${levelName} is missing ${entryId}`);
    return;
  }
  for (const field of ["equation", "work", "finalAnswer"]) {
    if (entry[field] !== answer?.[field]) errors.push(`answerKey.${levelName} ${entryId} does not match daily ${field}`);
  }
}

function requireValue(object, field, errors, path = "monthly content") {
  if (!Object.hasOwn(object, field)) errors.push(`${path} is missing required field: ${field}`);
}

function isMonth(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().startsWith(value);
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function skillMatchesLevel(skill, levelName) {
  const normalized = skill.toLowerCase();
  if (levelName === "level1") return /addition|subtraction/.test(normalized);
  if (levelName === "level2") return /multiplication|division|sharing|scale|comparison/.test(normalized);
  return /multi|elapsed|conversion|money|logic|time/.test(normalized);
}

function skillDescription(levelName) {
  if (levelName === "level1") return "addition or subtraction";
  if (levelName === "level2") return "multiplication, division, sharing, scale, or comparison";
  return "a multi-step, elapsed-time, conversion, money, time, or logic challenge";
}

function numberAppearsInStory(value, storyText) {
  const number = String(value);
  const numericMatch = new RegExp(`(?<![\\d.])${escapeRegExp(number)}(?![\\d.])`).test(storyText);
  return numericMatch || (Number.isInteger(value) && value >= 0 && value <= 20 && new RegExp(`\\b${numberWord(value)}\\b`, "i").test(storyText));
}

function numberWord(value) {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"][value];
}

function isExplicitTaskFact(source) {
  return /problem scenario|explicit(?:ly)? (?:introduced|defined) task fact|conversion fact/i.test(source);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateEquation(equation) {
  const parts = equation.split("=");
  if (parts.length !== 2) return { valid: false, error: "must contain exactly one = sign" };
  try {
    return { valid: true, left: evaluateExpression(parts[0]), right: evaluateExpression(parts[1]) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function evaluateExpression(expression) {
  const normalized = expression.replace(/[×xX]/g, "*").replace(/÷/g, "/").replace(/\s+/g, "");
  const tokens = normalized.match(/\d+(?:\.\d+)?|[()+*/-]/g);
  if (!tokens || tokens.join("") !== normalized) throw new Error("contains unsupported characters");
  const values = [];
  const operators = [];
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const apply = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (left === undefined || right === undefined) throw new Error("has incomplete arithmetic");
    if (operator === "+") values.push(left + right);
    if (operator === "-") values.push(left - right);
    if (operator === "*") values.push(left * right);
    if (operator === "/") {
      if (right === 0) throw new Error("cannot divide by zero");
      values.push(left / right);
    }
  };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (/^\d/.test(token)) values.push(Number(token));
    else if (token === "(") operators.push(token);
    else if (token === ")") {
      while (operators.at(-1) !== "(") {
        if (operators.length === 0) throw new Error("has unmatched parentheses");
        apply();
      }
      operators.pop();
    } else {
      while (operators.length && operators.at(-1) !== "(" && precedence[operators.at(-1)] >= precedence[token]) apply();
      operators.push(token);
    }
  }
  while (operators.length) {
    if (operators.at(-1) === "(") throw new Error("has unmatched parentheses");
    apply();
  }
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error("has incomplete arithmetic");
  return values[0];
}

function containsNumber(text, value) {
  return new RegExp(`(?<![\\d.])${escapeRegExp(formatNumber(value))}(?![\\d.])`).test(text);
}

function nearlyEqual(left, right) {
  return Math.abs(left - right) < 1e-9;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}
