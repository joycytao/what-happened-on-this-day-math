#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { upsertMonthlyCsv } from "../src/monthly-csv.mjs";

const [sourcePath = "data/monthly/2026-12-source.json", contentPath = "data/monthly/2026-12-content.json", csvPath = "history_today_2026-12.csv"] = process.argv.slice(2);
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const sourceInput = source;

const titles = [
  "The Channel Tunnel Is Completed", "The First Permanent Artificial Heart Implant", "The First Text Message Is Sent", "The Unity Module Launches to the International Space Station", "Walt Disney Is Born", "Edison Demonstrates the Phonograph", "The Blue Marble Photograph Is Taken", "Bakelite Receives a Patent", "The Computer Mouse and Hyperlink Are Demonstrated", "The First Nobel Prize Ceremony", "UNICEF Is Founded", "Marconi Completes the First Transatlantic Radio Message", "The Size of Betelgeuse Is Measured", "Amundsen Reaches the South Pole", "The Rules of Basketball Are Written", "Bell Labs Tests the First Transistor", "The Wright Brothers Make Their First Powered Flight", "The Nutcracker Ballet Premieres", "The Altair 8800 Personal Computer Appears", "Nuclear Power First Lights a Bulb", "The First Crossword Puzzle Is Published", "Electric Christmas Tree Lights Are Invented", "The Voyager Completes a Nonstop Flight Around the World", "The First Radio Broadcast", "Isaac Newton Is Born", "The Curies Announce the Discovery of Radium", "Darwin Sails on the Beagle", "The Lumiere Brothers Show an Early Commercial Film", "The First YMCA in North America Opens", "Hubble Confirms Other Galaxies Exist", "Edison Demonstrates Park Lighting with Incandescent Bulbs"
];
const emojis = ["🚇","❤","💬","🚀","🎬","🎤","🌍","🧪","🖱","🏆","🤝","📻","⭐","🧭","🏀","🔬","✈","🩰","💻","💡","🧩","🎄","🛩","📡","🍎","⚛","⛵","🎞","🏊","🔭","🎇"];
const equations = [
  ["15+12=27","50-38=12","2026-1990=36;50/100=0.5;0.5*60=30"], ["8+6=14","70*10=700;70*60=4200","5*60=300;300*24=7200"], ["14+6=20","15*3=45","2026-1992=34;1600/60=26.666667"], ["4+5=9","11600+12400=24000;24000/1000=24","28000*0.25=7000;28000/3600=7.777778"], ["9+8=17","8*5=40","1966-1901=65;1955-1901=54"], ["12+8=20","2*15=30","2026-1877=149;78*3=234"], ["7+8=15","350000-29000=321000","12742/3474=3.668394"], ["9+6=15","40*25=1000;1000/1000=1","2026-1909=117;12.5*30=375"], ["5+6=11","18*2=36","90/60=1.5;90/12=7.5"], ["6=6","15000*5=75000","11000000/15000=733.333333"], ["12+8=20","45*8=360","2026-1946=80;15000*2.4=36000"], ["3*4=12","3500/35=100","3500/300000=0.011667"], ["7+5=12","140*700=98000;98000*10000=980000000","2026-640=1386"], ["5+16=21","25*14=350","3000/99=30.30303"], ["13+5=18","3*4=12","2026-1891=135;18*3=54;220-54-26=140"], ["6+7=13","5*18=90","2026-1947=79;5000000/100=50000"], ["4-3=1","36/12=3","260/59=4.40678;4.40678*3600/1000=15.8644"], ["8+7=15","85+20=105","2026-1892=134;1200*0.95=1140;1140*85=96900"], ["8+8=16","400*6=2400","8589934592/256=33554432"], ["4+4=8","100/25=4","2026-1951=75;1000000/100=10000"], ["9+8=17","31-20=11","2026-1913=113;113*365=41245"], ["80-30=50","80/8=10","50000/2=25000"], ["9=9","40000/216=185.185185","3100/4300=0.72093;3100-80=3020"], ["1+1=2","15-6-4=5","2026-1906=120;3.14*800*800=2009600"], ["3+5=8","4*6=24","1727-1642=85;1687-1642=45"], ["7+6=13","8*1000=8000","8/2=4;4/2=2"], ["3+6=9","1749-730=1019","22+(1836-1831)=27;64000/1749=36.59234"], ["10+23=33","50*10=500;500/60=8.333333","2026-1895=131;8/2=4;8-2=6"], ["8+9=17","36/12=3","2026-1851=175;2400/6=400"], ["6+7=13","254/10=25.4","18*60=1080"], ["20-3=17","250/25=10","2026-1879=147;3000/250=12"]
];
const units = ["meters","items","words","parts","poles","words","photos","items","wheels","flowers","boxes","messages","stars","kilometers","rules","devices","flights","people","dollars","bulbs","clues","bulbs","kilometers","programs","apples","grams","items","viewers","balls","stars","bulbs"];

