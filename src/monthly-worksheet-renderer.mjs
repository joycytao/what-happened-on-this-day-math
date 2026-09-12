import { loadLevel1Template, renderLevel1 } from "./level1-renderer.mjs";
import { loadLevel2Template, renderLevel2 } from "./level2-renderer.mjs";
import { loadLevel3Template, renderLevel3 } from "./level3-renderer.mjs";
import { loadReadingPassageTemplate, renderReadingPassage } from "./reading-passage-renderer.mjs";
import { validateMonthlyContentV2 } from "./monthly-content-v2-validation.mjs";

const PAGE_TYPES = ["reading-passage", "level1", "level2", "level3"];
const WIDTH = 1545;
const HEIGHT = 2000;

export async function renderOctoberWorksheetPages(content, options = {}) {
  const validation = validateMonthlyContentV2(content);
  if (!validation.valid) throw new Error(`cannot render invalid October content: ${validation.errors.join("; ")}`);

  const [readingTemplate, level1Template, level2Template, level3Template] = await Promise.all([
    loadReadingPassageTemplate(options.root),
    loadLevel1Template(options.root),
    loadLevel2Template(options.root),
    loadLevel3Template(options.root),
  ]);
  const pages = [];
  for (const day of content.days) {
    const monthDay = `${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
    const rendererDate = `2000-${monthDay}`;
    const rendererDay = { ...day, date: rendererDate };
    const rendered = [
      ["reading-passage", () => renderReadingPassage(rendererDay, { template: readingTemplate })],
      ["level1", () => renderLevel1(rendererDay, { template: level1Template })],
      ["level2", () => renderLevel2(rendererDay, { template: level2Template })],
      ["level3", () => renderLevel3(rendererDay, { template: level3Template })],
    ];
    for (const [pageType, render] of rendered) {
      let svg;
      try {
        svg = render();
      } catch (error) {
        throw new Error(`failed to render ${monthDay} ${pageType}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
      pages.push({
        pageNumber: pages.length + 1,
        month: day.month,
        day: day.day,
        date: monthDay,
        pageType,
        width: WIDTH,
        height: HEIGHT,
        svg: stripSyntheticYear(svg, day.month, day.day),
      });
    }
  }
  return pages;
}

function stripSyntheticYear(svg, month, day) {
  return svg.replace(/ data-date="2000-(\d{2})-(\d{2})"/g, ` data-month="${String(month).padStart(2, "0")}" data-day="${String(day).padStart(2, "0")}"`);
}

export { PAGE_TYPES, WIDTH, HEIGHT };
