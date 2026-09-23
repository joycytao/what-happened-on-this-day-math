import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("monthly thumbnail prompts preserve the exact PR #77 production contract", async () => {
  const prompt = await readFile("docs/monthly-thumbnail-prompts.md", "utf8");
  for (const phrase of [
    "Use the attached reference image as the exact layout and visual-style reference.",
    "warm ivory background: #FEFFEF",
    "deep navy typography: #2B313F",
    "bright orange accent color: #FF8A00",
    "WHAT’S INCLUDED",
    "three small orange hand-drawn emphasis lines on each side",
    "ONE STORY",
    "DIFFERENT MATH",
    "one short orange horizontal line on the left and right",
    "READY FOR",
    "DAILY PRACTICE",
    "thin vertical orange lines",
    "No fake worksheet screenshots",
    "Only scale and crop real PDF page renders",
  ]) {
    assert.match(prompt, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")), phrase);
  }
});
