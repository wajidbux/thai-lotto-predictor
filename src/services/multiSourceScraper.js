const lotteryPlus = require("./lotteryPlusScraper");
const sanook = require("./scraperService");
const glo = require("./gloScraper");

const sources = [
  {
    name: "GLO",
    scrape: glo.scrapeLatestDraw
  },
  {
    name: "LotteryPlus",
    scrape: lotteryPlus.scrapeLatestDraw
  },
  {
    name: "Sanook",
    scrape: sanook.scrapeLatestDraw
  }
];

async function scrapeLatestDraw() {
  const errors = [];

  for (const source of sources) {
    try {
      const draw = await source.scrape();
      return {
        ...draw,
        source: draw.source || source.name
      };
    } catch (err) {
      errors.push(`${source.name}: ${err.message}`);
    }
  }

  throw new Error(errors.join("; "));
}

module.exports = {
  scrapeLatestDraw
};
