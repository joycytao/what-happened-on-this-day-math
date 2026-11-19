const ALLOWED_CATEGORIES = [
  "number_sense", "computation", "missing_value", "word_problem",
  "geometry", "measurement_data"
];

const STAGES = ["Recover", "Understand", "Practice"];
const CONSENT_VERSION = "2026-10-06";
const APPROVED_CONSENT = "I confirm that I have permission to submit this student work for internal processing. I confirm that the submission contains no unnecessary names, faces, or private information. The original file may be reviewed internally, retained for up to 90 days, and deleted afterward. Only the approved clean copy may be used for downstream rendering or release.";

function addError(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
}

function isRelativePath(value) {
  return typeof value === "string" && value.trim() !== "" && !value.startsWith("/") && !value.split("/").includes("..");
}

export function validateUtilityReelIntake(input = {}) {
  const errors = [];
  const cycleId = String(input.cycleId ?? "").trim();
  if (!cycleId) addError(errors, "cycleId is required");
  const sourceFile = String(input.sourceFile ?? "").trim();
  if (!sourceFile.startsWith("/")) addError(errors, "sourceFile must be an absolute user-provided path");
  if (!isSha256(input.sourceSha256)) addError(errors, "sourceSha256 must be a 64-character hexadecimal checksum");
  if (input.permissionConfirmed !== true) addError(errors, "permission must be explicitly confirmed");
  if (input.privacyRedactionConfirmed !== true) addError(errors, "privacy redaction must be explicitly confirmed");
  if (input.consentVersion !== CONSENT_VERSION) addError(errors, `consentVersion must be ${CONSENT_VERSION}`);
  if (input.consentText !== APPROVED_CONSENT) addError(errors, "consentText must match the approved wording");
  if (input.retentionDays !== 90) addError(errors, "retentionDays must be 90");
  if (!isRelativePath(input.redactionReport)) addError(errors, "redactionReport must be a repository-relative report path");
  if (!Number.isInteger(input.sourcePageCount) || input.sourcePageCount < 1) addError(errors, "sourcePageCount must be a positive integer");
  const cleanReviewCopyPath = String(input.cleanReviewCopyPath ?? "").trim();
  if (!isRelativePath(cleanReviewCopyPath)) addError(errors, "cleanReviewCopyPath must be a repository-relative output path");
  if (cleanReviewCopyPath === sourceFile) addError(errors, "original source must remain untouched; clean review copy must be separate");
  if (!Array.isArray(input.highConfidenceCategories) || input.highConfidenceCategories.length === 0) addError(errors, "at least one high-confidence category is required");
  for (const category of input.highConfidenceCategories ?? []) {
    if (!ALLOWED_CATEGORIES.includes(category)) addError(errors, `uncertain or unsupported category must be excluded: ${category}`);
  }
  return {
    valid: errors.length === 0,
    errors,
    normalized: {
      ...input,
      cycleId,
      sourceFile,
      cleanReviewCopyPath,
      consentVersion: input.consentVersion,
      consentText: input.consentText,
      retentionDays: input.retentionDays,
      originalMustRemainUntouched: true,
      highConfidenceCategories: [...(input.highConfidenceCategories ?? [])]
    }
  };
}

export function buildUtilityReelCycle(input = {}) {
  const validation = validateUtilityReelIntake(input);
  if (!validation.valid) return { valid: false, errors: validation.errors, records: [] };
  const normalized = validation.normalized;
  const base = {
    schemaVersion: "1.0.0",
    cycleId: normalized.cycleId,
    sourceSha256: normalized.sourceSha256,
    canvas: "1080x1920",
    audio: "silent-by-default",
    cta: { text: "Follow for the next step", requiresHumanApproval: true }
  };
  const records = [
    {
      ...base,
      id: `${normalized.cycleId}-recover`,
      stage: "Recover",
      week: 1,
      sourceAsset: normalized.cleanReviewCopyPath,
      purpose: "Show a clean review copy that preserves printed questions, diagrams, numbering, and answer spaces.",
      preservesOriginalLayout: true,
      answerKeyExposed: false
    },
    {
      ...base,
      id: `${normalized.cycleId}-understand`,
      stage: "Understand",
      week: 2,
      sourceAsset: normalized.cleanReviewCopyPath,
      categories: [...normalized.highConfidenceCategories],
      purpose: "Explain only high-confidence visible error categories and keep uncertain items excluded.",
      uncertaintyPolicy: "exclude-or-mark-uncertain",
      answerKeyExposed: false
    },
    {
      ...base,
      id: `${normalized.cycleId}-practice`,
      stage: "Practice",
      week: 3,
      sourceAsset: `output/utility/${normalized.cycleId}/practice-worksheet.pdf`,
      categories: [...normalized.highConfidenceCategories],
      purpose: "Provide new practice problems targeting selected categories without copying the source test.",
      newProblemsRequired: true,
      copiedSourceProblems: false,
      mathQaRequired: true,
      layoutQaRequired: true,
      answerKeyExposed: false
    }
  ];
  return {
    valid: true,
    errors: [],
    schemaVersion: "1.0.0",
    cycleId: normalized.cycleId,
    source: {
      file: normalized.sourceFile,
      sha256: normalized.sourceSha256,
      pageCount: normalized.sourcePageCount,
      permissionConfirmed: normalized.permissionConfirmed,
      privacyRedactionConfirmed: normalized.privacyRedactionConfirmed,
      consentVersion: normalized.consentVersion,
      retentionDays: normalized.retentionDays,
      redactionReport: normalized.redactionReport,
      originalMustRemainUntouched: true
    },
    records,
    qa: {
      humanReviewRequired: true,
      publicationBlockedUntilPrivacyReview: true,
      unsupportedDiagnosis: false,
      answerKeyExposure: false,
      sourcePreserved: true
    }
  };
}

export { ALLOWED_CATEGORIES, STAGES };
