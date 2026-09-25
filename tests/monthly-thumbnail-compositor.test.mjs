import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const PYTHON = process.env.PYTHON_BIN || (
  existsSync("/Users/jtao/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3")
    ? "/Users/jtao/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
    : "python3"
);

test("renders only the unique source pages declared by the October manifest", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "monthly-thumbnail-pages-"));
  const result = spawnSync(PYTHON, [
    "scripts/render_monthly_thumbnail_pages.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual((await readdir(outputDir)).sort(), [
    "page-001.png",
    "page-002.png",
    "page-003.png",
    "page-004.png",
    "page-125.png",
    "source-pages.json",
  ]);

  const report = JSON.parse(await readFile(join(outputDir, "source-pages.json"), "utf8"));
  assert.deepEqual(report.pages.map(({ page, types }) => [page, types]), [
    [1, ["different_math.story", "whats_included.story"]],
    [2, ["daily_practice.worksheet", "different_math.level1", "whats_included.level1"]],
    [3, ["different_math.level2", "whats_included.level2"]],
    [4, ["different_math.level3", "whats_included.level3"]],
    [125, ["whats_included.answer_key"]],
  ]);
});

function pngDimensions(buffer) {
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test("generates the four requested 1260px monthly thumbnail concepts", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "monthly-thumbnails-"));
  const result = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const names = ["cover", "whats-included", "different-math", "daily-practice"];
  for (const name of names) {
    const image = await readFile(join(outputDir, `october-v1.0-${name}.png`));
    assert.deepEqual(pngDimensions(image), [1260, 1260], name);
  }
  const report = JSON.parse(await readFile(join(outputDir, "monthly-thumbnail-report.json"), "utf8"));
  assert.deepEqual(report.templates, names);
  assert.deepEqual(report.copyConcepts, {
    cover: { headline: "October", productTitle: "MORNING WORK MATH", supportingText: ["31 DAILY WORD PROBLEMS"], levelsBlock: "3 LEVELS with orange side lines", doodle: "orange line-art pumpkin", doodlePrompt: "recognizable pumpkin silhouette with five ribbed lobes, curved stem, outlined leaf, and flattened base; orange outline only; no fill or shading" },
    whats_included: { headline: "WHAT’S INCLUDED", sourceLayout: "story, level 1, level 2 / level 3, answer key", headlineEmphasis: "three orange rays on each side", labelStyle: "orange pills narrower than cards", footer: "centered logo without divider lines", parityFixture: "references /thumbnail-assets/thumbnail-2-reference.png", failureLoop: "rerun prompt/compositor optimization until fixed-region visual QA passes" },
    different_math: { headline: ["October", "Morning Work Math"], supportingText: "31 Daily Word Problems · 3 Levels", sourceLayout: "three subtly tilted worksheet cards in one row", headlineSideLines: "short orange horizontal rules around the month", labelStyle: "large uppercase navy labels", parityFixture: "references /thumbnail-assets/thumbnail-3-reference.png", failureLoop: "rerun prompt/compositor optimization until fixed-region visual QA passes" },
    daily_practice: { headline: ["READY FOR", "DAILY PRACTICE"], useCases: ["MORNING WORK", "BELL RINGERS", "HOMESCHOOL"], headlineEmphasis: "three orange rays on each side", useCaseSeparators: "vertical orange lines", sourceLayout: "one centered upright real worksheet preview", parityFixture: "references /thumbnail-assets/thumbnail-4-reference.png", failureLoop: "rerun prompt/compositor optimization until fixed-region visual QA passes" },
  });
});

test("Thumbnail 2 visual QA records fixed-region and variable-card parity artifacts", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "thumbnail-2-qa-"));
  const generatedDir = await mkdtemp(join(tmpdir(), "thumbnail-2-generated-"));
  const generated = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", generatedDir,
  ], { encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr || generated.stdout);

  const qa = spawnSync(PYTHON, [
    "scripts/validate_thumbnail2_visual_parity.py",
    "--reference", "references /thumbnail-assets/thumbnail-2-reference.png",
    "--generated", join(generatedDir, "october-v1.0-whats-included.png"),
    "--output-dir", outputDir,
  ], { encoding: "utf8" });
  assert.equal(qa.status, 0, qa.stderr || qa.stdout);
  const report = JSON.parse(await readFile(join(outputDir, "thumbnail-2-visual-qa.json"), "utf8"));
  assert.equal(report.visualAcceptance.passed, true);
  assert.deepEqual(Object.keys(report.fixedRegions), ["header_and_rays", "top_labels", "bottom_labels", "footer_logo"]);
  assert.deepEqual(Object.keys(report.variableCards), ["story", "level1", "level2", "level3", "answer_key"]);
  for (const artifact of report.artifacts) assert.ok(existsSync(join(outputDir, artifact)), artifact);
});

