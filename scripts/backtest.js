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

// Old positional approach replicas (for side-by-side comparison)
function getPositionalPredictions(slicedPrizes, numPositions, candidateCount) {
  // Generic positional prediction: use first numPositions digits of each prize
  const posCounts = Array.from({ length: numPositions }, () => Array(10).fill(0));
  
  slicedPrizes.forEach((prize, idx) => {
    if (!prize || prize.length < numPositions) return;
    const weight = Math.max(1, Math.round((1 - idx / slicedPrizes.length) * 4 + 1));
    for (let pos = 0; pos < numPositions; pos++) {
      const digit = parseInt(prize[pos], 10);
      if (!isNaN(digit)) posCounts[pos][digit] += weight;
    }
  });
  
  const ranked = posCounts.map(counts =>
    counts.map((c, d) => ({ digit: String(d), count: c }))
      .sort((a, b) => b.count - a.count || Number(a.digit) - Number(b.digit))
      .map(item => item.digit)
  );
  
  const predictions = [];
  let offset = 0;
  while (predictions.length < candidateCount && offset < 100) {
    let value = '';
    for (let pos = 0; pos < numPositions; pos++) {
      const pool = ranked[pos];
      value += pool[offset % pool.length];
    }
    if (!predictions.includes(value)) predictions.push(value);
    offset++;
  }
  
  const recent = slicedPrizes.slice(0, 5).filter(Boolean);
  const combined = [...new Set([...predictions, ...recent])];
  return combined.slice(0, 5);
}

function getPositionalT3(firstPrizes) {
  return getPositionalPredictions(firstPrizes.map(n => n.slice(-3)), 3, 20);
}

function getPositionalT4(firstPrizes) {
  return getPositionalPredictions(firstPrizes.map(n => n.slice(-4)), 4, 10);
}

function getPositionalT5(firstPrizes) {
  return getPositionalPredictions(firstPrizes.map(n => n.slice(-5)), 5, 10);
}

// Payout values per market (from user's betting pattern)
const PAYOUTS = {
  top6: 50000,
  top5: 25000,
  top4: 5000,
  fourRow: 225,
  fourReverse: 225,
  top3: 900,
  threeRow: 150,
  threeReverse: 150, // assumed same as threeRow
  top2: 90,
  bottom3: 225,
  bottom2: 90,
  twoReverse: 45, // assumed: half of top2 (90) since 2 permutations
  twoRow: 12,
  runningTop: 3,
  runningBottom: 4
};

// Store original
const original = readHistory();
const count = Math.min(200, original.length);

console.log("=== BACKTEST: Last " + count + " Draws ===\n");

const results = [];

