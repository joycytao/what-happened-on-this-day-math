import { estimateMarkupWidth } from "./text-layout.mjs";

const XML_ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

export function validateSvgTextGeometry(svg, { pageType, date, width = 1545, height = 2000 } = {}) {
  const errors = [];
  const textPattern = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  for (const match of svg.matchAll(textPattern)) {
    const attributes = parseAttributes(match[1]);
    if (attributes.fill === "#f18a5b" || attributes.transform) continue;
    const x = Number(attributes.x);
    const y = Number(attributes.y);
    const fontSize = Number(attributes["font-size"]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(fontSize)) continue;
    const text = decodeXml(stripTags(match[2]));
    const textWidth = Number.isFinite(Number(attributes.textLength))
      ? Number(attributes.textLength)
      : estimateMarkupWidth(xmlToMarkup(match[2]), fontSize, { bold: attributes["font-weight"] === "700" });
    const left = attributes["text-anchor"] === "middle" ? x - textWidth / 2 : x;
    const right = attributes["text-anchor"] === "end" ? x : left + textWidth;
    const top = y - fontSize * 0.85;
    const bottom = y + fontSize * 0.2;
    const label = text.replace(/\s+/g, " ").trim().slice(0, 80) || "<empty text>";
    if (left < 0 || right > width) errors.push(`${date} ${pageType} text exceeds page bounds: "${label}" (x ${Math.round(left)}..${Math.round(right)})`);
    if (top < 0 || bottom > height) errors.push(`${date} ${pageType} text baseline exceeds page bounds: "${label}" (y ${Math.round(top)}..${Math.round(bottom)})`);
    const content = attributes["data-content"];
    if (content === "prompt" && right > 1390) errors.push(`${date} ${pageType} prompt exceeds its card text area: "${label}" (right ${Math.round(right)}, maximum 1390)`);
    if ((content === "article" || content === "body") && right > 1390) errors.push(`${date} ${pageType} article text exceeds its text area: "${label}" (right ${Math.round(right)}, maximum 1390)`);
  }
  return errors;
}

function parseAttributes(source) {
  return Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function xmlToMarkup(value) {
  return decodeXml(value
    .replace(/<tspan\b[^>]*font-weight="700"[^>]*>([\s\S]*?)<\/tspan>/g, "**$1**")
    .replace(/<[^>]+>/g, ""));
}

function decodeXml(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => XML_ENTITIES[entity]);
}
