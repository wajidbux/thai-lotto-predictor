const axios = require("axios");
const { normalizeDigits } = require("../utils/validator");

const BASE_URL = "https://news.sanook.com";
const REQUEST_HEADERS = {
  "user-agent": "Mozilla/5.0 Thai Lotto AI"
};

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseCheckDate(url) {
  const match = url.match(/\/check\/(\d{2})(\d{2})(\d{4})\//);

  if (!match) {
    return new Date().toISOString().slice(0, 10);
  }

  const [, day, month, buddhistYear] = match;
  const year = Number(buddhistYear) - 543;

  return `${year}-${month}-${day}`;
}

function extractArticleBody(html) {
  const match = html.match(/"articleBody"\s*:\s*"((?:\\.|[^"\\])*)"/);

  if (!match) {
    return html;
  }

  return match[1]
    .replace(/\\r\\n/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\\"/g, '"');
}

function numbersAfter(body, label, length, count) {
  const index = body.indexOf(label);

  if (index < 0) {
    return [];
  }

  const segment = body.slice(index, index + 300);
  return unique(
    [...segment.matchAll(new RegExp(`\\b\\d{${length}}\\b`, "g"))]
      .map(match => normalizeDigits(match[0], length))
  ).slice(0, count);
}

function parseResultPage(url, html) {
  const body = extractArticleBody(html);
  const firstPrize = numbersAfter(body, "รางวัลที่ 1", 6, 1)[0];

  if (!firstPrize) {
    throw new Error(`Could not parse first prize from ${url}`);
  }

  const frontThree = numbersAfter(body, "รางวัลเลขหน้า 3 ตัว", 3, 2);
  const backThree = numbersAfter(body, "รางวัลเลขท้าย 3 ตัว", 3, 2);
  const lastTwo = numbersAfter(body, "รางวัลเลขท้าย 2 ตัว", 2, 1)[0] ||
    firstPrize.slice(-2);

  return {
    source: "sanookArchive",
    url,
    date: parseCheckDate(url),
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

async function getArchiveLinks(page) {
  const { data } = await axios.get(`${BASE_URL}/lotto/archive/page/${page}/`, {
    headers: REQUEST_HEADERS,
    timeout: 15000
  });

  return unique(
    [...data.matchAll(/href="(https:\/\/news\.sanook\.com\/lotto\/check\/\d+\/)"/g)]
      .map(match => match[1])
  );
}

async function scrapeSanookArchive({ pages = 10 } = {}) {
  const links = [];

  for (let page = 1; page <= pages; page++) {
    links.push(...await getArchiveLinks(page));
  }

  const draws = [];

  for (const url of unique(links)) {
    try {
      const { data } = await axios.get(url, {
        headers: REQUEST_HEADERS,
        timeout: 15000
      });

      draws.push(parseResultPage(url, data));
    } catch {
      // Skip pages where results are not yet available
    }
  }

  return draws;
}

module.exports = {
  scrapeSanookArchive
};
