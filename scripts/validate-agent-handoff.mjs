#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseHandoff } from "../src/agent-handoff.mjs";

function parseArgs(argv) {
  const fileIndex = argv.indexOf("--file");
  const useStdin = argv.includes("--stdin");
  if ((fileIndex >= 0 && !argv[fileIndex + 1]) || (fileIndex >= 0 && useStdin) || (fileIndex < 0 && !useStdin)) {
    throw new Error("Usage: node scripts/validate-agent-handoff.mjs --file <path> | --stdin");
  }
  return { file: fileIndex >= 0 ? argv[fileIndex + 1] : null };
}

async function readInput({ file }) {
  if (file) return readFile(file, "utf8");
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => resolve(input));
    process.stdin.on("error", reject);
  });
}

try {
  const input = await readInput(parseArgs(process.argv.slice(2)));
  const result = parseHandoff(input);
  if (!result.valid) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    process.stdout.write(`${JSON.stringify(result.handoff, null, 2)}\n`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
