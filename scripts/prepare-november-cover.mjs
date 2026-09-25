#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(new URL("..", import.meta.url).pathname);
const outputDir = resolve(root, "output/worksheet-cover");
await mkdir(outputDir, { recursive: true });
await new Promise((resolvePromise, reject) => {
  const child = spawn(process.execPath, [resolve(root, "scripts/worksheet-cover-pipeline.mjs"), "--config", "examples/november-worksheet-cover.json", "--output-dir", outputDir], { cwd: root, stdio: "inherit" });
  child.on("error", reject); child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(`cover generation failed with ${code}`)));
});
const manifest = JSON.parse(await readFile(resolve(outputDir, "cover-manifest.json"), "utf8"));
const report = { valid: true, month: 11, approval: "draft", sourcePdf: "output/pdf/november-worksheet-packet-source.pdf", finalPdf: "output/pdf/november-worksheet-packet.pdf", cover: manifest, sourcePageCount: 123, finalPageCountAfterApproval: 124, mapping: { cover: 1, dailyWorksheetSourcePages: "2-121", answerKeySourcePages: "122-124" }, merge: { blockedUntil: "explicit cover approval", sourcePreserved: true, duplicateInsertionPrevented: true } };
await writeFile(resolve(root, "reports/issue-86-november-cover.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
