#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../content/monthly/month-10.json", import.meta.url);
const content = JSON.parse(await readFile(path, "utf8"));

// English translations/adaptations of examples/oct-content-example.rtf.
// The attachment supplies the daily context and quantities; the original
// project contract still governs the operation used at each level.
const plans = [
  ["A Model T has 4 tires. If 3 are mounted, how many more are needed?","4 - 3 = 1","The factory makes 12 cars each hour for 8 hours. How many cars?","12 * 8 = 96","The first Model T was sold in 1908. Compare 2026 with 1908, then count $50 deposits for an $850 car.","2026 - 1908 + 17 = 135",[4,3,12,8,1908,2026,50,850,17]],
  ["A Peanuts strip has 4 panels with 2 dogs each. If 4 are circled, how many are not circled?","8 - 4 = 4","The artist draws 6 panels daily for 3 weeks of 7 days. How many panels?","6 * 3 = 18","Peanuts ran from 1950 to 2000. Find the years, then estimate 365 strips per year for 50 years.","2000 - 1950 + 365 = 415",[4,2,8,4,6,3,7,1950,2000,365,50]],
  ["An engineer has 12 transistors and breaks 4. How many remain usable?","12 - 4 = 8","A radio needs 6 transistors. How many radios can 90 make?","90 / 6 = 15","A transistor cost $8 in 1950 and $0.50 now. What is the saving on 100 pieces?","8 * 100 - 0.5 * 100 = 750",[12,4,6,90,8,1950,0.5,100]],
  ["Sputnik has 4 antennas. How many do 2 identical models have?","4 + 4 = 8","One orbit takes 98 minutes. How long do 2 orbits take?","98 * 2 = 196","Sputnik weighs 83 kg. After one uses a 500-kg load limit, find the remainder and the maximum number of satellites.","500 - 83 + 6 = 423",[4,2,98,83,500,6]],
  ["A teacher has 20 red pens and uses 8. How many remain?","20 - 8 = 12","There are 24 classes with 2 teachers each. How many teachers?","24 * 2 = 48","World Teachers' Day began in 1994. Compare 2026 and 1994, then count 30 students per year for 32 years.","2026 - 1994 + 32 = 64",[20,8,24,2,1994,2026,30,32]],
  ["One windmill has 4 blades. How many do 2 souvenir windmills have?","4 + 4 = 8","A theater has 15 seats in each of 8 rows. How many seats?","15 * 8 = 120","Tickets cost 5 francs and 450 people attend. Subtract 1,200 francs in wages from the income.","450 * 5 - 1200 = 1050",[4,2,15,8,5,450,1200]],
  ["A barcode has 8 black and 7 white lines. How many lines are there?","8 + 7 = 15","Typing takes 12 seconds and scanning takes 2. Each of 10 items is scanned. How many two-second scans?","2 * 10 = 20","A store scans 120 customers' 15 items each hour. How many barcodes?","120 * 15 + 0 = 1800",[8,7,12,2,10,120,15]],
  ["An octopus has 8 arms. How many arms do 2 octopuses have?","8 + 8 = 16","An octopus has 3 hearts. How many hearts do 5 have?","3 * 5 = 15","An adult weighs 50 kg and a young octopus weighs 200 g. Use 1 kg = 1,000 g to find the multiple.","50 * 1000 / 200 = 250",[8,2,3,5,50,200,1000]],
  ["Mia mails 7 letters and Leo mails 9. How many together?","7 + 9 = 16","A carrier delivers 8 boxes with 25 letters each. How many letters?","8 * 25 = 200","An international letter cost 15 cents in 1874 and $1.50 today. How many times the old price is today's 150 cents?","150 / 15 + 0 = 10",[7,9,8,25,15,1874,1.5,150]],
  ["Sam sleeps 9 hours and Jo sleeps 8. How many hours together?","9 + 8 = 17","A walk lasts 30 minutes daily for 14 days. How many minutes?","30 * 14 = 420","A 10,000-step goal follows 3,850 morning and 4,200 afternoon steps. How many remain?","10000 - 3850 - 4200 = 1950",[9,8,30,14,10000,3850,4200]],
  ["A library buys 15 books and lends 7. How many remain?","15 - 7 = 8","Each donation box holds 45 books. How many books are in 6 boxes?","45 * 6 = 270","A foundation supports 500 girls at $120 each per year. What is the yearly budget?","500 * 120 + 0 = 60000",[15,7,45,6,500,120]],
  ["A spacecraft carries 3 astronauts. How many do 2 identical ships carry?","3 + 3 = 6","A 24-hour flight has an experiment every 3 hours. How many experiments?","24 / 3 = 8","A ship travels 670,000 km in 16 orbits. Find the average distance per orbit.","670000 / 16 + 0 = 41875",[3,2,24,3,670000,16]],
  ["A kit has 5 water bottles and 4 food packs. How many in this pair?","5 + 4 = 9","Each class needs 40 food packs. How many do 18 classes need?","40 * 18 = 720","Fifty students use 2 bottles daily. How many days do 1,200 bottles last, and what is three years after 2024?","1200 / 50 / 2 + 2027 = 2039",[5,4,2,40,18,50,1200,2024,3]],
  ["A plane is 9 meters long. How long are 2 parked planes?","9 + 9 = 18","At 1,066 km per hour for 2 hours, how far does it fly?","1066 * 2 = 2132","Sound travels 340 meters per second. Find the distance in 15 seconds and convert using 1,000 m = 1 km.","340 * 15 + 0 = 5100",[9,2,1066,340,15,1000]],
  ["Two students wash for 20 and 15 seconds. What is the total?","20 + 15 = 35","A class of 30 washes 4 times each day. How many washes?","30 * 4 = 120","A soap bar lasts 150 washes. Four people wash 5 times each day. How many days?","150 / 4 / 5 + 0 = 7.5",[20,15,30,4,150,5]],
  ["Disney has 15 pencils, breaks 4, and receives 8 more. How many remain after the break?","15 - 4 = 11","A 7-minute cartoon needs 10,000 drawings at 100 per day. How many days?","10000 / 100 = 100","Disney began in 1923. Compare with 2026 and count complete 5-year celebrations.","2026 - 1923 - 3 = 100",[15,4,8,7,10000,100,1923,2026,5]],
  ["Volunteers collect 25 rice bags and 18 flour bags. How many bags?","25 + 18 = 43","A food bank puts 240 cans into 12 boxes. How many per box?","240 / 12 = 20","A sale has 150 meals at $8 each with a $3 cost. What is the profit?","150 * (8 - 3) = 750",[25,18,240,12,150,8,3]],
  ["A radio plays 3 hours of music and 2 hours of news. How many hours?","3 + 2 = 5","It plays 4 songs each hour for 14 hours. How many songs?","4 * 14 = 56","A 45-minute program airs for 52 weeks. Convert its 2,340 minutes to hours using 60 minutes per hour.","45 * 52 / 60 = 39",[3,2,4,14,45,52,60,2340]],
  ["A shop receives 14 broken toy cars and fixes 9. How many are not fixed?","14 - 9 = 5","A new lamp costs $45 and parts cost $8. Five repaired lamps use 5 parts packs. How many packs?","8 * 5 = 40","A repair takes 45 minutes. In 300 minutes, find complete repairs and minutes left.","300 - 45 * 6 = 30",[14,9,45,8,5,300,30]],
  ["A chart shows 12 apple fans and 8 banana fans. How many people?","12 + 8 = 20","Four classes each record 5 reading groups. How many groups?","4 * 5 = 20","Five step counts total 45,000 steps. What is the average over 5 days?","45000 / 5 + 0 = 9000",[12,8,4,5,45000]],
  ["One lamp lasts 13 hours. How long do 2 lamps last in sequence?","13 + 13 = 26","One 10-watt LED is used in 6 places. How many watts?","10 * 6 = 60","A bulb lasts 15,000 hours at 10 hours daily. Find days and approximate years using 365 days per year.","15000 / 10 / 365 + 0 = 4.109589041095891",[13,2,10,6,15000,365]],
  ["A parachutist starts at 1,000 meters and descends 300. How high now?","1000 - 300 = 700","A jump lasts 120 seconds. How many minutes are in one jump?","120 / 60 = 2","At 5 meters per second, how long is a 1,000-meter descent? Convert 200 seconds to minutes and seconds.","1000 / 5 - 180 = 20",[1000,300,120,60,3,5,200]],
  ["Pelé scores 2 goals in one half and 1 in the other. How many?","2 + 1 = 3","A match lasts 90 minutes. How long are 10 matches?","90 * 10 = 900","Pelé scored 1,280 goals over 20 years and 32 matches per year. Find the average per match.","1280 / 20 / 32 + 0 = 2",[2,1,90,10,1280,20,32]],
  ["Annie Taylor was 63 during her challenge. How old 5 years later?","63 + 5 = 68","Niagara Falls is 51 meters high; at 3 meters per floor, how many floors?","51 / 3 = 17","A barrel drops 51 meters in 3 seconds. Find average m/s and convert with 3,600 seconds per hour.","51 / 3 * 3600 = 61200",[63,5,51,3,3600]],
  ["A painting has 5 blue triangles and 6 red circles. How many shapes?","5 + 6 = 11","Picasso made about 1,800 oil paintings in 30 years. How many per year?","1800 / 30 = 60","Picasso lived from 1881 to 1973. Compare those years with a stated 75-year creative span.","1973 - 1881 + 75 = 167",[5,6,1800,30,1881,1973,75]],
  ["A canal has 8 cargo boats and 5 passenger boats. How many boats?","8 + 5 = 13","A trip covers 8 km each hour. How many kilometers in 20 hours?","8 * 20 = 160","The canal is 584 km long at 8 km per hour. Convert the 73-hour trip to days and hours.","584 / 8 + 0 = 73",[8,5,20,584,73]],
  ["A subway car has 18 passengers. If 6 leave, how many remain?","18 - 6 = 12","A 1904 ticket cost 5 cents. How many tickets can 50 cents buy?","50 / 5 = 10","Today's fare is $2.90 and the old fare was $0.05. Compare the fares and find 2 rides for 22 workdays.","2.9 / 0.05 + 2 * 22 = 102",[18,6,9,1904,5,50,2.9,0.05,22]],
  ["A crown has 7 rays. How many rays do 2 crowns have?","7 + 7 = 14","A visitor climbs 354 steps in 2 equal sections. How many steps per section?","354 / 2 = 177","The statue weighs 225 metric tons. Convert to kilograms and compare with 1.5-ton cars.","225 * 1000 / 1.5 = 150000",[7,2,354,200,225,1000,1.5]],
  ["LOGIN has 5 letters but only LO (2) is sent. How many are missing?","5 - 2 = 3","A signal travels 7.5 Earth circumferences per second at 40,000 km each. How far?","40000 * 7.5 = 300000","A network sends 1,250,000,000 letters per second. Compare with the 2-letter message.","1250000000 / 2 * 1 = 625000000",[5,2,7.5,40000,1250000000]],
  ["Six people hear a drama and 5 neighbors join. How many listeners?","6 + 5 = 11","A 60-minute drama has 2 equal music sections. How many minutes per section?","60 / 2 = 30","About 6,000,000 listen and 1,200,000 panic. What percent is that?","1200000 / 6000000 * 100 = 20",[6,5,60,20,2,6000000,1200000,100]],
  ["A child gets 18 candies and eats 6. How many remain?","18 - 6 = 12","A dinosaur tooth is 30 cm and a palm is 10 cm. How many times longer?","30 / 10 = 3","A dinosaur weighs 60 metric tons and an elephant 5. It eats 400 kg daily for 30 days; find the two requested comparisons.","60 / 5 + 400 * 30 / 1000 = 24",[18,6,4,30,10,60,5,400,30,1000]],
];

