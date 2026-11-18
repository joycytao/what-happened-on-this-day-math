import crypto from "node:crypto";

const RELEASE_FIELDS = ["packageId", "packageVersion", "month", "year", "sourceCommit"];

function releasePayload(manifest = {}) {
  const payload = Object.fromEntries(RELEASE_FIELDS.map((field) => [field, manifest[field] ?? null]));
  payload.artifacts = [...(manifest.artifacts ?? [])]
    .map(({ id, kind, path, sha256, required }) => ({ id, kind, path, sha256, required }))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return payload;
}

export function buildMonthlyReleaseIdentity(manifest) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(releasePayload(manifest)))
    .digest("hex");
}

export function getMonthlyReleaseIdentityPayload(manifest) {
  return releasePayload(manifest);
}
