const REQUIRED_STAGE_IDS = [
  'source-content', 'mathematics-answer-keys', 'daily-worksheets',
  'answer-key-pages', 'worksheet-coversheet', 'final-pdf-qa',
  'derived-assets', 'listing-handoff', 'release-record'
];

export function validateMonthlyReleaseWorkflow(workflow) {
  const errors = [];
  if (!workflow || typeof workflow !== 'object') return { valid: false, errors: ['workflow must be an object'] };
  if (workflow.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (workflow.workflowId !== 'morning-work-math-monthly-release-v1') errors.push('workflowId is incorrect');
  const stages = workflow.stages;
  if (!Array.isArray(stages) || stages.length !== REQUIRED_STAGE_IDS.length) {
    errors.push(`stages must contain ${REQUIRED_STAGE_IDS.length} ordered stages`);
  }
  for (const [index, id] of REQUIRED_STAGE_IDS.entries()) {
    const stage = stages?.[index];
    if (stage?.id !== id || stage?.order !== index + 1) errors.push(`stage ${index + 1} must be ${id}`);
    if (!Array.isArray(stage?.inputs) || stage.inputs.length === 0) errors.push(`${id} must declare inputs`);
    if (!Array.isArray(stage?.outputs) || stage.outputs.length === 0) errors.push(`${id} must declare outputs`);
    if (!stage?.gate) errors.push(`${id} must declare a pass/fail gate`);
  }
  const cover = stages?.find((stage) => stage.id === 'worksheet-coversheet');
  const finalQa = stages?.find((stage) => stage.id === 'final-pdf-qa');
  const derived = stages?.find((stage) => stage.id === 'derived-assets');
  if (!cover?.outputs?.includes('coverApproval')) errors.push('worksheet-coversheet must output coverApproval');
  if (!finalQa?.inputs?.includes('coverPdfPage')) errors.push('final-pdf-qa must consume coverPdfPage');
  if (!derived?.inputs?.includes('finalPdf')) errors.push('derived-assets must consume finalPdf');
  if (!Array.isArray(workflow.invalidationRules) || workflow.invalidationRules.length < 2) errors.push('invalidationRules must declare PDF/content downstream invalidation');
  if (!workflow.monthRules?.supportedModes?.includes('30-day') || !workflow.monthRules.supportedModes.includes('31-day')) errors.push('monthRules must support 30-day and 31-day months');
  if (workflow.monthRules?.calendarDayCount !== 'derive from the requested calendar month') errors.push('calendar day count must be derived from the requested month');
  if (workflow.monthRules?.bundleRule !== 'reference only monthly records whose release status is released') errors.push('bundleRule must require released monthly records');
  if (workflow.referenceRelease?.month !== 'October' || workflow.referenceRelease?.status !== 'released') errors.push('referenceRelease must be the released October product');
  for (const artifact of ['finalPdf', 'pageMappings', 'thumbnails', 'thumbnailQa', 'releaseManifest']) {
    if (!workflow.referenceRelease?.trace?.includes(artifact)) errors.push(`referenceRelease.trace must include ${artifact}`);
  }
  if (!workflow.failureHandling?.includes('blocks release') || !workflow.failureHandling.includes('revalidation')) errors.push('failureHandling must block release and require revalidation');
  return { valid: errors.length === 0, errors };
}
