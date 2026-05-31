const { scrapeLatestDraw } = require("../src/services/multiSourceScraper");
const { upsertDraw, readHistory } = require("../src/services/historyStore");
const { validateDraw } = require("../src/utils/validator");

async function ingest() {
  try {
    const draw = await scrapeLatestDraw();

    if (!validateDraw(draw)) {
      throw new Error("Scraped draw failed validation");
    }

    const history = upsertDraw(draw);
    console.log(
      `Ingest complete from ${draw.source || "unknown source"}. Stored draws: ${history.length}`
    );
  } catch (err) {
    const history = readHistory();
    console.error(`Ingest skipped: ${err.message}`);
    console.log(`Using existing local history. Stored draws: ${history.length}`);
  }
}

if (require.main === module) {
  ingest();
}

module.exports = ingest;