for (const [index, day] of content.days.entries()) {
  const [l1, e1, l2, e2, l3, e3, values] = plans[index];
  const event = `${day.title} (${day.eventYear ?? `October ${day.day}`})`;
  const task = (text, level, skill) => ({ pageType: level, skill, prompt: `${event} — ${text.split(". ")[0]}.`, numbersUsed: values.map((value) => ({ value, unit: "classroom quantity", source: "Translated attachment scenario; a classroom model, not an added historical claim." })) });
  day.mathLevels = { level1: task(l1, "level1", "subtraction_or_addition"), level2: task(l2, "level2", "multiplication_or_division"), level3: task(l3, "level3", "multi_step_time_money_or_conversion") };
  day.mathLevels.level1.numbersUsed = values.filter((value) => Math.abs(value) <= 50).slice(0, 3).map((value) => ({ value, unit: "classroom quantity", source: "Translated attachment scenario." }));
  day.mathLevels.level2.numbersUsed = values.slice(2, Math.min(6, values.length)).map((value) => ({ value, unit: "classroom quantity", source: "Translated attachment scenario." }));
  day.mathLevels.level3.numbersUsed = values.slice(-Math.min(5, values.length)).map((value) => ({ value, unit: "classroom quantity", source: "Translated attachment scenario." }));
  day.answers = {
    level1: { equation: e1, work: `Use the direct addition or subtraction in the translated attachment example: ${e1}.`, finalAnswer: `The direct-operation answer is ${e1.split("=").pop().trim()}.` },
    level2: { equation: e2, work: `Use the multiplication or division in the translated attachment example: ${e2}.`, finalAnswer: `The multiplication-or-division answer is ${e2.split("=").pop().trim()}.` },
    level3: { equation: e3, work: `Follow the translated attachment scenario and its unit or comparison facts: ${e3}.`, finalAnswer: `The multi-step check evaluates to ${e3.split("=").pop().trim()}; see the prompt for the requested units.` },
  };
  const source = content.sources.find((item) => day.sourceIds.includes(item.id));
  day.readingPassage = `Have you ever wondered how a calendar date can open a big story? On October ${day.day}, ${day.trivia[0]} This story focuses on one memorable detail from ${day.title}. The class checks ${source?.publisher ?? "the source"} before treating a date or name as a fact. Then students use a friendly classroom model connected to the topic. The numbers ${values.join(", ")} appear in today's three math tasks; they are practice quantities unless the passage clearly identifies them as historical measurements. That difference matters: history tells us what happened, while a worksheet gives us a fair way to practice arithmetic. Look for the challenge, mistake, invention, animal, or celebration in the story. Ask which detail came from the source and which number was added for practice. Read the title aloud, circle useful clues, and explain how the math grows from the same topic. Level 1 uses one direct addition or subtraction step. Level 2 uses multiplication or division. Level 3 combines steps, units, time, money, or a comparison. A careful history detective checks both the story and the answer before sharing the result.`;
}
for (const level of ["level1", "level2", "level3"]) {
  content.answerKey[level] = content.days.map((day) => ({
    entryId: `10-${String(day.day).padStart(2, "0")}:${level}`,
    date: `10-${String(day.day).padStart(2, "0")}`,
    level,
    ...day.answers[level],
  }));
}
await writeFile(path, `${JSON.stringify(content, null, 2)}\n`);
console.log("October content regenerated from the translated attachment examples");
