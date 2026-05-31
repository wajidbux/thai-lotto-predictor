const axios = require("axios");
const { normalizeDigits } = require("../utils/validator");

const API_URL = "https://www.glo.or.th/api/lottery/getLatestLottery";

const REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
  Referer: "https://www.glo.or.th/mission/awarding/orderby-time"
};

function pickValues(prizeCategory) {
  if (!prizeCategory || !Array.isArray(prizeCategory.number)) {
    return [];
  }

  return prizeCategory.number
    .map(entry => entry.value)
    .filter(Boolean);
}

function normalizePrizeValues(values, length) {
  return values
    .map(value => normalizeDigits(value, length))
    .filter(Boolean);
}

async function scrapeLatestDraw() {
  const { data: body } = await axios.post(API_URL, {}, {
    headers: REQUEST_HEADERS,
    timeout: 15000
  });

  const response = body?.response;

  if (!response) {
    throw new Error("GLO API returned no response object");
  }

  const prizes = response.data;

  if (!prizes) {
    throw new Error("GLO API returned no data object");
  }

  const firstPrizeRaw = pickValues(prizes.first);
  const firstPrize = normalizePrizeValues(firstPrizeRaw, 6)[0];

  if (!firstPrize) {
    throw new Error("Could not extract a 6-digit first prize from GLO");
  }

  const lastTwoRaw = pickValues(prizes.last2);
  const lastTwo = normalizePrizeValues(lastTwoRaw, 2)[0] || firstPrize.slice(-2);

  const frontThreeRaw = pickValues(prizes.last3f);
  const frontThree = normalizePrizeValues(frontThreeRaw, 3);

  const backThreeRaw = pickValues(prizes.last3b);
  const backThree = normalizePrizeValues(backThreeRaw, 3);

  return {
    source: "glo",
    date: response.date || new Date().toISOString().slice(0, 10),
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

module.exports = {
  scrapeLatestDraw
};
