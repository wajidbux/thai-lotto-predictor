# Thai Lotto AI Predictor

AI-powered Thai lottery number prediction tool that scrapes historical draw results from Sanook and LotteryPlus, then generates statistically-informed predictions across 14 betting markets.

## Features

- **14 betting markets** — Top 6, Top 3, Bottom 3, 2-digit pairs, running digits, permutations, and more
- **Auto-scraping** — Fetches latest draw results every 12 hours
- **Auto-retraining** — Recalculates predictions every 12 hours
- **Hot & Cold digits** — Statistical ranking based on historical frequency
- **Responsive dashboard** — Clean card-based UI with all markets displayed

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
| `npm run ingest` | Manually trigger result ingestion |
| `npm run archive` | Ingest historical archive data |
| `npm run train` | Manually recalculate predictions |

## Project Structure

```
├── data/
│   └── history.json          # Lottery draw history (persistent)
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