// Track old vs new T3, T4, T5
let oldT3Hits = 0, newT3Hits = 0;
let oldT4Hits = 0, newT4Hits = 0;
let oldT5Hits = 0, newT5Hits = 0;

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

    // Compute old positional predictions for T3, T4, T5 comparison
    const priorPrizes = priorHistory.map(d => d?.prizes?.first?.number?.[0]).filter(Boolean);
    
    const oldT3Preds = getPositionalT3(priorPrizes);
    const oldT3Hit = oldT3Preds.includes(last3);
    const newT3Hit = m.top3.includes(last3);
    if (oldT3Hit) oldT3Hits++;
    if (newT3Hit) newT3Hits++;

    const oldT4Preds = getPositionalT4(priorPrizes);
    const oldT4Hit = oldT4Preds.includes(last4);
    const newT4Hit = m.top4.includes(last4);
    if (oldT4Hit) oldT4Hits++;
    if (newT4Hit) newT4Hits++;

    const oldT5Preds = getPositionalT5(priorPrizes);
    const oldT5Hit = oldT5Preds.includes(last5);
    const newT5Hit = m.top5.includes(last5);
    if (oldT5Hit) oldT5Hits++;
    if (newT5Hit) newT5Hits++;

    // Check each market
    const hits = {
      top6: m.top6.includes(firstPrize),
      top5: m.top5.includes(last5),
      fourRow: m.fourRow ? m.fourRow.some(p => {
        const d = last4.split("");
        const allPairs = new Set();
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            if (i !== j) allPairs.add(d[i] + d[j]);
          }
        }
        return p.covers.some(c => allPairs.has(c));
      }) : false,
      fourReverse: m.fourReverse ? m.fourReverse.some(p => p.covers.includes(last4)) : false,
      top4: m.top4.includes(last4),
      top3: m.top3.includes(last3),
      threeRow: m.threeRow ? m.threeRow.some(p => {
        const d = last3.split("");
        const allPairs = new Set([
          d[0]+d[1], d[0]+d[2], d[1]+d[0],
          d[1]+d[2], d[2]+d[0], d[2]+d[1]
        ]);
        return p.covers.some(c => allPairs.has(c));
      }) : false,
      threeReverse: m.threeReverse ? m.threeReverse.some(p => p.covers.includes(last3)) : false,
      top2: m.top2.includes(last2),
      bottom3: m.bottom3.some(p => allBottom3.includes(p)),
      bottom2: m.bottom2.includes(last2),
      twoReverse: m.twoReverse ? m.twoReverse.some(p => p.covers.includes(last2)) : false,
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

    // Weighted score: sum of payouts for each hit market
    const payoutValue = Object.entries(hits)
      .filter(([_, hit]) => hit)
      .reduce((sum, [market]) => sum + (PAYOUTS[market] || 0), 0);

    // Include fourReverse in the summary row

    results.push({
      date: actual.date,
      firstPrize,
      last2,
      last3,
      last4,
      last5,
      allBottom3,
      hits,
      hitCount,
      total,
      payoutValue,
      oldT3Hit, newT3Hit,
      oldT4Hit, newT4Hit,
      oldT5Hit, newT5Hit,
      oldT3Preds: oldT3Preds.join(", "),
      newT3Preds: m.top3.join(", "),
      oldT4Preds: oldT4Preds.join(", "),
      newT4Preds: m.top4.join(", "),
      oldT5Preds: oldT5Preds.join(", "),
      newT5Preds: m.top5.join(", "),
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
    console.log(`  Hits: ${bar} ${hitCount}/${total}  |  Payout: ${payoutValue.toLocaleString()} THB`);
    console.log("");
  }
} finally {
  // Always restore original history, even if something crashes
  writeHistory(original);
}

// ──────────────────────────────────────────────────
// PRIMARY: Hit Rate by Market (Accuracy-Focused)
// ──────────────────────────────────────────────────

const marketNames = [
  { key: "top6",         label: "T6 (Top 6)" },
  { key: "top5",         label: "T5 (Top 5)" },
  { key: "fourRow",      label: "4R (4 Row)" },
  { key: "fourReverse",  label: "4Rev (4 Reverse)" },
  { key: "top4",         label: "T4 (Top 4)" },
  { key: "top3",         label: "T3 (Top 3)" },
  { key: "threeRow",     label: "3R (3 Row)" },
  { key: "threeReverse", label: "3Rev (3 Reverse)" },
  { key: "top2",         label: "T2 (Top 2)" },
  { key: "bottom3",      label: "B3 (Bottom 3)" },
  { key: "bottom2",      label: "B2 (Bottom 2)" },
  { key: "twoReverse",   label: "2Rev (2 Reverse)" },
  { key: "twoRow",       label: "2Rw (2 Row)" },
  { key: "runningTop",   label: "RT (Run Top)" },
  { key: "runningBottom",label: "RB (Run Bottom)" }
];

const totalDraws = results.length;

console.log("=== HIT RATE BY MARKET ===\n");
console.log("Market       | Hits  | Draws | Hit Rate| Payout | Value Score");
console.log("-".repeat(70));

const marketStats = marketNames.map(m => {
  const hits = results.filter(r => r.hits[m.key]).length;
  const pct = (hits / totalDraws * 100).toFixed(1);
  const payout = PAYOUTS[m.key] || 0;
  const valueScore = hits * payout;
  return { ...m, hits, pct, payout, valueScore };
});

marketStats.forEach(m => {
  const hitStr = String(m.hits).padStart(5);
  const drawStr = String(totalDraws).padStart(6);
  const pctStr = (m.pct + "%").padStart(8);
  const payStr = m.payout.toLocaleString().padStart(7);
  const valStr = m.valueScore.toLocaleString().padStart(12);
  const bar = "█".repeat(Math.round(m.hits / totalDraws * 20)) + "░".repeat(20 - Math.round(m.hits / totalDraws * 20));
  console.log(`${m.label.padEnd(13)} | ${hitStr} | ${drawStr} | ${pctStr} | ${payStr} | ${valStr}  ${bar}`);
});

