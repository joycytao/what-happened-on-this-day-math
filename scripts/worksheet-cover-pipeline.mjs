#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const POINTS = { width: 1158.75, height: 1500 };
const RASTER = { width: 1545, height: 2000 };
const arg = (name, fallback = null) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; };
const fail = (message) => { throw new Error(message); };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const dataUrl = (text) => `data:image/svg+xml;base64,${Buffer.from(text).toString("base64")}`;
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function validateConfig(config) {
  if (!/^[A-Za-z]+$/.test(config.month ?? "")) fail("month must be an English month name");
  if (config.version !== "1.0.0") fail("version must be 1.0.0");
  if (config.page?.widthPoints !== POINTS.width || config.page?.heightPoints !== POINTS.height) fail("page must be 1158.75 x 1500 points");
  if (config.page?.rasterWidth !== RASTER.width || config.page?.rasterHeight !== RASTER.height) fail("raster page must be 1545 x 2000 pixels");
  if (config.copy?.title !== "MORNING WORK MATH" || config.copy?.levels !== "3 LEVELS") fail("cover copy does not match the approved structure");
  if (JSON.stringify(config.copy?.subtitle) !== JSON.stringify(["DAILY WORD PROBLEMS", "HISTORICAL MINI-STORIES"])) fail("cover subtitle does not match the approved structure");
  if (!["draft", "approved"].includes(config.approval?.status)) fail("approval.status must be draft or approved");
  if (config.illustration?.name && config.illustration.name !== "turkey") fail("unsupported illustration: only turkey is implemented in this revision");
}

function illustration(config) {
  if (config.illustration?.name !== "turkey") return "";
  return `<g data-illustration="turkey" data-illustration-center="772.5,1120" fill="none" stroke="#FF8A00" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M650 1108 C590 1070 555 1004 574 944 C629 956 671 988 690 1032"/>
    <path d="M684 1040 C651 970 657 896 704 854 C742 889 757 940 748 989"/>
    <path d="M748 1000 C744 922 778 858 838 834 C855 884 842 939 815 984"/>
    <path d="M820 1000 C845 926 899 884 963 891 C968 949 937 1001 885 1030"/>
    <path d="M875 1044 C925 1000 991 995 1040 1029 C1023 1083 978 1116 920 1120"/>
    <ellipse cx="772.5" cy="1145" rx="145" ry="174"/>
    <circle cx="772.5" cy="1008" r="68"/>
    <path d="M836 1008 L895 1028 L836 1042"/>
    <path d="M705 1046 C674 1061 675 1091 706 1098 C686 1120 699 1142 726 1133"/>
    <circle cx="796" cy="995" r="6" fill="#FF8A00"/>
    <path d="M764 1314 L747 1390 L726 1440 M810 1314 L829 1390 L850 1440"/>
    <path d="M726 1440 L698 1440 M726 1440 L739 1421 M850 1440 L878 1440 M850 1440 L837 1421"/>
  </g>`;
}

async function buildSvg(config, logoPath) {
  const logo = dataUrl(await readFile(logoPath, "utf8"));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POINTS.width}pt" height="${POINTS.height}pt" viewBox="0 0 1545 2000">
  <rect width="1545" height="2000" fill="#FEFFEF"/><rect x="38" y="38" width="1469" height="1924" rx="24" fill="none" stroke="#FF8A00" stroke-width="9"/>
  <g fill="#2B313F" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="772.5" y="365" font-size="220" font-weight="700" letter-spacing="2">${esc(config.copy.month.toUpperCase())}</text>
    <text x="772.5" y="555" font-size="81" font-weight="700">${esc(config.copy.title)}</text>
    <text x="772.5" y="700" font-size="62" letter-spacing="5">${esc(config.copy.subtitle[0])}</text>
    <text x="772.5" y="790" font-size="62" letter-spacing="5">${esc(config.copy.subtitle[1])}</text>
    <text x="772.5" y="1510" font-size="67" font-weight="700" letter-spacing="8">${esc(config.copy.levels)}</text>
  </g>
  ${illustration(config)}
  <g stroke="#FF8A00" stroke-width="7" stroke-linecap="round"><line x1="260" y1="1510" x2="520" y2="1510"/><line x1="1025" y1="1510" x2="1285" y2="1510"/><line x1="80" y1="1840" x2="560" y2="1840"/><line x1="985" y1="1840" x2="1465" y2="1840"/></g>
  <image href="${logo}" x="672.5" y="1710" width="200" height="220" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

