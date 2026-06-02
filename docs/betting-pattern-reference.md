# Betting Pattern Reference

> Complete mapping between the Thai Lotto betting pattern and the code implementation.
> Last updated: June 2, 2026

---

## Complete Betting Pattern

| # | Bet Type    | Payout  | Code Market    | Method                              | Dashboard Display          |
|---|-------------|---------|----------------|-------------------------------------|----------------------------|
| 1 | **6 Top**   | 50,000  | `top6`         | Positional cycling (1M+ possibilities) | Summary card: "Top 6 Summary" |
| 2 | **5 Top**   | 25,000  | `top5`         | Direct frequency (`getTop5ByFrequency`) | Summary card: "Top 5 Summary" |
| 3 | **4 Top**   | 5,000   | `top4`         | Direct frequency (`getTop4ByFrequency`) | Summary card: "Top 4 Summary" |
| 4 | **4 Row**   | 225     | `fourRow`      | 6 pairs from each top-4 (5×6=30 covers) | Market card: "4 Row"       |
| 5 | **4 Reverse** | 225     | `fourReverse` | 24 permutations of top-4 (5×24=120 covers) | Market card: "4 Reverse Numbers" |
| 6 | **3 Top**   | 900     | `top3`         | Direct frequency (`getTop3ByFrequency`) | Summary card: "Top 3 Summary" |
| 7 | **3 Bottom**| 225     | `bottom3`      | Official `last_three` prizes         | Market card: "Bottom 3 Digits" |
| 8 | **3 Row**   | 150     | `threeRow`     | 3 pairs from each top-3 (5×3=15 covers) | Market card: "3 Row"       |
| 9 | **3 Reverse** | 150     | `threeReverse` | 6 permutations of top-3 (5×6=30 covers) | Market card: "3 Reverse Numbers" |
| 10| **2 Top**   | 90      | `top2`         | Direct frequency (`getTop2ByFrequency`) | Summary card: "Top 2 Summary" |
| 11| **2 Bottom**| 90      | `bottom2`      | Official `last_two` prize             | Market card: "Bottom 2 Digits" |
| 12| **2 ReverseShuffle** | — | `twoReverse`  | 2 permutations of top-2 (×5)        | Market card: "2 Reverse Digits" |
| 13| **2 Row**   | 12      | `twoRow`       | Pairs formed from digits of top-3    | Market card: "2 Row"        |
| 14| **Top (1 digit)** | 3  | `runningTop`   | Individual digits from top-3         | Market card: "Top 1 Digit / Running Top" |
| 15| **Bottom (1 digit)** | 4 | `runningBottom` | Individual digits from bottom-2     | Market card: "Bottom 1 Digit / Running Bottom" |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         history.json                                     │
│  (Historical lottery draw data: 1st prize, last_two, last_three, etc.)  │
└─────────────┬───────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      predictionService.js                                │
│                                                                          │
│  getPredictions()                                                        │
│    ├── getPositionFrequency() — recency-weighted position frequency     │
│    ├── rankPositionDigits()   — sort digits per position by frequency   │
│    ├── getTop2ByFrequency()   — direct pair frequency (for T2)         │
│    ├── getTop3ByFrequency()   — direct triple frequency (for T3)        │
│    ├── getTop4ByFrequency()   — direct 4-digit freq (for T4)           │
│    ├── getTop5ByFrequency()   — direct 5-digit freq (for T5)           │
│    ├── generatePositionalPredictions() — generate number combos (T6)   │
│    ├── fillPredictions() — merge with historical fallback               │
│    ├── permutations() — all digit arrangements                          │
│    ├── twoRows() — pairs from 3-digit numbers                           │
│    └── runningDigits() — extract individual digits                      │
│                                                                          │
│  Returns: { twoDigit, threeDigit, sixDigit, markets: { ... },           │
│             hotNumbers, coldNumbers, totalHistory }                      │
└─────────────┬───────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      server.js → /predict/all API                       │
└─────────────┬───────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      dashboard.js (client-side)                         │
│                                                                          │
│  loadPredictions()                                                       │
│    ├── Populates summary cards: Top 6, Top 5, Top 4, Top 3, Top 2       │
│    ├── Populates Hot Numbers, Cold Numbers, History Count                │
│    ├── renderDigitPools() — 1st Prize Digit Pools card                   │
│    │     • Full 6-Digit (positions 0–5)                                  │
│    │     • Last 3 Digits (positions 3–5)                                 │
│    │     • Last 2 Digits (positions 4–5)                                 │
│    └── renderMarketCards() — betting market cards                        │
│          • Top 5 Digits, Top 4 Digits (summary-style)                    │
│          • 4 Row, 4 Reverse Numbers (×5 entries each)                    │
│          • 3 Row, Bottom 3 Digits, 3 Reverse Numbers (×5 entries each)   │
│          • Bottom 2 Digits, 2 Reverse Digits (×5 entries), 2 Row         │
│          • Top 1 Digit / Running Top, Bottom 1 Digit / Running Bottom    │
└─────────────────────────────────────────────────────────────────────────┘

