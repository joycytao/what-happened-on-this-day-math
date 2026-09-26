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
  return `<g data-illustration="turkey" data-illustration-center="772.5,1120" data-turkey-features="fan-tail,body,head,beak,wattle,feet" transform="translate(154.5 224) scale(.8)" fill="none" stroke="#FF8A00" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <g data-tail-feathers="7">
      <path d="M696 1090 C617 1049 560 965 567 858 C653 867 722 923 744 1011"/>
      <path d="M704 1050 C650 949 647 834 704 748 C778 804 804 898 782 997"/>
      <path d="M744 1010 C728 892 773 779 855 731 C900 822 880 930 821 1018"/>
      <path d="M801 1010 C820 886 901 804 995 792 C1008 899 955 993 873 1050"/>
      <path d="M844 1040 C909 943 1018 905 1100 943 C1081 1042 997 1102 899 1095"/>
      <path d="M655 1098 C563 1082 482 1015 459 918 C552 898 645 946 702 1030"/>
      <path d="M891 1088 C969 1050 1068 1072 1120 1140 C1043 1198 944 1195 872 1146"/>
    </g>
    <path data-turkey-body="pear-shaped" d="M650 1120 C642 1058 684 1018 738 1026 C748 1007 773 995 801 1004 C831 1014 846 1040 844 1068 C894 1101 916 1173 895 1248 C870 1338 812 1388 746 1380 C672 1371 628 1298 631 1218 C632 1180 638 1145 650 1120 Z"/>
    <circle data-turkey-head="round" cx="772.5" cy="1002" r="67"/>
    <path data-turkey-beak d="M834 1002 L903 1024 L834 1044"/>
    <path data-turkey-wattle d="M712 1038 C674 1046 666 1080 697 1092 C675 1119 695 1146 730 1128"/>
    <circle cx="797" cy="989" r="7" fill="#FF8A00"/>
    <path d="M716 1215 C745 1238 798 1238 829 1212 M713 1260 C747 1283 800 1282 832 1257"/>
    <path data-turkey-feet d="M716 1352 L698 1424 L673 1450 M822 1352 L845 1424 L870 1450"/>
    <path d="M673 1450 L642 1450 M673 1450 L688 1428 M870 1450 L901 1450 M870 1450 L855 1428"/>
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
    // Render the SVG as document content so nested logo data URLs and line art
    // are parsed by Chromium before the screenshot/PDF capture begins.
    await page.setContent(`<style>html,body{margin:0;padding:0;background:#FEFFEF}</style>${svg}`);
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