console.log("");
const avgHits = results.reduce((s, r) => s + r.hitCount, 0) / totalDraws;
const totalMarkets = results[0]?.total || 15;
console.log(`Average hit rate: ${avgHits.toFixed(1)}/${totalMarkets} (${(avgHits / totalMarkets * 100).toFixed(0)}%)`);
console.log("");

// ──────────────────────────────────────────────────
// T3 METHOD COMPARISON (Old Positional vs New Direct Frequency)
// ──────────────────────────────────────────────────

console.log("=== T3 METHOD COMPARISON ===\n");
console.log(`Old (Positional): ${oldT3Hits}/${totalDraws} (${(oldT3Hits/totalDraws*100).toFixed(1)}%)`);
console.log(`New (Direct Freq): ${newT3Hits}/${totalDraws} (${(newT3Hits/totalDraws*100).toFixed(1)}%)`);
console.log(`Improvement: ${newT3Hits - oldT3Hits > 0 ? "✅ +" + (newT3Hits - oldT3Hits) + " hits" : newT3Hits - oldT3Hits === 0 ? "➡️ Same" : "❌ " + (newT3Hits - oldT3Hits) + " hits"}`);
console.log("");
console.log("Draw | Date       | Last 3 | Old (Positional)          | New (Direct Freq)         | Hit?");
console.log("-".repeat(85));

results.forEach((r, i) => {
  const oldMatch = r.oldT3Hit ? "✅" : "❌";
  const newMatch = r.newT3Hit ? "✅" : "❌";
  const matchStr = r.oldT3Hit || r.newT3Hit ? (r.oldT3Hit && r.newT3Hit ? "BOTH✅" : r.oldT3Hit ? "OLD✅" : "NEW✅") : "";
  const drawStr = String(i + 1).padStart(4);
  console.log(`${drawStr} | ${r.date.padEnd(12)} | ${r.last3.padEnd(6)} | ${oldMatch} ${r.oldT3Preds.padEnd(30)} | ${newMatch} ${r.newT3Preds.padEnd(30)} | ${matchStr}`);
});

console.log("");

// ──────────────────────────────────────────────────
// T4 METHOD COMPARISON (Old Positional vs New Direct Frequency)
// ──────────────────────────────────────────────────

console.log("=== T4 METHOD COMPARISON ===\n");
console.log(`Old (Positional): ${oldT4Hits}/${totalDraws} (${(oldT4Hits/totalDraws*100).toFixed(1)}%)`);
console.log(`New (Direct Freq): ${newT4Hits}/${totalDraws} (${(newT4Hits/totalDraws*100).toFixed(1)}%)`);
console.log(`Improvement: ${newT4Hits - oldT4Hits > 0 ? "✅ +" + (newT4Hits - oldT4Hits) + " hits" : newT4Hits - oldT4Hits === 0 ? "➡️ Same" : "❌ " + (newT4Hits - oldT4Hits) + " hits"}`);

if (newT4Hits > 0 || oldT4Hits > 0) {
  console.log("");
  console.log("Draw | Date       | Last 4 | Old (Positional)          | New (Direct Freq)         | Hit?");
  console.log("-".repeat(85));
  results.forEach((r, i) => {
    if (!r.oldT4Hit && !r.newT4Hit) return;
    const oldMatch = r.oldT4Hit ? "✅" : "❌";
    const newMatch = r.newT4Hit ? "✅" : "❌";
    const matchStr = r.oldT4Hit && r.newT4Hit ? "BOTH✅" : r.oldT4Hit ? "OLD✅" : "NEW✅";
    const drawStr = String(i + 1).padStart(4);
    console.log(`${drawStr} | ${r.date.padEnd(12)} | ${r.last4.padEnd(6)} | ${oldMatch} ${r.oldT4Preds.padEnd(30)} | ${newMatch} ${r.newT4Preds.padEnd(30)} | ${matchStr}`);
  });
} else {
  console.log("(Neither method hit on any draw)");
}

console.log("");

// ──────────────────────────────────────────────────
// T5 METHOD COMPARISON (Old Positional vs New Direct Frequency)
// ──────────────────────────────────────────────────

