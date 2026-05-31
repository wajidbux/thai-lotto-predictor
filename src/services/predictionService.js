const { readHistory } = require("./historyStore");
const { normalizeDigits } = require("../utils/validator");

// ---- Global digit counting (used for hot/cold display only) ----

function countDigits(numbers) {
  const counts = Array(10).fill(0);

  numbers.forEach(number => {
    number.split("").forEach(digit => {
      counts[Number(digit)] += 1;
    });
  });

  return counts;
}

function rankDigits(counts, direction) {
  return counts
    .map((count, digit) => ({ digit: String(digit), count }))
    .sort((a, b) => {
      if (direction === "cold") {
        return a.count - b.count || Number(a.digit) - Number(b.digit);
      }

      return b.count - a.count || Number(a.digit) - Number(b.digit);
    })
    .map(item => item.digit);
}

// ---- Position-wise frequency analysis (used for top market predictions) ----

function getPositionFrequency(numbers, digitLength) {
  // Each position (0 to digitLength-1) has counts for digits 0-9
  const posCounts = Array.from({ length: digitLength }, () => Array(10).fill(0));
  const totalWeight = Array(digitLength).fill(0);

  numbers.forEach((number, idx) => {
    // Recency weight: most recent draws count more.
    // History is reverse-chronological (most recent first).
    // idx=0 (newest) → weight=5; idx=n-1 (oldest) → weight=1.
    const weight = Math.max(1, Math.round((1 - idx / numbers.length) * 4 + 1));

    for (let pos = 0; pos < digitLength; pos++) {
      totalWeight[pos] += weight;
      const digit = parseInt(number[pos], 10);
      if (!isNaN(digit)) {
        posCounts[pos][digit] += weight;
      }
    }
  });

  return { posCounts, totalWeight };
}

function rankPositionDigits(posCounts) {
  // Returns an array where index = position, value = ranked digits (most frequent first)
  return posCounts.map(counts =>
    counts
      .map((count, digit) => ({ digit: String(digit), count }))
      .sort((a, b) => b.count - a.count || Number(a.digit) - Number(b.digit))
      .map(item => item.digit)
  );
}

function generatePositionalPredictions(rankedDigits, count = 5) {
  // Generate predictions by cycling through top-N digits at each position.
  // offset=0 → picks the #1 digit at each position
  // offset=1 → picks the #2 digit at each position
  // offset=2 → picks the #3 digit, and so on.
  // Wraps around when pool length is exceeded.
  const length = rankedDigits.length;
  const predictions = [];
  let offset = 0;

  while (predictions.length < count && offset < 100) {
    let value = "";
    for (let pos = 0; pos < length; pos++) {
      const pool = rankedDigits[pos];
      value += pool[offset % pool.length];
    }
    if (!predictions.includes(value)) {
      predictions.push(value);
    }
    offset++;
  }

  return predictions;
}

// ---- Position digit pools ----

function buildPositionPools(rankedDigits, posCounts, totalWeight, topN = 3) {
  // For each position, return the top-N digits with their confidence percentages
  return rankedDigits.map((ranked, pos) => {
    const digits = ranked.slice(0, topN);
    const counts = digits.map(d => posCounts[pos][Number(d)]);
    const confidence = counts.map(c => {
      const pct = totalWeight[pos] > 0 ? (c / totalWeight[pos] * 100) : 0;
      return parseFloat(pct.toFixed(1));
    });

    return {
      position: pos,
      digits,
      confidence
    };
  });
}

// ---- Shared helpers ----

function uniqueRecent(values, count = 5) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, count);
}

function fillPredictions(predictions, fallback, count = 5) {
  return uniqueRecent([...predictions, ...fallback], count);
}

function permutations(value, limit = 24) {
  const results = new Set();

  function walk(prefix, remaining) {
    if (results.size >= limit) {
      return;
    }

    if (!remaining.length) {
      results.add(prefix);
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      walk(prefix + remaining[i], remaining.slice(0, i) + remaining.slice(i + 1));
    }
  }

  walk("", value);
  return Array.from(results);
}

function twoRows(topThreeNumbers, count = 5) {
  const rows = topThreeNumbers.flatMap(number => [
    number[0] + number[1],
    number[0] + number[2],
    number[1] + number[2]
  ]);

  return uniqueRecent(rows, count);
}

