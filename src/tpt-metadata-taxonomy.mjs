const REQUIRED_FIELDS = ['title', 'subjectArea', 'resourceType', 'gradeBand', 'format', 'description', 'keywords', 'productRelationship'];

export function validateTptMetadataTaxonomy(taxonomy) {
  const errors = [];
  if (!taxonomy || typeof taxonomy !== 'object') return { valid: false, errors: ['taxonomy must be an object'] };
  if (taxonomy.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (taxonomy.taxonomyId !== 'morning-work-math-tpt-v1') errors.push('taxonomyId is incorrect');
  if (!REQUIRED_FIELDS.every((field) => taxonomy.fields?.required?.includes(field))) errors.push('fields.required must contain all canonical metadata fields');
  for (const field of ['subjectArea', 'resourceType', 'gradeBand', 'format', 'productRelationship']) {
    if (!Array.isArray(taxonomy.fields?.allowedValues?.[field]) || taxonomy.fields.allowedValues[field].length === 0) errors.push(`fields.allowedValues.${field} must contain allowed values`);
  }
  if (taxonomy.titleRules?.monthly !== '{Month} Morning Work Math') errors.push('titleRules.monthly is incorrect');
  if (taxonomy.titleRules?.bundle !== 'Morning Work Math: Full-Year Bundle') errors.push('titleRules.bundle is incorrect');
  for (const group of ['math', 'routine', 'history', 'differentiation']) {
    if (!Array.isArray(taxonomy.keywordGroups?.[group]) || taxonomy.keywordGroups[group].length < 2) errors.push(`keywordGroups.${group} must contain at least two terms`);
  }
  for (const field of ['title', 'subjectArea', 'resourceType', 'gradeBand', 'format', 'productType', 'description']) {
    if (!taxonomy.referenceRecord?.[field]) errors.push(`referenceRecord.${field} is required`);
  }
  const allowed = taxonomy.fields?.allowedValues ?? {};
  for (const field of ['subjectArea', 'resourceType', 'gradeBand', 'format', 'productType']) {
    const values = field === 'productType' ? ['monthly standalone', 'annual bundle'] : allowed[field];
    if (values && taxonomy.referenceRecord?.[field] && !values.includes(taxonomy.referenceRecord[field])) errors.push(`referenceRecord.${field} is not an allowed value`);
  }
  if (!Array.isArray(taxonomy.referenceRecord?.keywords) || taxonomy.referenceRecord.keywords.length < 3) errors.push('referenceRecord.keywords must contain at least three terms');
  return { valid: errors.length === 0, errors };
}
