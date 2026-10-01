import fs from 'node:fs';
import path from 'node:path';
import { validateMonthlyReleaseManifest } from './monthly-release-manifest.mjs';
import { validateMonthlyContentV2 } from './monthly-content-v2-validation.mjs';
import { validateTptMetadataTaxonomy } from './tpt-metadata-taxonomy.mjs';

const ADAPTER_SCHEMA_VERSION = '1.0.0';

function fail(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function monthName(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, value - 1, 1)));
}

function monthNumber(value) {
  const names = Array.from({ length: 12 }, (_, index) => monthName(index + 1).toLowerCase());
  return names.indexOf(String(value).toLowerCase()) + 1;
}

function packageArtifact(manifest, id) {
  return manifest.artifacts.find((artifact) => artifact.id === id);
}

export function buildTptMetadata({ manifest, content, taxonomy, releaseManifestPath = 'examples/monthly-release-manifest.example.json', contentPath = 'content/monthly/month-10.json' }) {
  const errors = [];
  const manifestResult = validateMonthlyReleaseManifest(manifest);
  if (!manifestResult.valid) manifestResult.errors.forEach((error) => fail(errors, `release manifest: ${error}`));
  const expectedMonth = monthNumber(manifest?.month);
  const dayCount = Array.isArray(content?.days) ? content.days.length : 0;
  const contentResult = validateMonthlyContentV2(content, { month: expectedMonth, dayCount });
  if (!contentResult.valid) contentResult.errors.forEach((error) => fail(errors, `content: ${error}`));
  const taxonomyResult = validateTptMetadataTaxonomy(taxonomy);
  if (!taxonomyResult.valid) taxonomyResult.errors.forEach((error) => fail(errors, `taxonomy: ${error}`));
  if (manifest?.month !== monthName(expectedMonth)) fail(errors, 'manifest month must be a valid English month name');
  if (content?.month !== expectedMonth) fail(errors, 'content month must match the release manifest');
  if (errors.length) return { valid: false, errors };

  const month = manifest.month;
  const productId = manifest.packageId;
  const finalPdf = packageArtifact(manifest, 'finalPdf');
  const cover = packageArtifact(manifest, 'coverPdfPage');
  const pageMappings = packageArtifact(manifest, 'pageMappings');
  const thumbnailQa = packageArtifact(manifest, 'thumbnailQa');
  const coreKeywords = [
    ...taxonomy.keywordGroups.math,
    ...taxonomy.keywordGroups.history,
    ...taxonomy.keywordGroups.differentiation,
    `${month.toLowerCase()} math worksheets`
  ].filter((keyword, index, all) => all.indexOf(keyword) === index);
  const payload = {
    adapterSchemaVersion: ADAPTER_SCHEMA_VERSION,
    idempotencyKey: `${productId}@${manifest.packageVersion}`,
    package: {
      id: productId,
      version: manifest.packageVersion,
      month,
      year: manifest.year,
      sourceCommit: manifest.sourceCommit,
      releaseStatus: manifest.releaseStatus
    },
    listing: {
      title: `${month} Morning Work Math`,
      subjectArea: 'Math',
      supportingAreas: ['Reading', 'History'],
      resourceType: 'Worksheets',
      gradeBand: 'Grades 1-5',
      format: 'Printable PDF',
      productRelationship: 'monthly standalone',
      description: `A ${dayCount}-day ${month} packet with daily historical mini-stories and three leveled math word problems. It includes a worksheet coversheet, printable practice pages, and separate answer keys for teacher use.`,
      contents: {
        dailyModules: dayCount,
        levels: ['Level 1', 'Level 2', 'Level 3'],
        answerKeys: 3,
        cover: cover?.path,
        finalPdf: finalPdf?.path
      },
      keywords: coreKeywords,
      tags: coreKeywords,
      sourceReferences: {
        pageMappings: pageMappings?.path,
        thumbnailQa: thumbnailQa?.path,
        releaseManifest: releaseManifestPath,
        monthlyContent: contentPath
      }
    },
    provenance: {
      package: { source: releaseManifestPath, fields: ['packageId', 'packageVersion', 'month', 'year', 'sourceCommit', 'releaseStatus'] },
      contents: { source: contentPath, fields: ['days.length', 'mathLevels', 'answerKey'] },
      assets: { source: releaseManifestPath, fields: ['artifacts.finalPdf', 'artifacts.coverPdfPage', 'artifacts.pageMappings', 'artifacts.thumbnailQa'] },
      taxonomy: { source: 'examples/tpt-metadata-taxonomy.example.json', fields: ['titleRules', 'keywordGroups', 'relationshipRules'] }
    },
    claims: {
      unsupported: [],
      humanQaRequired: true,
      publicationStatus: 'review'
    }
  };
  return { valid: true, errors: [], payload };
}

export function renderTptMetadataMarkdown(payload) {
  const listing = payload.listing;
  return [
    `# ${listing.title}`,
    '',
    `- Package: \`${payload.package.id}@${payload.package.version}\``,
    `- Format: ${listing.format}`,
    `- Grade band: ${listing.gradeBand}`,
    `- Product relationship: ${listing.productRelationship}`,
    '',
    listing.description,
    '',
    '## Contents',
    '',
    `- ${listing.contents.dailyModules} daily modules`,
    '- Three differentiated levels',
    '- Three answer-key pages',
    `- Final PDF: \`${listing.contents.finalPdf}\``,
    '',
    '## Keywords',
    '',
    listing.keywords.map((keyword) => `- ${keyword}`).join('\n'),
    '',
    '> Publication remains pending human QA.'
  ].join('\n');
}

export function writeTptMetadataOutputs({ payload, outputDir }) {
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'metadata.json');
  const markdownPath = path.join(outputDir, 'listing.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(markdownPath, `${renderTptMetadataMarkdown(payload)}\n`);
  return { jsonPath, markdownPath };
}

export { ADAPTER_SCHEMA_VERSION };
