import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(join(root, "assets/templates/v1/manifest.json"), "utf8"));
const errors = [];

for (const variant of manifest.canonicalVariants) {
  const path = join(root, "assets/templates/v1", variant.filename);
  let bytes;
  try { bytes = await readFile(path); } catch { errors.push(`${variant.filename} is missing`); continue; }
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") errors.push(`${variant.filename} is not a PNG`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== variant.dimensions.width || height !== variant.dimensions.height) errors.push(`${variant.filename} dimensions are ${width}x${height}; expected ${variant.dimensions.width}x${variant.dimensions.height}`);
  const provenance = manifest.provenance.find((entry) => entry.filename === variant.filename);
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (provenance?.sha256 !== hash) errors.push(`${variant.filename} SHA-256 does not match recorded provenance`);
}

for (const provenance of manifest.provenance) {
  const path = join(root, "assets/templates/v1", provenance.filename);
  try {
    const hash = createHash("sha256").update(await readFile(path)).digest("hex");
    if (hash !== provenance.sha256) errors.push(`${provenance.filename} SHA-256 does not match recorded provenance`);
  } catch {
    errors.push(`${provenance.filename} is missing`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`template assets valid: ${manifest.canonicalVariants.length} canonical variants, version ${manifest.version}`);
}
