const DAILY_PAGES_PER_DAY = 4;
const ANSWER_KEY_PAGES = 6;

export function generateMonthDates(year, month) {
  validateYear(year);
  validateMonth(month);

  const dayCount = getDaysInMonth(year, month);
  const dates = [];

  for (let day = 1; day <= dayCount; day += 1) {
    dates.push(formatDate(year, month, day));
  }

  return dates;
}

export function calculateMonthlyPageCount(year, month) {
  const dayCount = generateMonthDates(year, month).length;

  return {
    year,
    month,
    dayCount,
    dailyPagesPerDay: DAILY_PAGES_PER_DAY,
    answerKeyPages: ANSWER_KEY_PAGES,
    totalPages: dayCount * DAILY_PAGES_PER_DAY + ANSWER_KEY_PAGES,
  };
}

function validateYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("year must be an integer from 1 through 9999");
  }
}

function validateMonth(month) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("month must be an integer from 1 through 12");
  }
}

function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function formatDate(year, month, day) {
  const paddedYear = String(year).padStart(4, "0");
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${paddedYear}-${paddedMonth}-${paddedDay}`;
}
