const REQUIRED_MONTHLY_ARTIFACTS = new Set(['pdf', 'answerKeys', 'thumbnails', 'listingCopy', 'releaseRecord']);

export function validatePortfolioArchitecture(architecture) {
  const errors = [];
  if (!architecture || typeof architecture !== 'object') return { valid: false, errors: ['architecture must be an object'] };
  if (architecture.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (architecture.portfolioId !== 'morning-work-math') errors.push('portfolioId must be morning-work-math');
  const monthly = architecture.products?.monthly;
  const bundle = architecture.products?.bundle;
  if (monthly?.identifierPattern !== 'morning-work-math-{year}-{month}') errors.push('products.monthly.identifierPattern is incorrect');
  if (monthly?.titlePattern !== '{Month} Morning Work Math') errors.push('products.monthly.titlePattern is incorrect');
  if (!Array.isArray(monthly?.statusValues) || !monthly.statusValues.includes('released')) errors.push('products.monthly.statusValues must include released');
  const missing = [...REQUIRED_MONTHLY_ARTIFACTS].filter((artifact) => !monthly?.inclusionRules?.includes(artifact));
  if (missing.length) errors.push(`products.monthly.inclusionRules missing ${missing.join(', ')}`);
  if (bundle?.identifier !== 'morning-work-math-year-bundle') errors.push('products.bundle.identifier is incorrect');
  if (!bundle?.completenessRule) errors.push('products.bundle.completenessRule is required');
  const reference = architecture.referenceProduct;
  if (reference?.month !== 10 || reference?.year !== 2026) errors.push('referenceProduct must be October 2026');
  if (reference?.identifier !== 'morning-work-math-2026-10') errors.push('referenceProduct.identifier must be morning-work-math-2026-10');
  if (reference?.title !== 'October Morning Work Math') errors.push('referenceProduct.title is incorrect');
  if (!Array.isArray(reference?.includedMonths) || reference.includedMonths.length !== 1 || reference.includedMonths[0] !== 10) errors.push('referenceProduct.includedMonths must contain only October');
  if (!Array.isArray(architecture.futureMonthRules) || architecture.futureMonthRules.length < 3) errors.push('futureMonthRules must contain at least three rules');
  return { valid: errors.length === 0, errors };
}
