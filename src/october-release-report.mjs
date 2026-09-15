export const OCTOBER_RELEASE_CONTRACT = {
  month: 10,
  dayCount: 31,
  dailyPagesPerDay: 4,
  answerKeyPages: 3,
  expectedPageCount: 127,
};

export function buildOctoberReleaseReport({ content, mathematics, source, layout, pdf, visualInspection = null }) {
  const validation = {
    content: content?.valid === true,
    mathematics: mathematics?.valid === true,
    source: source?.valid === true,
    layout: layout?.valid === true,
    pdf: pdf?.valid === true,
  };
  const actualPageCount = pdf?.actualPageCount ?? null;
  return {
    valid: Object.values(validation).every(Boolean) && actualPageCount === OCTOBER_RELEASE_CONTRACT.expectedPageCount,
    month: OCTOBER_RELEASE_CONTRACT.month,
    dayCount: OCTOBER_RELEASE_CONTRACT.dayCount,
    expectedPageCount: OCTOBER_RELEASE_CONTRACT.expectedPageCount,
    actualPageCount,
    pageStructure: {
      dailyPages: OCTOBER_RELEASE_CONTRACT.dayCount * OCTOBER_RELEASE_CONTRACT.dailyPagesPerDay,
      dailyOrder: "day then reading-passage, level1, level2, level3",
      answerKeyPages: OCTOBER_RELEASE_CONTRACT.answerKeyPages,
      answerKeyOrder: "level1, level2, level3",
    },
    templateVersion: "1.0.0",
    validation,
    failureDetails: [
      ...(content?.errors ?? []).map((error) => `content: ${error}`),
      ...(mathematics?.errors ?? []).map((error) => `mathematics: ${error}`),
      ...(source?.errors ?? []).map((error) => `source: ${error}`),
      ...(layout?.errors ?? []).map((error) => `layout: ${error}`),
      ...(pdf?.errors ?? []).map((error) => `pdf: ${error}`),
    ],
    visualInspection,
  };
}

export function renderOctoberReleaseMarkdown(report) {
  const status = report.valid ? "PASS" : "FAIL";
  const failures = report.failureDetails?.length ? report.failureDetails.join(" | ") : "none";
  return `# October 2026 Worksheet Release QA\n\n- Status: **${status}**\n- Contract: ${report.dayCount} calendar days × ${report.pageStructure.dailyOrder} + ${report.pageStructure.answerKeyPages} Answer Key pages = ${report.expectedPageCount} pages.\n- Actual PDF pages: ${report.actualPageCount ?? "unavailable"}.\n- Daily pages: ${report.pageStructure.dailyPages}; Answer Key pages: ${report.pageStructure.answerKeyPages}.\n- Answer Key order: ${report.pageStructure.answerKeyOrder}.\n- Template version: ${report.templateVersion}.\n- Visual sample pages rasterized: ${report.visualInspection?.pages?.join(", ") || "not recorded"}.\n- Validation gates: content=${report.validation.content}, mathematics=${report.validation.mathematics}, source=${report.validation.source}, layout=${report.validation.layout}, PDF=${report.validation.pdf}.\n- Failure details: ${failures}.\n\n## Release decision\n\n${report.valid ? "All independent gates passed; the October packet is releasable." : "Release blocked: at least one independent gate failed; resolve the listed failure before release."}\n`;
}
