import fs from "node:fs";

export function loadThumbnailRegressionFixtures({
  fixturesPath = "examples/thumbnail-regression-fixtures.example.json",
  contractPath = "examples/thumbnail-template-contract.example.json",
} = {}) {
  const registry = JSON.parse(fs.readFileSync(fixturesPath, "utf8"));
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const errors = [];
  const seen = new Set();
  for (const fixture of registry.fixtures ?? []) {
    if (seen.has(fixture.id)) errors.push(`duplicate fixture id: ${fixture.id}`);
    seen.add(fixture.id);
    const template = contract.templates?.[fixture.thumbnail_type];
    if (!template) {
      errors.push(`${fixture.id}: unknown thumbnail type ${fixture.thumbnail_type}`);
      continue;
    }
    for (const region of fixture.fixed_regions ?? []) {
      if (!template.fixed_regions[region]) errors.push(`${fixture.id}: unknown fixed region ${region}`);
    }
    for (const region of fixture.variable_regions ?? []) {
      if (!template.variable_regions[region]) errors.push(`${fixture.id}: unknown variable region ${region}`);
    }
    if (!Array.isArray(fixture.failure_modes) || fixture.failure_modes.length === 0) {
      errors.push(`${fixture.id}: failure_modes are required`);
    }
  }
  return { valid: errors.length === 0, errors, fixtures: registry.fixtures ?? [] };
}
