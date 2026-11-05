import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = path.join(root, "examples/december-thumbnail-manifest.json");
const outputDir = path.join(root, "output/tpt/december-morning-work-math/visual-assets");
fs.mkdirSync(outputDir, { recursive: true });

const result = spawnSync(process.execPath, [
  path.join(root, "scripts/generate-tpt-visual-assets.mjs"),
  "--manifest", manifest,
  "--output-dir", outputDir,
  "--package-id", "december-morning-work-math",
  "--package-version", "v1.0",
], { cwd: root, encoding: "utf8", stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);

const handoffPath = path.join(outputDir, "landing-page-handoff.json");
const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
if (handoff.month !== "december" || handoff.landingPage?.monthSlug !== "december") {
  throw new Error("December landing-page handoff has the wrong month");
}
if (handoff.sourcePdf?.sha256 !== "d43dab1a6797df225ccdb90528fafbcfadd00c011107421694c9a3ac066819bf") {
  throw new Error("December landing-page handoff is not tied to the QA-approved PDF");
}
if (handoff.landingPageImage?.width !== 1260 || handoff.landingPageImage?.height !== 1260) {
  throw new Error("December landing-page image must be 1260x1260");
}
console.log(JSON.stringify({
  handoff: path.relative(root, handoffPath),
  image: handoff.landingPageImage.path,
  sha256: handoff.landingPageImage.sha256,
  sourcePdfSha256: handoff.sourcePdf.sha256,
  qa: handoff.qa,
}, null, 2));
