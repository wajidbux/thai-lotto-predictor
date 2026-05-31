const axios = require("axios");
const cheerio = require("cheerio");
const { normalizeDigits } = require("../utils/validator");
const { dateInTimeZone } = require("../utils/dateUtils");

const LOTTO_URL = "https://news.sanook.com/lotto/";

function pickFirstPrize(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  $(".lotto__number, [class*=lotto], [class*=number]").each((_, element) => {
    const value = normalizeDigits($(element).text(), 6);

    if (value) {
      candidates.push(value);
    }
  });

  if (candidates.length > 0) {
    return candidates[0];
  }

  const fallback = html.match(/(?:^|\D)(\d{6})(?:\D|$)/);
  return fallback ? fallback[1] : null;
}

async function scrapeLatestDraw() {
  const { data } = await axios.get(LOTTO_URL, {
    timeout: 15000,
    headers: {
      "user-agent": "Mozilla/5.0 Thai Lotto AI"
    }
  });

  const firstPrize = pickFirstPrize(data);

  if (!firstPrize) {
    throw new Error("Could not extract a 6-digit first prize from Sanook");
  }

  return {
    source: "sanook",
    date: dateInTimeZone(),
    prizes: {
      first: {
        prize: 6000000,
        number: [firstPrize]
      },
      last_two: {
        prize: 2000,
        number: firstPrize.slice(-2)
      },
      last_three_front: {
        prize: 4000,
        numbers: [firstPrize.slice(0, 3)]
      },
      last_three_back: {
        prize: 4000,
        numbers: [firstPrize.slice(-3)]
      }
    }
  };
}

module.exports = {
  scrapeLatestDraw
};
