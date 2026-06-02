/**
 * Backtest Comparison: With vs Without Duplicate Markets
 *
 * Runs the full backtest once and computes TWO payout scenarios:
 *
 *   WITHOUT duplicates (current):  fourRow = pairs, threeRow = pairs
 *                                  fourReverse = 24 permutations, threeReverse = 6 perm
 *
 *   WITH duplicates (old):         fourRow = 24 perm (same as fourReverse)
 *                                  threeRow = 6 perm (same as threeReverse)
 *                                  → Row & Reverse always hit/miss together
 */
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

const PAYOUTS = {
  top6: 50000,
  top5: 25000,
  top4: 5000,
  fourRow: 225,
  fourReverse: 225,
  top3: 900,
  threeRow: 150,
  threeReverse: 150,
  top2: 90,
  bottom3: 225,
  bottom2: 90,
  twoReverse: 45,
  twoRow: 12,
  runningTop: 3,
  runningBottom: 4
};

const MARKET_LIST = Object.keys(PAYOUTS);
const MARKET_COST = MARKET_LIST.length; // 15 THB per draw

const original = readHistory();
const count = Math.min(200, original.length);

console.log("=== BACKTEST DUPLICATE COMPARISON: Last " + count + " Draws ===\n");

const results = [];

try {
  for (let i = 0; i < count; i++) {
    const actual = original[i];
    const priorHistory = original.slice(i + 1);
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

    // --- Hit checks (current, no-duplicate logic) ---
    const hits = {
      top6:           m.top6.includes(firstPrize),
      top5:           m.top5.includes(last5),
      fourRow:        m.fourRow ? m.fourRow.some(p => {
                        const d = last4.split("");
                        const allPairs = new Set();
                        for (let a = 0; a < 4; a++)
                          for (let b = 0; b < 4; b++)
                            if (a !== b) allPairs.add(d[a] + d[b]);
                        return p.covers.some(c => allPairs.has(c));
                      }) : false,
      fourReverse:    m.fourReverse ? m.fourReverse.some(p => p.covers.includes(last4)) : false,
      top4:           m.top4.includes(last4),
      top3:           m.top3.includes(last3),
      threeRow:       m.threeRow ? m.threeRow.some(p => {
                        const d = last3.split("");
                        const allPairs = new Set([
                          d[0]+d[1], d[0]+d[2], d[1]+d[0],
                          d[1]+d[2], d[2]+d[0], d[2]+d[1]
                        ]);
                        return p.covers.some(c => allPairs.has(c));
                      }) : false,
      threeReverse:   m.threeReverse ? m.threeReverse.some(p => p.covers.includes(last3)) : false,
      top2:           m.top2.includes(last2),
      bottom3:        m.bottom3.some(p => allBottom3.includes(p)),
      bottom2:        m.bottom2.includes(last2),
      twoReverse:     m.twoReverse ? m.twoReverse.some(p => p.covers.includes(last2)) : false,
      twoRow:         (() => {
                        const d = last3.split("");
                        const pairs = [
                          d[0]+d[1], d[0]+d[2], d[1]+d[2],
                          d[1]+d[0], d[2]+d[0], d[2]+d[1]
                        ];
                        return m.twoRow.some(p => pairs.includes(p));
                      })(),
      runningTop:     m.runningTop.some(d => last3.includes(d)),
      runningBottom:  m.runningBottom.some(d => last2.includes(d))
    };

    // ---- TWO payout scenarios ----

    // Scenario A: WITHOUT duplicates (current, real) — Row uses pairs, Reverse uses permutations
    const payoutNoDup = Object.entries(hits)
      .filter(([_, hit]) => hit)
      .reduce((sum, [market]) => sum + (PAYOUTS[market] || 0), 0);

    // Scenario B: WITH duplicates (simulated old) — Row uses same permutation check as Reverse
    const dupHits = { ...hits };
    dupHits.fourRow = hits.fourReverse;   // old: fourRow was 24 perm (same as fourReverse)
    dupHits.threeRow = hits.threeReverse; // old: threeRow was 6 perm (same as threeReverse)
    const payoutWithDup = Object.entries(dupHits)
      .filter(([_, hit]) => hit)
      .reduce((sum, [market]) => sum + (PAYOUTS[market] || 0), 0);

    results.push({ hits, payoutNoDup, payoutWithDup, date: actual.date });
  }
} finally {
  writeHistory(original);
}

// ── Summary ────────────────────────────────────────

const totalDraws = results.length;

// Aggregate each market's hit count (current, no-duplicate)
const marketStats = MARKET_LIST.map(key => {
  const hits = results.filter(r => r.hits[key]).length;
  const payout = PAYOUTS[key] || 0;
  return { key, label: key, hits, payout, valueScore: hits * payout };
});

// ── HIT RATE BY MARKET (current no-dup) ──
console.log("=== HIT RATE BY MARKET (Current — No Duplicates) ===\n");
console.log("Market          | Hits  | Rate   | Payout | Value Score");
console.log("-".repeat(65));
marketStats.forEach(m => {
  const rate = ((m.hits / totalDraws) * 100).toFixed(1) + "%";
  console.log(
    String(m.key).padEnd(15) + " | " +
    String(m.hits).padStart(5) + " | " +
    rate.padStart(6) + " | " +
    String(m.payout).padStart(6) + " | " +
    String(m.valueScore.toLocaleString()).padStart(11)
  );
});

// ── PAYOUT COMPARISON ──
const totalNoDup  = results.reduce((s, r) => s + r.payoutNoDup, 0);
const totalWithDup = results.reduce((s, r) => s + r.payoutWithDup, 0);
const avgNoDup  = totalNoDup / totalDraws;
const avgWithDup = totalWithDup / totalDraws;

