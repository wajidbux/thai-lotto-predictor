const fs = require("fs");
const path = require("path");
const { validateDraw } = require("../utils/validator");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

const seedHistory = [
  "997626",
  "530593",
  "757563",
  "205690",
  "157196",
  "820126",
  "980116",
  "395919",
  "417652",
  "943703",
  "086069",
  "356757"
].map((number, index) => ({
  date: `2025-${String(index + 1).padStart(2, "0")}-01`,
  prizes: {
    first: {
      prize: 6000000,
      number: [number]
    },
    last_two: {
      prize: 2000,
      number: number.slice(-2)
    },
    last_three_front: {
      prize: 4000,
      numbers: [number.slice(0, 3)]
    },
    last_three_back: {
      prize: 4000,
      numbers: [number.slice(-3)]
    }
  }
}));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readHistory() {
  ensureDataDir();

  if (!fs.existsSync(HISTORY_PATH)) {
    writeHistory(seedHistory);
    return seedHistory;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));

    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeHistory(seedHistory);
      return seedHistory;
    }

    const validHistory = parsed.filter(validateDraw);

    if (validHistory.length < 3) {
      writeHistory(seedHistory);
      return seedHistory;
    }

    if (validHistory.length !== parsed.length) {
      writeHistory(validHistory);
    }

    return validHistory;
  } catch (err) {
    writeHistory(seedHistory);
    return seedHistory;
  }
}

function writeHistory(history) {
  ensureDataDir();
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

function upsertDraw(draw) {
  const history = readHistory();
  const firstPrize = draw.prizes.first.number[0];
  const next = history.filter(item => {
    const existingPrize = item?.prizes?.first?.number?.[0];

    return item.date !== draw.date && existingPrize !== firstPrize;
  });

  next.unshift(draw);
  writeHistory(next);
  return next;
}

function upsertDraws(draws) {
  return draws.reduce((history, draw) => {
    const firstPrize = draw.prizes.first.number[0];
    const next = history.filter(item => {
      const existingPrize = item?.prizes?.first?.number?.[0];

      return item.date !== draw.date && existingPrize !== firstPrize;
    });

    next.unshift(draw);
    return next;
  }, readHistory());
}

module.exports = {
  readHistory,
  upsertDraw,
  upsertDraws,
  writeHistory
};
