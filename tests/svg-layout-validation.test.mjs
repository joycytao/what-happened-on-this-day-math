import assert from "node:assert/strict";
import test from "node:test";

import { validateSvgTextGeometry } from "../src/svg-layout-validation.mjs";

test("layout validation rejects a prompt whose measured width crosses the card boundary", () => {
  const svg = '<svg><rect x="145" y="402" width="1265" height="280"/><text data-content="prompt" x="220" y="515" font-size="46">The Statue of Liberty\'s crown has 7 rays. How many rays</text></svg>';
  const errors = validateSvgTextGeometry(svg, { pageType: "level1", date: "10-01" });
  assert.match(errors.join("\n"), /prompt exceeds its card text area/);
});

test("layout validation accepts centered date text and ignores the footer transform color", () => {
  const svg = '<svg><text x="772" y="365" font-size="47" text-anchor="middle">OCT</text><text x="1405" y="1825" fill="#f18a5b" font-size="78">6</text></svg>';
  assert.deepEqual(validateSvgTextGeometry(svg, { pageType: "level1", date: "10-01" }), []);
});
