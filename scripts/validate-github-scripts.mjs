import fs from "node:fs";
import path from "node:path";

function extractScripts(source, file) {
  const lines = String(source).replaceAll("\r\n", "\n").split("\n");
  const scripts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\s{10}script:\s*\|\s*$/.test(lines[index])) continue;
    const body = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      if (line.trim() && !/^\s{12}/.test(line)) break;
      body.push(line.startsWith("            ") ? line.slice(12) : "");
      index = cursor;
    }
    scripts.push({ file, index: index + 1, source: body.join("\n") });
  }
  return scripts;
}

export function extractGithubScripts(workflowDir = ".github/workflows") {
  return fs.readdirSync(workflowDir)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .flatMap((file) => extractScripts(fs.readFileSync(path.join(workflowDir, file), "utf8"), path.join(workflowDir, file)));
}

export function validateGithubScriptSyntax(script) {
  const sanitized = script.replace(/\$\{\{[\s\S]*?\}\}/g, "null");
  try {
    new Function("github", "context", `return (async () => {\n${sanitized}\n})();`);
    return { valid: true, errors: [] };
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }
}

export function validateWorkflowGithubScripts(workflowDir = ".github/workflows") {
  const errors = [];
  for (const script of extractGithubScripts(workflowDir)) {
    const result = validateGithubScriptSyntax(script.source);
    for (const error of result.errors) errors.push(`${script.file}:${script.index}: ${error}`);
  }
  return { valid: errors.length === 0, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const result = validateWorkflowGithubScripts(process.argv[2] || ".github/workflows");
  if (!result.valid) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${extractGithubScripts(process.argv[2] || ".github/workflows").length} GitHub Script blocks.`);
  }
}
