# Betting Markets — Deep Analysis

> A thorough audit of all 15 betting markets, how they work, how they relate to each other, and what may be wrong.
> Generated: June 2, 2026

---

## How to Read This Document

Each market is analyzed along 4 dimensions:

1. **What it predicts** — The actual values being generated
2. **Data source** — Where the predictions come from (prediction method + input data)
3. **Hit condition** — How the backtest determines a "win" (from `scripts/backtest.js`)
4. **Relationship to other markets** — Dependencies and overlap

---

## Market-by-Market Breakdown

### 1. `top6` — T6 (Top 6) — Full 6-Digit

| Dimension | Detail |
|-----------|--------|
| **What** | Full 6-digit first prize predictions |
| **Method** | Positional cycling across 6 positions using recency-weighted frequency |
| **Candidates** | 10 predictions |
| **Payout** | 50,000 THB |
| **Backtest** | `m.top6.includes(firstPrize)` — exact full match |
| **Hit rate** | 0.0% (10 out of 1,000,000 possibilities) |
| **Depends on** | Nothing (independent) |

**Notes:** This market has 1M+ possibilities, so with only 10 candidates and 200 draws of history, a hit is extremely unlikely. The positional approach is the only viable method here since direct frequency would need to see the same full 6-digit number multiple times.

---

### 2. `top5` — T5 (Top 5) — Last 5 Digits

| Dimension | Detail |
|-----------|--------|
| **What** | Last 5 digits of first prize (`firstPrize.slice(-5)`) |
| **Method** | Direct frequency (`getTop5ByFrequency`) — counts occurrences of each 5-digit pattern, recency-weighted |
| **Candidates** | 5 predictions |
| **Payout** | 25,000 THB |
| **Backtest** | `m.top5.includes(last5)` — exact match |
| **Hit rate** | 0.5% (100× random) |
| **Depends on** | Nothing (independent) |

**Notes:** With 100,000 possible 5-digit patterns and only 200 draws, direct frequency has limited data to work with. 1 hit in 200 draws is better than random (0.005%).

---

### 3. `top4` — T4 (Top 4) — Last 4 Digits

| Dimension | Detail |
|-----------|--------|
| **What** | Last 4 digits of first prize (`firstPrize.slice(-4)`) |
| **Method** | Direct frequency (`getTop4ByFrequency`) — counts occurrences of each 4-digit pattern |
| **Candidates** | 5 predictions |
| **Payout** | 5,000 THB |
| **Backtest** | `m.top4.includes(last4)` — exact match |
| **Hit rate** | 0.5% (10× random) |
| **Depends on** | Nothing (independent) |

**Notes:** 10,000 possible 4-digit patterns. With 200 draws, seeing any repeat is unlikely. The 1 hit in 200 draws is promising.

---

### 4. `fourRow` — 4 Row ✅ FIXED

| Dimension | Detail |
|-----------|--------|
| **What** | 2-digit pairs from each `top4` prediction |
| **Method** | From each 4-digit prediction ABCD, extracts AB, AC, AD, BC, BD, CD (C(4,2) = 6 pairs) |
| **Candidates** | 5 bases × 6 pairs = **30 covers** |
| **Payout** | 225 THB |
| **Backtest** | Checks if any predicted pair appears anywhere in `last4` digits (P(4,2) = 12 possible ordered pairs) |
| **Depends on** | **`top4`** — fourRow is derived from top4 predictions |

---

### 5. `fourReverse` — 4 Reverse Numbers

| Dimension | Detail |
|-----------|--------|
| **What** | All 24 permutations of each `top4` prediction |
| **Method** | `permutations(base, 24)` on each of the 5 `top4` predictions |
| **Candidates** | 5 bases × 24 permutations = **120 covers** |
| **Payout** | 225 THB |
| **Backtest** | `m.fourReverse.some(p => p.covers.includes(last4))` — any permutation matches `last4` |
| **Depends on** | **`top4`** — fourReverse is also derived from top4 predictions |

---

> ✅ **FIXED** — `fourRow` now outputs **6 pairs per base** (AB, AC, AD, BC, BD, CD) instead of 24 permutations.
> `fourReverse` remains as **24 permutations per base**. The two markets are now meaningfully different.

---

### 6. `top3` — T3 (Top 3) — Last 3 Digits

| Dimension | Detail |
|-----------|--------|
| **What** | Last 3 digits of first prize (`firstPrize.slice(-3)`) |
| **Method** | Direct frequency (`getTop3ByFrequency`) — counts occurrences of each 3-digit pattern |
| **Candidates** | 5 predictions |
| **Payout** | 900 THB |
| **Backtest** | `m.top3.includes(last3)` — exact match |
| **Hit rate** | 2.0% (4× random) |
| **Depends on** | Nothing (independent) |

