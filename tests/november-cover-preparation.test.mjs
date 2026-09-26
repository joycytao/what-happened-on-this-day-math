import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = new URL("..", import.meta.url).pathname;

test("November cover preparation records draft approval and shifted final mapping", async () => {
  await run("npm", ["run", "cover:prepare:november"], { cwd: root });
  const report = JSON.parse(await readFile(`${root}/reports/issue-86-november-cover.json`, "utf8"));
  assert.equal(report.approval, "draft");
  assert.equal(report.sourcePageCount, 123);
  assert.equal(report.finalPageCountAfterApproval, 124);
  assert.deepEqual(report.mapping, { cover: 1, dailyWorksheetSourcePages: "2-121", answerKeySourcePages: "122-124" });
  await rm(`${root}/output/worksheet-cover`, { recursive: true, force: true });
  await rm(`${root}/reports/issue-86-november-cover.json`, { force: true });
});

test("November cover includes a centered orange outline turkey doodle", async () => {
  await run("npm", ["run", "cover:prepare:november"], { cwd: root });
  const config = JSON.parse(await readFile(`${root}/examples/november-worksheet-cover.json`, "utf8"));
  const svg = await readFile(`${root}/output/worksheet-cover/november-worksheet-cover.svg`, "utf8");

  assert.equal(config.illustration?.name, "turkey");
  assert.match(svg, /data-illustration="turkey"/);
  assert.match(svg, /fill="none"/);
  assert.match(svg, /stroke="#FF8A00"/);
  assert.match(svg, /data-illustration-center="772\.5,1120"/);
  assert.match(svg, /data-turkey-features="fan-tail,body,head,beak,wattle,feet"/);
  assert.match(svg, /data-tail-feathers="7"/);

  await rm(`${root}/output/worksheet-cover`, { recursive: true, force: true });
  await rm(`${root}/reports/issue-86-november-cover.json`, { force: true });
});
