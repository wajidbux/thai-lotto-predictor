const axios = require("axios");
const { normalizeDigits } = require("../utils/validator");

const BASE_URL = "https://xn--m3ca1athe9asc7b2b6iqe.com";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    accept: "application/json",
    "user-agent": "Mozilla/5.0 Thai Lotto AI"
  }
});

function toDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function collectPrizeCandidates(value, path = "", candidates = []) {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = normalizeDigits(value, 6);

    if (normalized) {
      candidates.push({
        number: normalized,
        path,
        score: /first|รางวัลที่1|รางวัลที่ 1|firstPrize/i.test(path) ? 10 : 1
      });
    }

    return candidates;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectPrizeCandidates(item, `${path}[${index}]`, candidates);
    });

    return candidates;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      collectPrizeCandidates(item, path ? `${path}.${key}` : key, candidates);
    });
  }

  return candidates;
}

function pickFirstPrize(payload) {
  const candidates = collectPrizeCandidates(payload)
    .filter(candidate => candidate.number !== "000000")
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.number || null;
}

function normalizePrizeList(value, length) {
  const items = Array.isArray(value) ? value : [value];

  return items
    .map(item => normalizeDigits(item, length))
    .filter(Boolean);
}

function firstMatchingList(data, length, keyPatterns) {
  const entries = Object.entries(data || {});
  const match = entries.find(([key]) =>
    keyPatterns.some(pattern => pattern.test(key))
  );

  return normalizePrizeList(match?.[1], length);
}

async function getRounds() {
  const roundsResponse = await client.get("/api/prizes/results/rounds");
  const rounds = roundsResponse.data?.data || [];

  if (!Array.isArray(rounds) || rounds.length === 0) {
    throw new Error("LotteryPlus did not return draw rounds");
  }

  return rounds;
}

async function scrapeRound(round) {
  const resultResponse = await client.get("/api/prizes/results/glo", {
    params: {
      roundDate: round.value
    }
  });

  const data = resultResponse.data?.data || resultResponse.data;
  const firstPrize = normalizePrizeList(data?.first, 6)[0] ||
    pickFirstPrize(resultResponse.data);

  if (!firstPrize) {
    throw new Error(`Could not extract first prize for LotteryPlus round ${round.value}`);
  }

  const frontThree = firstMatchingList(data, 3, [/first3/i, /front3/i]);
  const backThree = firstMatchingList(data, 3, [/last3/i, /back3/i]);
  const lastTwo = firstMatchingList(data, 2, [/last2/i, /bottom2/i])[0] ||
    firstPrize.slice(-2);

  return {
    source: "lotteryPlus",
    round: round.value,
    date: toDate(round.date || round.createdAt),
    prizes: {
      first: {
        prize: 6000000,
        number: [firstPrize]
      },
      last_two: {
        prize: 2000,
        number: lastTwo
      },
      last_three_front: {
        prize: 4000,
        numbers: frontThree.length ? frontThree : [firstPrize.slice(0, 3)]
      },
      last_three_back: {
        prize: 4000,
        numbers: backThree.length ? backThree : [firstPrize.slice(-3)]
      }
    }
  };
}

async function scrapeLatestDraw() {
  const rounds = await getRounds();
  return scrapeRound(rounds[0]);
}

async function scrapeArchive() {
  const rounds = await getRounds();
  const draws = [];

  for (const round of rounds) {
    draws.push(await scrapeRound(round));
  }

  return draws;
}

module.exports = {
  scrapeLatestDraw,
  scrapeArchive
};