**Notes:** With only 1,000 possible 3-digit patterns and 200 draws, direct frequency works reasonably well. 4/200 = 2.0% is the best hit rate among the exact-match "top" markets.

---

### 7. `threeRow` — 3 Row ✅ FIXED

| Dimension | Detail |
|-----------|--------|
| **What** | 2-digit pairs from each `top3` prediction |
| **Method** | From each 3-digit prediction ABC, extracts AB, AC, BC (C(3,2) = 3 pairs) |
| **Candidates** | 5 bases × 3 pairs = **15 covers** |
| **Payout** | 150 THB |
| **Backtest** | Checks if any predicted pair appears anywhere in `last3` digits (P(3,2) = 6 possible ordered pairs) |
| **Depends on** | **`top3`** — derived directly |

---

### 8. `threeReverse` — 3 Reverse Numbers

| Dimension | Detail |
|-----------|--------|
| **What** | All 6 permutations of each `top3` prediction |
| **Method** | `permutations(base, 6)` on each of the 5 `top3` predictions |
| **Candidates** | 5 bases × 6 permutations = **30 covers** |
| **Payout** | 150 THB |
| **Backtest** | `m.threeReverse.some(p => p.covers.includes(last3))` — any permutation matches `last3` |
| **Depends on** | **`top3`** — derived directly |

---

> ✅ **FIXED** — `threeRow` now outputs **3 pairs per base** (AB, AC, BC) instead of 6 permutations.
> `threeReverse` remains as **6 permutations per base**. The two markets are now meaningfully different.

---

### 9. `bottom3` — B3 (Bottom 3)

| Dimension | Detail |
|-----------|--------|
| **What** | Recent front/back 3-digit results from official prize data |
| **Method** | `uniqueRecent(bottomThree)` — deduplicates historical `last_three_front` + `last_three_back` numbers |
| **Candidates** | Up to 5 predictions |
| **Payout** | 225 THB |
| **Backtest** | `m.bottom3.some(p => allBottom3.includes(p))` — any predicted number appears in either the front or back 3-digit prize |
| **Hit rate** | ~98% |
| **Depends on** | Nothing (uses historical official results directly) |

**Notes:** This has a 98% hit rate because:
- There are **2 separate 3-digit prize categories** per draw (front + back)
- The predictions are just recently seen winners
- With any of the 5 candidates matching either of 2 prizes, overlap is very common
- This is more of a "recent results display" than a predictive market

---

### 10. `top2` — T2 (Top 2) — Last 2 Digits

| Dimension | Detail |
|-----------|--------|
| **What** | Last 2 digits of first prize (`firstPrize.slice(-2)`) |
| **Method** | Direct frequency (`getTop2ByFrequency`) — counts occurrences of each 2-digit pair |
| **Candidates** | 5 predictions |
| **Payout** | 90 THB |
| **Backtest** | `m.top2.includes(last2)` — exact match |
| **Hit rate** | 9.5% (19× random) |
| **Depends on** | Nothing (independent) |

**Notes:** This is the strongest performing predictive market. With only 100 possible pairs and 200 draws of history, the direct frequency method has enough data to produce meaningful predictions. 9.5% is 19× better than random (0.5%).

---

### 11. `bottom2` — B2 (Bottom 2)

| Dimension | Detail |
|-----------|--------|
| **What** | Recent last-2-digit results from official prize data |
| **Method** | `uniqueRecent(bottomTwo)` — deduplicates historical `last_two` numbers |
| **Candidates** | Up to 5 predictions |
| **Payout** | 90 THB |
| **Backtest** | `m.bottom2.includes(last2)` — exact match with actual `last_two` prize |
| **Hit rate** | ~4.5% |
| **Depends on** | Nothing (uses historical official results directly) |

**Notes:** Unlike `top2` which predicts from frequency analysis, `bottom2` just shows recent winners from the `last_two` prize field.

---

### 12. `twoReverse` — 2 Reverse Digits

| Dimension | Detail |
|-----------|--------|
| **What** | Both orderings of each `top2` prediction |
| **Method** | `permutations(base, 2)` on each of the 5 `top2` predictions |
| **Candidates** | 5 bases × 2 permutations = **10 covers** |
| **Payout** | 45 THB |
| **Backtest** | `m.twoReverse.some(p => p.covers.includes(last2))` — either ordering matches `last2` |
| **Depends on** | **`top2`** — derived directly |

**Notes:** This one is **correct** — 2! = 2 permutations is genuinely "reversing" the pair. If `top2` hits, `twoReverse` always hits too (exact match is one of 2 permutations).

---

