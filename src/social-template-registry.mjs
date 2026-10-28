import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function keyForDirectory(kind, directory) {
  const basename = path.basename(directory, "-template");
  if (basename === "campaign-reminder") return "campaign-reminder-reel";
  return basename;
}

function templatesIn(rootDirectory, kind) {
  const absoluteRoot = path.join(ROOT, rootDirectory);
  return fs.readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith("-template"))
    .map((entry) => {
      const directory = `${rootDirectory}/${entry.name}`;
      return {
        key: keyForDirectory(kind, directory),
        kind,
        directory,
        absolutePath: path.join(ROOT, directory),
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function listSocialTemplates() {
  return [...templatesIn("reels", "reel"), ...templatesIn("social", "carousel")];
}

export function validateSocialIntake(input = {}) {
  const errors = [];
  const templateKey = typeof input.templateKey === "string" ? input.templateKey.trim() : "";
  if (!templateKey) errors.push("templateKey is required");
  const template = listSocialTemplates().find((candidate) => candidate.key === templateKey);
  if (templateKey && !template) errors.push(`unknown templateKey: ${templateKey}`);
  return {
    valid: errors.length === 0,
    errors,
    template: template ? { key: template.key, kind: template.kind, directory: template.directory } : null,
  };
}
