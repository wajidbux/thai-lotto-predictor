const fs = require("fs");
const path = require("path");

const HISTORY_PATH = path.join(__dirname, "..", "data", "history.json");

function readHistory() {
  return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

function loadPredictions() {
  delete require.cache[require.resolve("../src/services/predictionService")];
  delete require.cache[require.resolve("../src/services/historyStore")];

  const { getPredictions } = require("../src/services/predictionService");
  return getPredictions();
}

// Store original
const original = readHistory();
const count = Math.min(5, original.length);

console.log("=== BACKTEST: Last " + count + " Draws ===\n");

const results = [];

try {
  for (let i = 0; i < count; i++) {
    const actual = original[i];
    const priorHistory = original.slice(i + 1);

    // Write prior history only (no data leakage)
    writeHistory(priorHistory);

    const pred = loadPredictions();
    const m = pred.markets;

    const firstPrize = actual.prizes.first.number[0];
    const last2 = actual.prizes.last_two.number;
    const last3 = firstPrize.slice(-3);
    const last4 = firstPrize.slice(-4);
    const last5 = firstPrize.slice(-5);
    const front3 = actual.prizes.last_three_front.numbers;
    const back3 = actual.prizes.last_three_back.numbers;
    const allBottom3 = [...front3, ...back3];

    // Check each market
    const hits = {
      top6: m.top6.includes(firstPrize),
      top5: m.top5.includes(last5),
      top4: m.top4.includes(last4),
      top3: m.top3.includes(last3),
      top2: m.top2.includes(last2),
      bottom3: m.bottom3.some(p => allBottom3.includes(p)),
      bottom2: m.bottom2.includes(last2),
      twoRow: (() => {
        const d = last3.split("");
        const pairs = [
          d[0]+d[1], d[0]+d[2], d[1]+d[2],
          d[1]+d[0], d[2]+d[0], d[2]+d[1]
        ];
        return m.twoRow.some(p => pairs.includes(p));
      })(),
      runningTop: m.runningTop.some(d => last3.includes(d)),
      runningBottom: m.runningBottom.some(d => last2.includes(d))
    };

    const hitCount = Object.values(hits).filter(Boolean).length;
    const total = Object.keys(hits).length;

    results.push({
      date: actual.date,
      firstPrize,
      last2,
      allBottom3,
      hits,
      hitCount,
      total,
      hotNumbers: pred.hotNumbers.join(""),
      coldNumbers: pred.coldNumbers.join(""),
      top6: m.top6.join(", "),
      top3: m.top3.join(", "),
      top2: m.top2.join(", ")
    });

    const bar = "█".repeat(hitCount) + "░".repeat(total - hitCount);
    console.log(`Draw ${i + 1}: ${actual.date} | 1st: ${firstPrize} | L2: ${last2}`);
    console.log(`  Hot: ${pred.hotNumbers.join(",")}  Cold: ${pred.coldNumbers.join(",")}`);
    console.log(`  Predicted Top6: ${m.top6.join(", ")}`);
    console.log(`  Predicted Top2: ${m.top2.join(", ")}`);
    console.log(`  Hits: ${bar} ${hitCount}/${total}`);
    console.log("");
  }
} finally {
  // Always restore original history, even if something crashes
  writeHistory(original);
}

// Summary
console.log("=== SUMMARY ===");
console.log("");

const headers = ["Date", "1st Prize", "T6", "T5", "T4", "T3", "T2", "B3", "B2", "2R", "RT", "RB", "Score"];
console.log(headers.join(" | "));
console.log("-".repeat(100));

results.forEach(r => {
  const h = r.hits;
  const scoreStr = r.hitCount + "/" + r.total;
  const row = [
    r.date,
    r.firstPrize,
    h.top6 ? "✅" : "❌",
    h.top5 ? "✅" : "❌",
    h.top4 ? "✅" : "❌",
    h.top3 ? "✅" : "❌",
    h.top2 ? "✅" : "❌",
    h.bottom3 ? "✅" : "❌",
    h.bottom2 ? "✅" : "❌",
    h.twoRow ? "✅" : "❌",
    h.runningTop ? "✅" : "❌",
    h.runningBottom ? "✅" : "❌",
    scoreStr
  ];
  console.log(row.join(" | "));
});

console.log("");
const avg = results.reduce((s, r) => s + r.hitCount, 0) / results.length;
console.log(`Average hit rate: ${avg.toFixed(1)}/${results[0]?.total || 0} (${results[0] ? (avg / results[0].total * 100).toFixed(0) : 0}%)`);

// Top 2 specific
const top2Hits = results.filter(r => r.hits.top2).length;
console.log(`Top 2 accuracy: ${top2Hits}/${results.length} (${(top2Hits / results.length * 100).toFixed(0)}%)`);

const top3Hits = results.filter(r => r.hits.top3).length;
console.log(`Top 3 accuracy: ${top3Hits}/${results.length} (${(top3Hits / results.length * 100).toFixed(0)}%)`);
