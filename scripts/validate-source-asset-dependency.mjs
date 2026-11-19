import { parseSourceAssetDependencies, renderSourceAssetDependency, validateSourceAssetDependency } from "../src/source-asset-dependency.mjs";

const available = { id: "release", paths: ["releases/december-2026.manifest.json"], required: true, status: "available" };
const missing = { id: "source-assets", paths: [], required: true, status: "missing", reason: "not supplied" };
const errors = [];
if (!validateSourceAssetDependency(available).valid) errors.push("available fixture must validate");
if (!validateSourceAssetDependency(missing).valid) errors.push("missing fixture must retain a valid blocker contract");
if (!parseSourceAssetDependencies(renderSourceAssetDependency(available)).satisfied) errors.push("available fixture must be satisfied");
if (parseSourceAssetDependencies(renderSourceAssetDependency(missing)).satisfied) errors.push("missing fixture must be unresolved");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Source asset dependency contract passed");
