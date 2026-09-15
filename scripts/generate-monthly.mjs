#!/usr/bin/env node
import { generateMonthly, parseMonthlyArguments } from "../src/monthly-orchestrator.mjs";
try {
  const { month } = parseMonthlyArguments(process.argv.slice(2));
  console.log(JSON.stringify(await generateMonthly({ month }), null, 2));
} catch (error) {
  console.error(JSON.stringify({ valid: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
}
