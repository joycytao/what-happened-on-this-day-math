import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSocialCalendar } from "../src/social-calendar-loader.mjs";
import { buildMonthlySocialRunPlan } from "../src/social-monthly-orchestrator.mjs";

export function parseArgs(argv = []) {
  const options = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") { options.dryRun = true; continue; }
    if (argument.startsWith("--") && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      options[argument.slice(2)] = argv[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  if (!options.month) throw new Error("--month YYYY-MM is required");
  return options;
}

export async function runMonthlySocial({ month, calendar = "content/social/content-calendar.xlsx", output = "output/social/monthly", dryRun = false, root = process.cwd() } = {}) {
  const loaded = loadSocialCalendar({ workbookPath: calendar, month, root });
  const plan = loaded.valid
    ? buildMonthlySocialRunPlan({ rows: loaded.rows, month, outputRoot: output })
    : { valid: false, errors: [], month, rows: [], outputRoot: output };
  const errors = [...loaded.errors, ...plan.errors];
  const manifest = {
    schemaVersion: "1.0.0",
    month: String(month ?? "").trim(),
    source: loaded.source ?? { workbookPath: calendar, month: String(month ?? "").trim() },
    rows: plan.rows,
    valid: loaded.valid && plan.valid,
    errors,
    dryRun: Boolean(dryRun),
  };
  const manifestPath = path.resolve(root, output, String(month ?? "").trim(), "manifest.json");
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { ...manifest, manifestPath, manifest };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runMonthlySocial(options);
  process.stdout.write(`${JSON.stringify({ manifestPath: result.manifestPath, valid: result.valid, errors: result.errors }, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