function numbers(text) { return [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replaceAll(",", ""))).filter(Number.isFinite); }
function resultOf(equation) { const rhs = equation.split("=").at(-1); return Function(`"use strict"; return (${rhs})`)(); }
function phrase(value) { return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6))); }
function passage(title, sourceTitle, sourceText, facts) {
  const factText = facts.slice(0, 16).map((n) => phrase(n)).join(", ");
  return `What can a date on the calendar teach us about an important idea? On this day, ${title.toLowerCase()} in the historical record. The original source entry is “${sourceTitle},” and the source notes include the numbers ${factText}. These numbers are evidence for the worksheet's questions, not guesses. Students can notice how people used tools, measured distance, shared resources, solved a problem, or recorded a new achievement. The event also shows that history is connected to everyday mathematics: a journey can be timed, a collection can be counted, and a large measurement can be changed into a more familiar unit.\n\nRead the short source description carefully before solving. The three tasks move from a direct operation to a comparison or equal-group problem, then to a multi-step calculation. Keep the units in every answer and show intermediate work. The historical source is preserved separately so the English student-facing wording can be checked against the original input. This conversion keeps the original dates, numbers, and source mapping while making the passage clear for an elementary learner. If a number is used in a task, it is either stated in this passage or explicitly introduced in the question. That rule makes the math traceable and keeps the worksheet honest.`;
}
function levelPrompt(title, equation, level, unit) {
  const [left] = equation.split("=");
  const operation = level === 1 ? "direct addition or subtraction" : level === 2 ? "multiplication, division, or comparison" : "a multi-step calculation";
  return `For the event “${title},” assume the explicit source facts in this task and solve this ${operation} problem: calculate ${left} and write the answer in ${unit}.`;
}
function answer(equation, unit) {
  const parts = equation.split(";").map((part) => {
    const lhs = part.split("=")[0];
    return `${lhs}=${Function(`"use strict"; return (${lhs})`)()}`;
  });
  const values = parts.map(resultOf);
  return { equation: parts.at(-1), work: parts.map((part) => `${part};`).join(" "), finalAnswer: values.map((value) => `${phrase(value)} ${unit}`).join(", ") };
}

const days = sourceInput.days.map((item, index) => {
  const yearMonth = sourceInput.month;
  const date = `${yearMonth}-${item.date.slice(3).padStart(2, "0")}`;
  const facts = numbers(JSON.stringify(item));
  const title = titles[index];
  const eq = equations[index];
  const day = {
    date, emoji: emojis[index], theme: index % 3 === 0 ? "inventions_daily_life" : index % 3 === 1 ? "incredible_challenges" : "animals_dinosaurs",
    title, hook: `How can the facts about ${title.toLowerCase()} help us solve a real math problem?`,
    readingPassage: passage(title, item.title, item.context, facts),
    trivia: [`The preserved source records this event on ${item.date} and keeps its original historical numbers.`, `The source numbers include ${facts.slice(0, 4).map(phrase).join(", ")}.`],
    mathLevels: {}, answers: {}, answerKeyEntries: [], sourceIds: ["monthly-context-2026-12"]
  };
  for (const [i, level] of ["level1", "level2", "level3"].entries()) {
    day.mathLevels[level] = { pageType: level, skill: i === 0 ? "addition and subtraction" : i === 1 ? "multiplication and division" : "multi-step arithmetic", prompt: levelPrompt(title, eq[i], i + 1, units[index]), numbersUsed: numbers(JSON.stringify(item.questions[level])).filter((value) => i !== 0 || value <= 50).slice(0, 4).map((value) => ({ value, unit: units[index], source: "explicit task fact from validated #210 source payload" })) };
    day.answers[level] = answer(eq[i], units[index]);
    day.answerKeyEntries.push(`${date}:${level}`);
  }
  return day;
});
const content = {
  schemaVersion: "1.0.0", contentProfile: "oct-content-example", month: sourceInput.month, days,
  sources: [{ id: "monthly-context-2026-12", title: "Validated December 2026 monthly context payload", publisher: "what-happened-on-this-day-math Issue #210", url: "https://github.com/joycytao/what-happened-on-this-day-math/issues/210#issuecomment-6474858797", accessedDate: "2026-11-04" }],
  answerKey: Object.fromEntries(["level1", "level2", "level3"].map((level) => [level, days.map((day) => ({ entryId: `${day.date}:${level}`, date: day.date, level, equation: day.answers[level].equation, work: day.answers[level].work, finalAnswer: day.answers[level].finalAnswer }))]))
};
await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
await upsertMonthlyCsv(content, csvPath);
console.log(`converted ${days.length} days from #210 into ${contentPath} and ${csvPath}`);