### 13. `twoRow` — 2 Row

| Dimension | Detail |
|-----------|--------|
| **What** | 2-digit pairs formed from digits within `top3` predictions |
| **Method** | `twoRows(top3)` — from each 3-digit prediction ABC, extracts AB, AC, BC (3 pairs per base × 5 = up to 15 pairs, deduplicated to 5) |
| **Candidates** | Up to 5 pairs |
| **Payout** | 12 THB |
| **Backtest** | Generates ALL 6 possible ordered pairs from actual last3 digits (`d0d1, d0d2, d1d2, d1d0, d2d0, d2d1`) and checks if any match `m.twoRow` |
| **Depends on** | **`top3`** — pairs are derived from top3 predictions |

**Notes:** The backtest check is very generous — it checks if ANY of the 6 possible ordered pairs from the actual result matches any of the 5 predicted pairs.

---

### 14. `runningTop` — RT (Running Top)

| Dimension | Detail |
|-----------|--------|
| **What** | Individual digits present in the `top3` predictions |
| **Method** | `runningDigits(top3)` — concatenates all top3 predictions, splits into individual digits, deduplicates |
| **Candidates** | Up to 5 unique digits |
| **Payout** | 3 THB |
| **Backtest** | `m.runningTop.some(d => last3.includes(d))` — any predicted digit appears in actual last3 |
| **Hit rate** | ~88% |
| **Depends on** | **`top3`** — digits are derived from top3 predictions |

**Notes:** Very high hit rate because with 5 digits predicted and only 3 positions in `last3`, having at least 1 match is common. With 5 top-3 predictions (15 unique digits max, but typically 5-10 unique), you're covering a good portion of 0-9.

---

### 15. `runningBottom` — RB (Running Bottom)

| Dimension | Detail |
|-----------|--------|
| **What** | Individual digits present in the `bottom2` predictions |
| **Method** | `runningDigits(bottom2Predictions)` — concatenates bottom2 predictions, splits into individual digits, deduplicates |
| **Candidates** | Up to 5 unique digits |
| **Payout** | 4 THB |
| **Backtest** | `m.runningBottom.some(d => last2.includes(d))` — any predicted digit appears in actual last2 |
| **Depends on** | **`bottom2`** — digits are derived from bottom2 predictions |

---

## Dependency Graph

```
getTop5ByFrequency → top5  (independent)
getTop4ByFrequency → top4  (independent)
                     ├── fourRow     (6 pairs from top4)        ✅ Distinct
                     └── fourReverse (24 permutations of top4)  ✅ Distinct
getTop3ByFrequency → top3  (independent)
                     ├── threeRow     (3 pairs from top3)       ✅ Distinct
                     ├── threeReverse (6 permutations of top3)  ✅ Distinct
                     ├── twoRow       (pairs from top3 digits)
                     └── runningTop   (digits from top3)
getTop2ByFrequency → top2  (independent)
                     └── twoReverse   (2 permutations of top2)

uniqueRecent(bottomTwo) → bottom2
                           └── runningBottom (digits from bottom2)

uniqueRecent(bottomThree) → bottom3  (independent)

positional cycling → top6  (independent)
```

**Key insight:** The "bottom" markets (bottom3, bottom2) are NOT predictions — they simply show recent winners from official prize fields. Only the "top" markets use prediction algorithms.

---

## Summary of Issues Found

### ✅ Issue 1: `fourRow` and `fourReverse` — FIXED

`fourRow` now shows **6 pairs** per base prediction (AB, AC, AD, BC, BD, CD). `fourReverse` remains **24 permutations**. They are now meaningfully different markets.

### ✅ Issue 2: `threeRow` and `threeReverse` — FIXED

`threeRow` now shows **3 pairs** per base prediction (AB, AC, BC). `threeReverse` remains **6 permutations**. Meaningfully differentiated.

### 🟡 Issue 3: Payout values still reflect old structure

The 225 THB / 150 THB payouts were set when these were duplicates. With the new pair-based structure, payouts may need adjusting — user should validate.

### 🟡 Issue 4: `bottom3` is not predictive

This market just shows recent winners from `last_three_front` and `last_three_back` — it's a history display, not a prediction. The 98% hit rate is misleading.

### 🟡 Issue 5: `bottom2` is not predictive

Same as bottom3 — just shows recent `last_two` winners. Lower hit rate (~4.5%) because there's only 1 prize to match against.

### 🟡 Issue 6: Cascade dependency inflation (partially resolved)

`fourRow` no longer automatically hits when `top4` hits (pair match is more specific). `threeRow` no longer automatically hits when `top3` hits (same reason). However, `threeReverse`, `twoRow`, and `runningTop` still cascade from `top3`.

---
