import { buildPlanFromEventFile } from "../src/agent-handoff-queue.mjs";

const eventIndex = process.argv.indexOf("--event");
const outputIndex = process.argv.indexOf("--output");
const eventPath = eventIndex >= 0 ? process.argv[eventIndex + 1] : "";
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : "";

if (!eventPath || !outputPath) {
  console.error("Usage: node scripts/build-agent-handoff-plan.mjs --event <path> --output <path>");
  process.exit(1);
}

await buildPlanFromEventFile(eventPath, outputPath);