console.log("=== T5 METHOD COMPARISON ===\n");
console.log(`Old (Positional): ${oldT5Hits}/${totalDraws} (${(oldT5Hits/totalDraws*100).toFixed(1)}%)`);
console.log(`New (Direct Freq): ${newT5Hits}/${totalDraws} (${(newT5Hits/totalDraws*100).toFixed(1)}%)`);
console.log(`Improvement: ${newT5Hits - oldT5Hits > 0 ? "✅ +" + (newT5Hits - oldT5Hits) + " hits" : newT5Hits - oldT5Hits === 0 ? "➡️ Same" : "❌ " + (newT5Hits - oldT5Hits) + " hits"}`);

if (newT5Hits > 0 || oldT5Hits > 0) {
  console.log("");
  console.log("Draw | Date       | Last 5 | Old (Positional)          | New (Direct Freq)         | Hit?");
  console.log("-".repeat(85));
  results.forEach((r, i) => {
    if (!r.oldT5Hit && !r.newT5Hit) return;
    const oldMatch = r.oldT5Hit ? "✅" : "❌";
    const newMatch = r.newT5Hit ? "✅" : "❌";
    const matchStr = r.oldT5Hit && r.newT5Hit ? "BOTH✅" : r.oldT5Hit ? "OLD✅" : "NEW✅";
    const drawStr = String(i + 1).padStart(4);
    console.log(`${drawStr} | ${r.date.padEnd(12)} | ${r.last5.padEnd(6)} | ${oldMatch} ${r.oldT5Preds.padEnd(30)} | ${newMatch} ${r.newT5Preds.padEnd(30)} | ${matchStr}`);
  });
} else {
  console.log("(Neither method hit on any draw)");
}

console.log("");

// Per-draw summary table (compact)
console.log("=== PER-DRAW DETAIL ===\n");
const headers = ["Date", "1st Prize", "Score", "Payout", "Hits"];
console.log(headers.join(" | "));
console.log("-".repeat(70));

results.forEach(r => {
  const hitMarkets = Object.entries(r.hits).filter(([_, hit]) => hit).map(([k]) => k);
  const abbrev = hitMarkets.map(k => {
    const m = marketNames.find(mn => mn.key === k);
    return m ? m.label.split(" ")[0] : k;
  }).join(",");
  console.log(`${r.date.padEnd(12)} | ${r.firstPrize.padEnd(8)} | ${(r.hitCount + "/" + r.total).padEnd(6)} | ${r.payoutValue.toLocaleString().padStart(7)} | ${abbrev || "-"}`);
});

// ──────────────────────────────────────────────────
// SECONDARY: Payout Stats
// ──────────────────────────────────────────────────

console.log("");
console.log("=== PAYOUT (Secondary) ===\n");

const totalPayout = results.reduce((s, r) => s + r.payoutValue, 0);
const avgPayout = totalPayout / totalDraws;
const maxPayout = Math.max(...results.map(r => r.payoutValue));

console.log(`Total payout (1 THB/market): ${totalPayout.toLocaleString()} THB`);
console.log(`  Across: ${totalDraws} draws`);
console.log(`  Average per draw: ${avgPayout.toLocaleString()} THB`);
console.log(`  Cost per draw: ${Object.keys(PAYOUTS).length} THB (1 THB × ${Object.keys(PAYOUTS).length} markets)`);
console.log(`  Net per draw: +${(avgPayout - Object.keys(PAYOUTS).length).toFixed(1)} THB`);
console.log(`  Best draw: ${maxPayout.toLocaleString()} THB`);
console.log(`  Worst draw: ${Math.min(...results.map(r => r.payoutValue)).toLocaleString()} THB`);
console.log("");
const profitableDraws = results.filter(r => r.payoutValue > Object.keys(PAYOUTS).length).length;
console.log(`  Profitable draws: ${profitableDraws}/${totalDraws} (${(profitableDraws / totalDraws * 100).toFixed(0)}%)`);
console.log(`  Losing draws: ${totalDraws - profitableDraws}/${totalDraws} (${((totalDraws - profitableDraws) / totalDraws * 100).toFixed(0)}%)`);

// Top value markets
console.log("");
console.log("=== TOP VALUE MARKETS ===");
const sortedByValue = [...marketStats].sort((a, b) => b.valueScore - a.valueScore);
sortedByValue.forEach((m, i) => {
  console.log(`  ${i + 1}. ${m.label.padEnd(13)} ${m.hits}/${totalDraws} hits × ${m.payout.toLocaleString()} THB = ${m.valueScore.toLocaleString()} THB total value`);
});
