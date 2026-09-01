import assert from "node:assert/strict";
import test from "node:test";

import { loadReadingPassageTemplate, renderReadingPassage } from "../src/reading-passage-renderer.mjs";

const day = {
  date: "1923-10-16",
  emoji: "🎬",
  title: "The Cartoon Contract",
  hook: "Have you ever made a tiny cartoon flip book and wondered if anyone else would watch it?",
  readingPassage: "Have you ever made a tiny cartoon flip book and wondered if anyone else would watch it? On **October 16, 1923**, **Walt Disney** signed a contract to distribute a cartoon series. The agreement helped start a company that grew from a small studio into a famous storyteller. Walt and his brother **Roy** worked together, drawing characters and planning films. Their studio mixed real people with animated worlds, which was a brand-new idea for many viewers. Walt made cartoons for **4 years**, creating **56 short films**. Then, in **1927**, he switched to an all-cartoon series starring **Oswald the Lucky Rabbit**. Within one year, Walt made **26 Oswald cartoons**. The famous mouse children know today came later, so Disney's story did not begin with Mickey. It began with a contract, two brothers, and a lot of drawings. Imagine papers, pencils, and cartoon characters taking over a room faster than toys after a busy playdate!",
  trivia: ["The first Disney studio was a small beginning for a huge animation company."],
};

test("renderReadingPassage returns one template-sized SVG with injected fields", () => {
  const svg = renderReadingPassage(day);

  assert.match(svg, /^<svg[^>]+width="1545"[^>]+height="2000"/);
  assert.match(svg, /October 16, 1923/);
  assert.match(svg, /The Cartoon Contract/);
  assert.match(svg, /October 16, 1923/);
  assert.match(svg, /viewBox="0 0 1545 2000"/);
  assert.match(svg, />6<\/text>/);
  assert.match(svg, />pm<\/text>/);
  assert.match(svg, />studio<\/text>/);
  assert.doesNotMatch(svg, /🎬/);
  assert.doesNotMatch(svg, /Trivia:/);
  assert.match(svg, /data-template-variant="reading-passage"/);
  assert.doesNotMatch(svg, /\*\*/);
  assert.match(svg, /<tspan font-weight="700">October 16, 1923<\/tspan>/);
  assert.match(svg, /data-content="article"[^>]*data-x="155"[^>]*data-width="1235"/);
  assert.match(svg, /data-content="body"[^>]*font-size="34"/);
  assert.match(svg, /data-content="body"[^>]*y="906"/);
  assert.match(svg, /translate\(1495 1876\) scale\(0\.5\) translate\(-1495 -1876\)/);
  assert.equal((svg.match(/<svg\b/g) || []).length, 1);
});

test("renderReadingPassage rejects missing or overlong content with actionable errors", () => {
  assert.throws(
    () => renderReadingPassage({ ...day, title: "" }),
    /title is required/
  );
  assert.throws(
    () => renderReadingPassage({ ...day, readingPassage: `${day.readingPassage} ${"extra ".repeat(220)}` }),
    /readingPassage must contain 150-250 words/
  );
});

test("loadReadingPassageTemplate returns the manifest version with the canonical variant", async () => {
  const template = await loadReadingPassageTemplate();

  assert.equal(template.id, "reading-passage");
  assert.equal(template.filename, "reading-passage.png");
  assert.equal(template.version, "1.0.0");
});