test("Thumbnail 3 visual QA records fixed-region and variable-card parity artifacts", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "thumbnail-3-qa-"));
  const generatedDir = await mkdtemp(join(tmpdir(), "thumbnail-3-generated-"));
  const generated = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", generatedDir,
  ], { encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr || generated.stdout);

  const qa = spawnSync(PYTHON, [
    "scripts/validate_thumbnail3_visual_parity.py",
    "--reference", "references /thumbnail-assets/thumbnail-3-reference.png",
    "--generated", join(generatedDir, "october-v1.0-different-math.png"),
    "--output-dir", outputDir,
  ], { encoding: "utf8" });
  assert.equal(qa.status, 0, qa.stderr || qa.stdout);
  const report = JSON.parse(await readFile(join(outputDir, "thumbnail-3-visual-qa.json"), "utf8"));
  assert.equal(report.visualAcceptance.passed, true);
  assert.deepEqual(Object.keys(report.fixedRegions), ["month_and_rules", "headline", "subtitle", "labels", "footer"]);
  assert.deepEqual(Object.keys(report.variableCards), ["level1", "level2", "level3"]);
  for (const artifact of report.artifacts) assert.ok(existsSync(join(outputDir, artifact)), artifact);
});

test("Thumbnail 4 visual QA records fixed-region and variable-preview parity artifacts", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "thumbnail-4-qa-"));
  const generatedDir = await mkdtemp(join(tmpdir(), "thumbnail-4-generated-"));
  const generated = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", generatedDir,
  ], { encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr || generated.stdout);

  const qa = spawnSync(PYTHON, [
    "scripts/validate_thumbnail4_visual_parity.py",
    "--reference", "references /thumbnail-assets/thumbnail-4-reference.png",
    "--generated", join(generatedDir, "october-v1.0-daily-practice.png"),
    "--output-dir", outputDir,
  ], { encoding: "utf8" });
  assert.equal(qa.status, 0, qa.stderr || qa.stdout);
  const report = JSON.parse(await readFile(join(outputDir, "thumbnail-4-visual-qa.json"), "utf8"));
  assert.equal(report.visualAcceptance.passed, true);
  assert.deepEqual(Object.keys(report.fixedRegions), ["header_and_rays", "preview_frame", "use_case_row", "footer"]);
  assert.deepEqual(Object.keys(report.variableRegions), ["worksheet_preview"]);
  for (const artifact of report.artifacts) assert.ok(existsSync(join(outputDir, artifact)), artifact);
});

test("report records the prompt-specific treatments instead of only generic copy", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "monthly-thumbnails-contract-"));
  const result = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(await readFile(join(outputDir, "monthly-thumbnail-report.json"), "utf8"));
  assert.equal(report.copyConcepts.different_math.labelStyle, "large uppercase navy labels");
  assert.equal(report.copyConcepts.daily_practice.useCaseSeparators, "vertical orange lines");
  assert.equal(report.copyConcepts.whats_included.headlineEmphasis, "three orange rays on each side");
});

test("October compositions use the production visual language", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "monthly-thumbnails-production-"));
  const result = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", "examples/monthly-thumbnail.example.json",
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(await readFile(join(outputDir, "monthly-thumbnail-report.json"), "utf8"));
  assert.equal(report.design, "october-production-v2");
  assert.deepEqual(report.style, {
    canvas: [1260, 1260],
    background: "#FEFFEF",
    ink: "#2B313F",
    accent: "#FF8A00",
    border: { margin: 30, radius: 26, width: 8 },
    deterministic: true,
  });
});

test("repeated generation preserves identical layout and style checksums", async () => {
  const firstDir = await mkdtemp(join(tmpdir(), "monthly-thumbnails-repeat-a-"));
  const secondDir = await mkdtemp(join(tmpdir(), "monthly-thumbnails-repeat-b-"));
  for (const outputDir of [firstDir, secondDir]) {
    const result = spawnSync(PYTHON, [
      "scripts/generate_monthly_thumbnails.py",
      "--manifest", "examples/monthly-thumbnail.example.json",
      "--output-dir", outputDir,
    ], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  const first = JSON.parse(await readFile(join(firstDir, "monthly-thumbnail-report.json"), "utf8"));
  const second = JSON.parse(await readFile(join(secondDir, "monthly-thumbnail-report.json"), "utf8"));
  assert.deepEqual(second.style, first.style);
  assert.deepEqual(second.checksums, first.checksums);
});

test("stops before writing thumbnails when the PDF checksum is stale", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "monthly-thumbnail-stale-"));
  const manifest = JSON.parse(await readFile("examples/monthly-thumbnail.example.json", "utf8"));
  manifest.pdf.sha256 = "0000000000000000000000000000000000000000000000000000000000000000";
  const manifestPath = join(tempDir, "stale.json");
  const outputDir = join(tempDir, "outputs");
  await writeFile(manifestPath, JSON.stringify(manifest));

  const result = spawnSync(PYTHON, [
    "scripts/generate_monthly_thumbnails.py",
    "--manifest", manifestPath,
    "--output-dir", outputDir,
  ], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  await assert.rejects(() => readdir(outputDir));
});
