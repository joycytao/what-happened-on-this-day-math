const MONTHS = new Set([
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]);

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildLandingPageMetadata(product) {
  const monthSlug = String(product?.month ?? "").trim().toLowerCase();
  if (!MONTHS.has(monthSlug)) throw new Error(`unsupported landing-page month: ${monthSlug}`);
  const dayCount = Number(product?.day_count);
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 31) {
    throw new Error(`invalid landing-page day count: ${product?.day_count}`);
  }

  return {
    monthSlug,
    title: `${titleCase(monthSlug)} Morning Work Math`,
    description: `${dayCount} daily word problems across 3 levels, with separate answer keys.`,
    productUrl: `https://6pm-studio.com/go/${monthSlug}`,
  };
}
