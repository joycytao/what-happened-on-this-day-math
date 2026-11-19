export const REQUIRED_AUDIT_TERMS = Object.freeze([
  "proactive queue audit", "CODEX_TRIAGE_AUDIT:v1", "owner/status conflict",
  "missing input", "unresolved dependency", "open PR", "do not guess", "idempotent",
  "ownerless", "CODEX_RECONCILE_TO: developer", "status: blocked",
]);

export function validatePmTriageAuditSkill(markdown = "") {
  const source = String(markdown);
  const errors = REQUIRED_AUDIT_TERMS.filter((term) => !source.toLowerCase().includes(term.toLowerCase())).map((term) => `audit term missing: ${term}`);
  if (!/no Issue is currently eligible/i.test(source) || !/empty pickup set[\s\S]{0,160}diagnosis/i.test(source)) errors.push("skill must diagnose an empty pickup set");
  if (!/normalize known status-label\s+aliases/i.test(source) || !/unambiguous/i.test(source)) errors.push("skill must define safe routine label repair");
  if (!/more than one owner\/status[\s\S]{0,180}do not guess/i.test(source)) errors.push("skill must fail closed on ambiguous labels");
  if (!/ownerless/i.test(source) || !/atomically replace[\s\S]{0,220}status: blocked/i.test(source)) errors.push("skill must repair ownerless pickup explicitly");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