function runningDigits(numbers, count = 5) {
  return uniqueRecent(numbers.join("").split(""), count);
}

function getPredictions() {
  const history = readHistory();
  const firstPrizes = history
    .map(draw => normalizeDigits(draw?.prizes?.first?.number?.[0], 6))
    .filter(Boolean);
  const bottomTwo = history
    .map(draw => normalizeDigits(draw?.prizes?.last_two?.number, 2))
    .filter(Boolean);
  const bottomThree = history
    .flatMap(draw => [
      ...(draw?.prizes?.last_three_front?.numbers || []),
      ...(draw?.prizes?.last_three_back?.numbers || [])
    ])
    .map(number => normalizeDigits(number, 3))
    .filter(Boolean);

  const source = firstPrizes.length ? firstPrizes : ["123456"];
  const bottomSource = [...bottomTwo, ...bottomThree];
  const counts = countDigits([...source, ...bottomSource]);
  const hotDigits = rankDigits(counts, "hot");
  const coldDigits = rankDigits(counts, "cold");

  // Position-wise frequency analysis for top market predictions
  const { posCounts, totalWeight } = getPositionFrequency(firstPrizes, 6);
  const rankedPosDigits = rankPositionDigits(posCounts);

  // Build position digit pools with confidence percentages
  const fullPools = buildPositionPools(rankedPosDigits, posCounts, totalWeight, 3);
  const suffixPools = {
    "5": buildPositionPools(rankedPosDigits.slice(1), posCounts.slice(1), totalWeight.slice(1), 3),
    "4": buildPositionPools(rankedPosDigits.slice(2), posCounts.slice(2), totalWeight.slice(2), 3),
    "3": buildPositionPools(rankedPosDigits.slice(3), posCounts.slice(3), totalWeight.slice(3), 3),
    "2": buildPositionPools(rankedPosDigits.slice(4), posCounts.slice(4), totalWeight.slice(4), 3)
  };

  // Generate exact predictions from pools (for betting convenience)
  const posPred6 = generatePositionalPredictions(rankedPosDigits, 10);
  const posPred5 = generatePositionalPredictions(rankedPosDigits.slice(1), 10);
  const posPred4 = generatePositionalPredictions(rankedPosDigits.slice(2), 10);
  const posPred3 = generatePositionalPredictions(rankedPosDigits.slice(3), 10);
  const posPred2 = generatePositionalPredictions(rankedPosDigits.slice(4), 10);

  const top6 = fillPredictions(posPred6, firstPrizes);
  const top5 = fillPredictions(posPred5, firstPrizes.map(n => n.slice(-5)));
  const top4 = fillPredictions(posPred4, firstPrizes.map(n => n.slice(-4)));
  const top3 = fillPredictions(posPred3, firstPrizes.map(n => n.slice(-3)));
  const top2 = fillPredictions(posPred2, firstPrizes.map(n => n.slice(-2)));

  // Bottom and running markets (unchanged — sourced from official prize fields)
  const bottom3 = uniqueRecent(bottomThree);
  const bottom2Predictions = uniqueRecent(bottomTwo);

  return {
    twoDigit: top2,
    threeDigit: top3,
    sixDigit: top6,
    markets: {
      // Digit pools — the primary top market display
      firstPools: {
        positions: fullPools,
        suffixes: suffixPools
      },
      // Derived exact predictions from pools (for betting convenience)
      top6,
      top5,
      top4,
      fourRow: top4.slice(0, 3).map(number => ({
        base: number,
        covers: permutations(number, 24)
      })),
      top3,
      threeRow: top3.slice(0, 3).map(number => ({
        base: number,
        covers: permutations(number, 6)
      })),
      bottom3,
      threeReverse: top3.slice(0, 3).map(number => ({
        base: number,
        covers: permutations(number, 6)
      })),
      top2,
      bottom2: bottom2Predictions,
      twoReverse: top2.slice(0, 5).map(number => ({
        base: number,
        covers: permutations(number, 2)
      })),
      twoRow: fillPredictions(twoRows(top3), top2),
      runningTop: runningDigits(top3),
      runningBottom: runningDigits(bottom2Predictions)
    },
    hotNumbers: hotDigits.slice(0, 5),
    coldNumbers: coldDigits.slice(0, 5),
    totalHistory: source.length,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getPredictions
};
