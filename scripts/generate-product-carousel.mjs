import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const month = option("--month", "november").toLowerCase();
const outputDir = path.resolve(root, option("--output-dir", `output/social/product-carousels/${month}`));
const mediaRoot = path.join(root, "social", "product-carousel-template", "media");
const monthPages = path.join(root, "reports", `${month}-worksheet-pages`);
const coverPath = path.join(root, "output", "worksheet-cover", `${month}-worksheet-cover.png`);

const variants = {
  evergreen: {
    scene: "november-family-scene.png",
    hook: "A full month of math practice, ready to use.",
    support: "Reading passages, three levels, and answer keys in one packet.",
    badge: "",
  },
  "campaign-aligned": {
    scene: "november-weekend-scene.png",
    hook: "November math practice is ready.",
    support: "Get the full packet before the month begins.",
    badge: "AVAILABLE NOW",
  },
};

const esc = (value) => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const uri = (file) => pathToFileURL(file).href;
const page = (day, type) => path.join(monthPages, `${String(day).padStart(2, "0")}-${type}.svg`);
const exists = async (file) => { try { await fs.access(file); return true; } catch { return false; } };
const image = (src, className = "") => `<img class="${className}" src="${esc(uri(src))}" />`;
const readingDays = async () => (await fs.readdir(monthPages))
  .filter((file) => /^\d{2}-reading-passage\.svg$/.test(file))
  .map((file) => Number(file.slice(0, 2)))
  .sort((a, b) => a - b);

async function validateInputs() {
  const required = [coverPath, path.join(mediaRoot, "profile-back-view.png")];
  const days = await readingDays();
  if (![28, 29, 30, 31].includes(days.length)) throw new Error(`Expected 28-31 monthly reading passages, found ${days.length}`);
  for (const day of days) required.push(page(day, "reading-passage"));
  for (const day of [1, 2]) for (const level of ["level1", "level2", "level3"]) required.push(page(day, level));
  for (const file of required) if (!(await exists(file))) throw new Error(`Missing Product Carousel asset: ${path.relative(root, file)}`);
  return days;
}

