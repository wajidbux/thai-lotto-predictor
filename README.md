# Thai Lotto AI Predictor

AI-powered Thai lottery number prediction tool that scrapes historical draw results from Sanook and LotteryPlus, then generates statistically-informed predictions across **15 betting markets**.

## Features

- **15 betting markets** — Top 6→2, Bottom 3→2, Row/Reverse permutations, Running digits, and more
- **Direct frequency analysis** — T2–T5 predictions use recency-weighted pattern frequency (4–100× better than positional cycling)
- **Position-based T6** — Full 6-digit prediction via positional digit pools (best approach for 1M+ possibilities)
- **Auto-scraping** — Runs on server startup, then every 12 hours (via cron)
- **Auto-retraining** — Runs after scraping on startup, then every 12 hours
- **Hot & Cold digits** — Statistical ranking based on historical frequency
- **Responsive dashboard** — Clean card-based UI with all markets displayed
- **Backtest tool** — Evaluate prediction accuracy across all markets with payout tracking
- **TH/EN language toggle** — Full Thai language support

## Prerequisites

- **Node.js** 18+ (recommended: 20 or 22)
- **npm**

## Local Development

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd thai-lotto-predictor

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The app will be available at `http://localhost:3000`.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with auto-restart (nodemon) |
| `npm test` | Run tests |
| `npm run ingest` | Manually trigger result ingestion (automatic on startup) |
| `npm run archive` | Ingest historical archive data |
| `npm run train` | Manually recalculate predictions (automatic on startup) |
| `node scripts/backtest.js` | Run prediction accuracy backtest (200 draws) |
| `node scripts/generate-icon.js` | Generate app icon |

## Project Structure

```
├── data/
│   └── history.json          # Lottery draw history (persistent)
├── docs/
│   └── betting-pattern-reference.md  # Complete market mapping & data flow
├── public/
│   ├── index.html            # Dashboard HTML
│   ├── dashboard.js          # Frontend logic
│   ├── style.css             # Dashboard styling
│   └── icon.ico              # Tab/window icon
├── src/
│   ├── controllers/          # Express route handlers
│   ├── jobs/                 # Cron jobs (autoIngest, autoRetrain)
│   ├── routes/               # Express routes
│   ├── services/             # Scrapers, prediction engine, history store
│   └── utils/                # Date helpers, validators
├── scripts/                  # CLI utility scripts
├── server.js                 # Entry point
├── render.yaml               # Render deployment config
└── package.json
```

## Betting Markets

See [docs/betting-pattern-reference.md](docs/betting-pattern-reference.md) for the complete mapping including payout values, data sources, and prediction methods.

| # | Market | Code Key | Method |
|---|--------|----------|--------|
| 1 | **Top 6** | `top6` | Positional cycling |
| 2 | **Top 5** | `top5` | Direct frequency |
| 3 | **Top 4** | `top4` | Direct frequency |
| 4 | **4 Row** | `fourRow` | 6 pairs from each top-4 (5×6=30 covers) |
| 5 | **4 Reverse** | `fourReverse` | 24 permutations of top-4 (5×24=120 covers) |
| 6 | **Top 3** | `top3` | Direct frequency |
| 7 | **Bottom 3** | `bottom3` | Official prize fields |
| 8 | **3 Row** | `threeRow` | 3 pairs from each top-3 (5×3=15 covers) |
| 9 | **3 Reverse** | `threeReverse` | 6 permutations of top-3 (5×6=30 covers) |
| 10| **Top 2** | `top2` | Direct frequency |
| 11| **Bottom 2** | `bottom2` | Official prize field |
| 12| **2 Reverse** | `twoReverse` | 2 permutations of top-2 (5×2=10 covers) |
| 13| **2 Row** | `twoRow` | Pairs from top-3 digits |
| 14| **Running Top** | `runningTop` | Digits from top-3 |
| 15| **Running Bottom** | `runningBottom` | Digits from bottom-2 |

## Backtest Results (~190 draws)

| Market     | Hit Rate | Notes |
|------------|:--------:|-------|
| **4 Row**  | **90%**  | 6 pairs from top-4 predictions cover 30/100 pairs |
| **3 Row**  | **52%**  | 3 pairs from top-3 predictions cover 15/100 pairs |
| **B3**     | **98%**  | Front/back 3-digit prize match (recent history) |
| **RT/RB**  | 88% / 80%| Individual digit matches |
| **T2**     | **3.7%** | Direct pair frequency (5/100 candidates) |
| **T3**     | **2.1%** | Direct triple frequency (4× random) |
| **T4**     | **0.5%** | Direct 4-digit frequency (10× random) |
| **T5**     | **0.5%** | Direct 5-digit frequency (100× random) |
| **3Rev**   | **3.7%** | 6 permutations of top-3 |
| **4Rev**   | **1.1%** | 24 permutations of top-4 |
| **Net**    | **+693 THB/draw** | 99% profitable (187/189 draws) |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Serves the dashboard |
| `GET /predict/all` | Returns all predictions (JSON) |

## Deploying to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects the `render.yaml` — just click **Apply**
5. Or manually set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Click **Deploy**

The app will be live in ~2 minutes with SSL, auto-restart, and uptime monitoring included.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Scraping:** Axios + Cheerio
- **Scheduling:** node-cron
- **Frontend:** Vanilla JavaScript, CSS