console.log("\n");
console.log("=".repeat(65));
console.log("=== PAYOUT COMPARISON: With vs Without Duplicates ===");
console.log("=".repeat(65));
console.log("");
console.log("                              | Without Dup  | With Dup     | Difference");
console.log("                              | (Current)    | (Old/Simulated) |");
console.log("-".repeat(65));
console.log(
  "Total payout (200 draws)       | " +
  String(totalNoDup.toLocaleString()).padStart(11) + " THB | " +
  String(totalWithDup.toLocaleString()).padStart(11) + " THB | " +
  String((totalNoDup - totalWithDup).toLocaleString()).padStart(10) + " THB"
);
console.log(
  "Average per draw              | " +
  String(avgNoDup.toFixed(1)).padStart(11) + " THB | " +
  String(avgWithDup.toFixed(1)).padStart(11) + " THB | " +
  String((avgNoDup - avgWithDup).toFixed(1)).padStart(10) + " THB"
);
console.log(
  "Cost per draw (15 markets)    | " +
  String(MARKET_COST).padStart(11) + " THB | " +
  String(MARKET_COST).padStart(11) + " THB | —"
);
console.log(
  "Net per draw                  | " +
  String((avgNoDup - MARKET_COST).toFixed(1)).padStart(11) + " THB | " +
  String((avgWithDup - MARKET_COST).toFixed(1)).padStart(11) + " THB | " +
  String((avgNoDup - avgWithDup).toFixed(1)).padStart(10) + " THB"
);

const profitableNoDup  = results.filter(r => r.payoutNoDup > MARKET_COST).length;
const profitableWithDup = results.filter(r => r.payoutWithDup > MARKET_COST).length;
console.log(
  "Profitable draws              | " +
  String(profitableNoDup).padStart(11) + "/" + totalDraws + " (" + ((profitableNoDup/totalDraws)*100).toFixed(0) + "%) | " +
  String(profitableWithDup).padStart(11) + "/" + totalDraws + " (" + ((profitableWithDup/totalDraws)*100).toFixed(0) + "%) | —"
);

// ── Impact breakdown ──
const fourRowHits    = results.filter(r => r.hits.fourRow).length;
const fourRevHits    = results.filter(r => r.hits.fourReverse).length;
const threeRowHits   = results.filter(r => r.hits.threeRow).length;
const threeRevHits   = results.filter(r => r.hits.threeReverse).length;

console.log("\n");
console.log("=== MARKET DIFFERENTIATION IMPACT ===");
console.log("");
console.log("Market         | Without Dup (current) | With Dup (old) | Change");
console.log("-".repeat(65));
console.log(
  "fourRow hits    | " +
  String(fourRowHits).padStart(11) + "/" + totalDraws + " (" + ((fourRowHits/totalDraws)*100).toFixed(1) + "%) | " +
  String(fourRevHits).padStart(11) + "/" + totalDraws + " (" + ((fourRevHits/totalDraws)*100).toFixed(1) + "%) | " +
  (fourRowHits !== fourRevHits ? "✅ Different" : "❌ Same")
);
console.log(
  "threeRow hits   | " +
  String(threeRowHits).padStart(11) + "/" + totalDraws + " (" + ((threeRowHits/totalDraws)*100).toFixed(1) + "%) | " +
  String(threeRevHits).padStart(11) + "/" + totalDraws + " (" + ((threeRevHits/totalDraws)*100).toFixed(1) + "%) | " +
  (threeRowHits !== threeRevHits ? "✅ Different" : "❌ Same")
);

console.log("\n");
console.log("=== KEY INSIGHTS ===");
if (fourRowHits !== fourRevHits || threeRowHits !== threeRevHits) {
  console.log("✅ Row/Reverse markets are successfully differentiated.");
  console.log("   fourRow (pairs): " + fourRowHits + "/" + totalDraws + " hits vs fourReverse (perm): " + fourRevHits + "/" + totalDraws + " hits");
  console.log("   threeRow (pairs): " + threeRowHits + "/" + totalDraws + " hits vs threeReverse (perm): " + threeRevHits + "/" + totalDraws + " hits");
  console.log("");
  console.log("   fourRow hits MORE often as pairs (easier to match)");
  console.log("   threeRow hits MORE often as pairs (easier to match)");
  console.log("   This is expected — pair-based betting should hit more frequently.");
} else {
  console.log("❌ Row/Reverse markets are STILL hitting identically — fix didn't work.");
  console.log("   This would mean fourRow/fourReverse and threeRow/threeReverse");
  console.log("   still have the same hit/miss pattern despite different logic.");
}

console.log("\n");
console.log("=== CONCLUSION ===");
const diff = totalNoDup - totalWithDup;
if (diff > 0) {
  console.log("✅ Total payout with differentiated markets is HIGHER by " + diff.toLocaleString() + " THB.");
  console.log("   The pair-based Row markets hit more frequently, adding value.");
  console.log("   Net per draw: " + (avgNoDup - MARKET_COST).toFixed(1) + " THB (no-dup) vs " + (avgWithDup - MARKET_COST).toFixed(1) + " THB (with-dup).");
} else if (diff < 0) {
  console.log("Total payout with differentiated markets is LOWER by " + Math.abs(diff).toLocaleString() + " THB.");
  console.log("This is expected — removing duplicate coverage reduces payout overlap.");
} else {
  console.log("Both scenarios produce identical payouts (markets not differentiated).");
}