function htmlFor(variantName, variant, days) {
  const levelPages = [1, 2, 3, 1, 2, 3].map((level, i) => page(i < 3 ? 1 : 2, `level${level}`));
  const readingPages = days.slice(0, 6).map((day) => page(day, "reading-passage"));
  const productLabels = ["COVER", "READING", "LEVEL 1", "LEVEL 3"];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:1080px 1350px;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#202020;font-family:'Avenir Next','Helvetica Neue',Arial,sans-serif;color:#203245}
  .slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:#F6F0E2}.header{position:absolute;left:96px;right:96px;top:48px;height:58px;border-bottom:2px solid #D8C6B2;display:flex;justify-content:space-between;align-items:flex-start;color:#6F6B66;font-size:20px;font-weight:500}.eyebrow{font-weight:700;font-size:20px;letter-spacing:.5px}.title{font-size:58px;line-height:1.1;font-weight:800;letter-spacing:-1.5px;margin:0}.sub{font-family:Georgia,serif;color:#6F6B66;font-size:28px;margin-top:18px}.content{position:absolute;left:96px;right:96px;top:155px}.cards{display:grid;grid-template-columns:repeat(3,240px);gap:44px 60px;position:absolute;top:350px;left:4px}.card{width:240px;height:290px;border-radius:10px;object-fit:contain;background:#FFFCF7;box-shadow:0 5px 12px rgba(32,50,69,.09)}.label{font-size:15px;font-weight:700;color:#6F6B66;margin-top:18px}.cover-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.cover-shade{position:absolute;inset:0;background:rgba(32,50,69,.34)}.cover-copy{position:absolute;left:70px;top:155px;width:900px;color:#FFFCF7}.cover-copy .pill{display:inline-block;background:rgba(246,240,226,.95);color:#203245;border-radius:28px;padding:13px 28px;font-size:18px;font-weight:800}.cover-copy .badge{display:block;width:max-content;margin-top:16px;background:#203245;color:#F6F0E2;border-radius:24px;padding:11px 30px;font-size:16px;font-weight:800}.cover-copy h1{font-size:58px;line-height:1.15;max-width:900px;margin:74px 0 18px;letter-spacing:-1.5px}.cover-copy .badge+h1{margin-top:28px}.cover-copy p{font-family:Georgia,serif;font-size:28px;margin:0}.included{position:absolute;left:72px;bottom:403px;color:#FFFCF7;font-size:18px;font-weight:800;text-shadow:0 2px 4px rgba(32,50,69,.75)}.product-strip{position:absolute;left:78px;right:78px;bottom:108px;display:grid;grid-template-columns:repeat(4,190px);gap:54px}.product-strip img{width:190px;height:260px;object-fit:contain;border-radius:10px;background:#FFFCF7;box-shadow:0 5px 12px rgba(32,50,69,.16);padding:8px}.product-strip .label{color:#FFFCF7;text-align:center;text-shadow:0 2px 4px rgba(32,50,69,.75)}.cta{text-align:center}.profile{width:250px;height:250px;border-radius:50%;object-fit:cover;position:absolute;top:150px;left:415px;border:10px solid #D8C6B2;box-shadow:inset 0 0 0 4px #203245}.cta-handle{position:absolute;top:430px;left:0;right:0;text-align:center;color:#6F6B66;font-size:21px}.cta h1{position:absolute;top:520px;left:100px;right:100px;margin:0;font-size:44px;line-height:1.2}.cta p{position:absolute;top:710px;left:100px;right:100px;font-family:Georgia,serif;color:#6F6B66;font-size:25px}.cta .button{position:absolute;top:790px;left:260px;width:560px;background:#203245;color:#F6F0E2;border-radius:44px;padding:27px;font-size:23px;font-weight:800}.cta .detail{position:absolute;top:950px;left:100px;right:100px;font-size:25px;line-height:1.35}.footer{position:absolute;left:96px;right:96px;bottom:104px;border-top:2px solid #D8C6B2;padding-top:32px;text-align:center;font-size:18px;font-weight:800}
  </style></head><body>
  <section class="slide"><img class="cover-bg" src="${esc(uri(path.join(mediaRoot, variant.scene)))}"><div class="cover-shade"></div><div class="cover-copy"><div class="pill">NOVEMBER MATH PACKET</div>${variant.badge ? `<div class="badge">${esc(variant.badge)}</div>` : ""}<h1>${esc(variant.hook)}</h1><p>${esc(variant.support)}</p></div><div class="included">INCLUDED IN THE PACKET</div><div class="product-strip">${[coverPath, page(1, "reading-passage"), page(1, "level1"), page(1, "level3")].map((src, i) => `<div>${image(src)}<div class="label">${productLabels[i]}</div></div>`).join("")}</div><div class="header" style="z-index:2;color:#FFFCF7;border-color:rgba(246,240,226,.5)"><span>@engineermom.worksheets</span><span>01/04</span></div></section>
  <section class="slide"><div class="header"><span>@engineermom.worksheets</span><span>02/04</span></div><div class="content"><div class="eyebrow">01&nbsp;&nbsp; THE PACKET</div><h1 class="title" style="margin-top:42px">ONE PACKET. THREE LEVELS.</h1><div class="sub">A closer look at the daily practice inside.</div><div class="cards">${levelPages.map((src, i) => `<div>${image(src, "card")}<div class="label">DAY ${i < 3 ? "01" : "02"} · LEVEL ${(i % 3) + 1}</div></div>`).join("")}</div></div></section>
  <section class="slide"><div class="header"><span>@engineermom.worksheets</span><span>03/04</span></div><div class="content"><div class="eyebrow">02&nbsp;&nbsp; THE READING PASSAGES</div><h1 class="title" style="margin-top:42px">${days.length} DAILY READINGS.</h1><div class="sub">Six sample pages from the monthly reading library.</div><div class="cards">${readingPages.map((src, i) => `<div>${image(src, "card")}<div class="label">DAY ${String(i + 1).padStart(2, "0")} · READING PASSAGE</div></div>`).join("")}</div></section>
  <section class="slide cta"><div class="header"><span>@engineermom.worksheets</span><span>04/04</span></div>${image(path.join(mediaRoot, "profile-back-view.png"), "profile")}<div class="cta-handle">@engineermom.worksheets</div><h1>WANT THE NOVEMBER<br>MATH PACKET?</h1><p>Find the full packet through the link in bio.</p><div class="button">VISIT THE LINK IN BIO</div><div class="detail">A full month of math practice,<br>with daily reading passages, three levels,<br>and answer keys.</div><div class="footer">SAVE&nbsp;&nbsp;•&nbsp;&nbsp;SHARE&nbsp;&nbsp;•&nbsp;&nbsp;FOLLOW</div></section>
  </body></html>`;
}

const days = await validateInputs();
const browser = await chromium.launch({ headless: true });
try {
  for (const [variantName, variant] of Object.entries(variants)) {
    const dir = path.join(outputDir, variantName);
    await fs.mkdir(dir, { recursive: true });
    const pageBrowser = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    const htmlPath = path.join("/private/tmp", `product-carousel-${month}-${variantName}.html`);
    await fs.writeFile(htmlPath, htmlFor(variantName, variant, days));
    await pageBrowser.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    const slides = await pageBrowser.locator(".slide").all();
    for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}.png`) });
    await pageBrowser.close();
    await fs.rm(htmlPath, { force: true });
    await fs.writeFile(path.join(dir, "manifest.json"), `${JSON.stringify({ schemaVersion: "product-carousel/v1", month, variant: variantName, canvas: "1080x1350", slideCount: 4, templateId: "product-carousel-v1", sourceAssets: { cover: path.relative(root, coverPath), slide2: levelPagesForManifest(), slide3: readingPagesForManifest(days), cta: "social/product-carousel-template/media/profile-back-view.png" }, readingPassageCount: days.length, readingSampleCount: Math.min(days.length, 6), hook: variant.hook, support: variant.support, campaignBadge: variant.badge || null, qa: { humanReviewRequired: true, answerKeyExposed: false, worksheetContentCropped: false } }, null, 2)}\n`);
  }
} finally { await browser.close(); }

function levelPagesForManifest() { return [1, 2, 3, 1, 2, 3].map((level, i) => path.relative(root, page(i < 3 ? 1 : 2, `level${level}`))); }
function readingPagesForManifest(days) { return days.slice(0, 6).map((day) => path.relative(root, page(day, "reading-passage"))); }

console.log(JSON.stringify({ month, outputDir: path.relative(root, outputDir), variants: Object.keys(variants), slideCount: 4 }, null, 2));