---

## Backtest / Prediction Comparison

```
scripts/backtest.js
├── Runs ~190-200 draws (no data leakage)
├── Compares old positional vs new direct frequency for T3/T4/T5
│   ├── T3: 1.1% → 2.1%  (4× random)
│   ├── T4: 0.0% → 0.5%  (10× random)
│   └── T5: 0.0% → 0.5%  (100× random)
├── Hit Rate by Market table (primary output)
│   ├── 4 Row (pairs):      ~90% hit rate
│   ├── 3 Row (pairs):      ~52% hit rate
│   ├── 4 Reverse (perm):   ~1%  hit rate
│   └── 3 Reverse (perm):   ~4%  hit rate
├── Per-Draw Detail with payout tracking
└── Payout Stats: ~708 THB avg, ~+693 THB net per draw, ~99% profitable draws
```

---

## Code Market Details

### Prediction Methods

| Market   | Method                  | Function              | Candidates | Random Chance | Actual Hit Rate (≈190 draws) |
|----------|------------------------|-----------------------|:----------:|:-------------:|:---------------------------:|
| `top6`   | Positional cycling     | `generatePositionalPredictions()` | 10  | 0.0005% | 0.0% |
| `top5`   | Direct frequency       | `getTop5ByFrequency()`           | 5   | 0.005%  | 0.5% |
| `top4`   | Direct frequency       | `getTop4ByFrequency()`           | 5   | 0.05%   | 0.5% |
| `top3`   | Direct frequency       | `getTop3ByFrequency()`           | 5   | 0.5%    | 2.1% |
| `top2`   | Direct frequency       | `getTop2ByFrequency()`           | 5   | 0.5%    | 3.7% |

> **Note:** T2–T5 were switched from positional cycling to **direct frequency analysis** because the old positional approach treated each digit position independently (missing cross-position correlations). Direct frequency counts how often each complete pattern actually appeared in history, weighted by recency. T6 remains positional since 1M+ possibilities make direct frequency ineffective with only 200 draws.

### Row Markets (Pair-Based) — Hit Rates

| Market        | Pairs per Base | Total Covers | Hit Rate | Notes |
|---------------|:--------------:|:------------:|:--------:|-------|
| `fourRow`     | 6              | 30           | **~90%** | 6 pairs × 5 base predictions cover 30/100 pairs |
| `threeRow`    | 3              | 15           | **~52%** | 3 pairs × 5 base predictions cover 15/100 pairs |
| `twoRow`      | 3 (dedup→5)   | 5            | **~19%** | Pairs from top-3 digits, deduplicated to 5 |

### Reverse / Shuffle Markets (Permutation-Based) — Hit Rates

| Market         | Permutations per Base | Total Covers | Hit Rate |
|----------------|:--------------------:|:------------:|:--------:|
| `fourReverse`  | 24                   | 120          | **~1%**  |
| `threeReverse` | 6                    | 30           | **~4%**  |
| `twoReverse`   | 2                    | 10           | **~9%**  |

### Row Markets (Pair-Based)

"Row" markets extract all possible 2-digit pairs from the base predictions:

| Market        | Input  | Pairs per Base | Total Pairs | Example (base=123) |
|---------------|--------|:--------------:|:-----------:|--------------------|
| `fourRow`     | Top 4  | C(4,2) = 6     | 30          | `12, 13, 14, 23, 24, 34` |
| `threeRow`    | Top 3  | C(3,2) = 3     | 15          | `12, 13, 23` |
| `twoRow`      | Top 3  | C(3,2) = 3     | 15 (dedup→5) | `12, 13, 23` |

### Reverse / Shuffle Markets (Permutation-Based)

"Reverse" markets generate every unique arrangement of the base digits:

| Market         | Input  | Permutations | Total Covers |
|----------------|--------|:------------:|:------------:|
| `fourReverse`  | Top 4  | 4! = 24      | 120          |
| `threeReverse` | Top 3  | 3! = 6       | 30           |
| `twoReverse`   | Top 2  | 2! = 2       | 10           |

> **All markets show 5 base predictions** (×5). The Row/Reverse split is now meaningful:
> - **Row** = pairs from the base digits (cheaper, covers partial matches)
> - **Reverse** = all arrangements of the base digits (more expensive, covers all orders)

### Bottom Markets (Official Prize Fields)

| Market           | Source Field                      |
|------------------|-----------------------------------|
| `bottom3`        | `last_three_front.numbers` + `last_three_back.numbers` |
| `bottom2`        | `last_two.number`                 |

### Running (1-Digit) Markets

| Market           | Source                         | Description                     |
|------------------|--------------------------------|---------------------------------|
| `runningTop`     | Digits from `top3` predictions | Individual digits from top 3    |
| `runningBottom`  | Digits from `bottom2` results  | Individual digits from bottom 2 |

### Heat Map (Non-Betting)

| Field          | Description                                   |
|----------------|-----------------------------------------------|
| `hotNumbers`   | Top 5 most frequent digits across all data    |
| `coldNumbers`  | Bottom 5 least frequent digits across all data|

---

## Backtest Script Reference

The backtest (`scripts/backtest.js`) tracks these payout values:

| Market     | Payout  | Bet Type |
|------------|:-------:|----------|
| T6         | 50,000  | Exact 6-digit match |
| T5         | 25,000  | Exact last-5 match |
| T4         | 5,000   | Exact last-4 match |
| 4R         | 225     | Any pair from top-4 predictions in last-4 |
| 4Rev       | 225     | Any permutation of top-4 matches last-4 |
| T3         | 900     | Exact last-3 match |
| 3R         | 150     | Any pair from top-3 predictions in last-3 |
| 3Rev       | 150     | Any permutation of top-3 matches last-3 |
| B3         | 225     | Front/back 3-digit prize match |
| T2         | 90      | Exact last-2 match |
| B2         | 90      | Official last-2 prize match |
| 2Rev       | 45      | Either ordering of top-2 matches last-2 |
| 2Rw        | 12      | Any pair from top-3 appears in last-3 |
| RT         | 3       | Any predicted digit appears in last-3 |
| RB         | 4       | Any predicted digit appears in last-2 |

---

## Dashboard Layout

```
┌──────────────────────────────────────┐
│        Thai Lotto AI Predictor        │
│         [Predict All]  [EN|ไทย]       │
│                                      │
│  Summary Cards                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Top 2   │ │ Top 3   │ │ Top 6   │ │
│  │ Summary │ │ Summary │ │ Summary │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│  ┌─────────┐ ┌─────────┐             │
│  │ Top 5   │ │ Top 4   │             │
│  │ Summary │ │ Summary │             │
│  └─────────┘ └─────────┘             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Hot     │ │ Cold    │ │ History  │ │
│  │ Numbers │ │ Numbers │ │  Count   │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                      │
│  ── Betting Markets ──               │
│  ┌──────────┐ ┌──────────┐           │
│  │ Digit    │ │ 4 Row(5) │           │
│  │ Pools    │ │4 Rev (5) │           │
│  └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐           │
│  │3 Row (5) │ │ Bottom 3 │           │
│  │3 Rev (5) │ │          │           │
│  └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐           │
│  │ Bottom 2 │ │2Rev (5)  │           │
│  │ 2 Row    │ │          │           │
│  └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐           │
│  │ Top 1    │ │ Bottom 1 │           │
│  │ Digit    │ │ Digit    │           │
│  └──────────┘ └──────────┘           │
└──────────────────────────────────────┘

(5) = shows 5 base predictions per card
```

---

## Version History

| Date       | Changes |
|------------|---------|
| 2026-06-02 | Added T4/T5 summary cards. Added T4/T5 market grid cards. Renamed frequency functions to match market names (`getTop2ByFrequency`, `getTop3ByFrequency`, etc.). Expanded permutation cards from 3→5 entries. Switched T2–T5 to direct frequency analysis (4–100× improvement). Added backtest method comparisons. Added `fourReverse` market. Fixed `fourRow`→pairs and `threeRow`→pairs (were duplicates). |
| 2026-05-31 | Initial reference document. |