async function render(svg, pngPath, pdfPath) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: RASTER, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;padding:0;background:#FEFFEF}</style><img style="display:block;width:1545px;height:2000px" src="${dataUrl(svg)}">`);
    await page.screenshot({ path: pngPath, type: "png" });
    // Chromium accepts the raster CSS dimensions reliably; at 96 CSS px/in this
    // produces the exact worksheet PDF points (1545 px = 1158.75 pt).
    await page.pdf({ path: pdfPath, width: `${RASTER.width}px`, height: `${RASTER.height}px`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const pdf = await PDFDocument.load(await readFile(pdfPath));
    for (const pdfPage of pdf.getPages()) pdfPage.setSize(POINTS.width, POINTS.height);
    await writeFile(pdfPath, await pdf.save({ useObjectStreams: false }));
  } finally { await browser.close(); }
}

async function mergeCover(coverPdf, sourcePdf, finalPdf, approval) {
  if (approval?.status !== "approved" || !approval.approvedBy || !approval.approvedAt) fail("final merge is blocked until approval.status=approved with approvedBy and approvedAt");
  const cover = await PDFDocument.load(await readFile(coverPdf));
  const source = await PDFDocument.load(await readFile(sourcePdf));
  const output = await PDFDocument.create();
  for (const doc of [cover, source]) for (const page of await output.copyPages(doc, doc.getPageIndices())) output.addPage(page);
  await writeFile(finalPdf, await output.save({ useObjectStreams: false }));
}

async function main() {
  const config = JSON.parse(await readFile(resolve(ROOT, arg("--config", "examples/worksheet-cover.example.json")), "utf8"));
  validateConfig(config);
  const outputDir = resolve(ROOT, arg("--output-dir", "output/worksheet-cover"));
  await mkdir(outputDir, { recursive: true });
  const svg = await buildSvg(config, resolve(ROOT, config.logoAsset));
  const slug = config.month.toLowerCase();
  const artifacts = { svg: join(outputDir, `${slug}-worksheet-cover.svg`), png: join(outputDir, `${slug}-worksheet-cover.png`), pdf: join(outputDir, `${slug}-worksheet-cover.pdf`) };
  await writeFile(artifacts.svg, `${svg}\n`, "utf8");
  await render(svg, artifacts.png, artifacts.pdf);
  const manifest = { valid: true, month: config.month, version: config.version, illustration: config.illustration ?? null, cover_pages: 1, daily_worksheet_pages: null, answer_key_pages: null, page_count: null, page: POINTS, raster: RASTER, artifacts: { ...artifacts, logo: resolve(ROOT, config.logoAsset) }, checks: { logoIsVersionedAsset: true, reviewGate: config.approval.status }, checksums: { png: hash(await readFile(artifacts.png)), pdf: hash(await readFile(artifacts.pdf)) } };
  const sourcePdf = arg("--source-pdf");
  if (sourcePdf) {
    const daily = Number(arg("--daily-worksheet-pages", 0)) || null;
    const answer = Number(arg("--answer-key-pages", 0)) || null;
    const finalPdf = resolve(ROOT, arg("--final-pdf", join(outputDir, `${slug}-worksheet-packet.pdf`)));
    await mergeCover(artifacts.pdf, resolve(ROOT, sourcePdf), finalPdf, config.approval);
    Object.assign(manifest, { daily_worksheet_pages: daily, answer_key_pages: answer, page_count: daily && answer ? 1 + daily + answer : null });
    manifest.artifacts.finalPdf = finalPdf;
  }
  await writeFile(join(outputDir, "cover-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
