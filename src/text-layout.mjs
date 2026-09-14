const GLYPH_WIDTHS = {
  " ": 0.278, "!": 0.278, '"': 0.355, "#": 0.556, "$": 0.556, "%": 0.889, "&": 0.667, "'": 0.191,
  "(": 0.333, ")": 0.333, "*": 0.389, "+": 0.584, ",": 0.278, "-": 0.333, ".": 0.278, "/": 0.278,
  "0": 0.556, "1": 0.556, "2": 0.556, "3": 0.556, "4": 0.556, "5": 0.556, "6": 0.556, "7": 0.556,
  "8": 0.556, "9": 0.556, ":": 0.278, ";": 0.278, "<": 0.584, "=": 0.584, ">": 0.584, "?": 0.556,
  "@": 1.015, "A": 0.667, "B": 0.667, "C": 0.722, "D": 0.722, "E": 0.667, "F": 0.611, "G": 0.778,
  "H": 0.722, "I": 0.278, "J": 0.5, "K": 0.667, "L": 0.556, "M": 0.833, "N": 0.722, "O": 0.778,
  "P": 0.667, "Q": 0.778, "R": 0.722, "S": 0.667, "T": 0.611, "U": 0.722, "V": 0.667, "W": 0.944,
  "X": 0.667, "Y": 0.667, "Z": 0.611, "[": 0.278, "\\": 0.278, "]": 0.278, "^": 0.469, "_": 0.556,
  "a": 0.556, "b": 0.556, "c": 0.5, "d": 0.556, "e": 0.556, "f": 0.278, "g": 0.556,
  "h": 0.556, "i": 0.222, "j": 0.222, "k": 0.5, "l": 0.222, "m": 0.833, "n": 0.556, "o": 0.556,
  "p": 0.556, "q": 0.556, "r": 0.333, "s": 0.5, "t": 0.278, "u": 0.556, "v": 0.5, "w": 0.722,
  "x": 0.5, "y": 0.5, "z": 0.5, "{": 0.334, "|": 0.26, "}": 0.334, "~": 0.584,
};

export function estimateTextWidth(text, fontSize, options = {}) {
  const { bold = false } = options;
  const visible = String(text).replace(/\*\*/g, "");
  const width = Array.from(visible).reduce((sum, character) => sum + (GLYPH_WIDTHS[character] ?? 0.7), 0) * fontSize;
  // Keep a conservative margin for platform/font-renderer differences from Arial.
  return width * (bold ? 1.145 : 1.08);
}

export function estimateMarkupWidth(markup, fontSize, options = {}) {
  const segments = String(markup).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return segments.reduce((sum, segment) => {
    const bold = segment.startsWith("**") && segment.endsWith("**");
    return sum + estimateTextWidth(bold ? segment.slice(2, -2) : segment, fontSize, { ...options, bold });
  }, 0);
}

export function wrapTextToWidth(text, { maxWidth, fontSize, maxLines, label = "text" }) {
  const words = String(text).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (estimateMarkupWidth(word, fontSize) > maxWidth) {
      if (line) {
        lines.push(line);
        line = "";
      }
      const pieces = splitWordToWidth(word, maxWidth, fontSize);
      lines.push(...pieces.slice(0, -1));
      line = pieces.at(-1) ?? "";
      continue;
    }
    const candidate = line ? line + " " + word : word;
    if (line && estimateMarkupWidth(candidate, fontSize) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    throw new Error(label + " exceeds the template text area; " + lines.length + " lines would be required (maximum " + maxLines + ")");
  }
  return lines;
}

function splitWordToWidth(word, maxWidth, fontSize) {
  const pieces = [];
  let piece = "";
  for (const character of Array.from(word)) {
    const candidate = piece + character;
    if (piece && estimateMarkupWidth(candidate, fontSize) > maxWidth) {
      pieces.push(piece);
      piece = character;
    } else {
      piece = candidate;
    }
  }
  if (piece) pieces.push(piece);
  return pieces;
}
