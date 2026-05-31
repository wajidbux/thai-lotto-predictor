const { scrapeArchive } = require("../src/services/lotteryPlusScraper");
const { scrapeSanookArchive } = require("../src/services/sanookArchiveScraper");
const { scrapeLatestDraw } = require("../src/services/gloScraper");
const { upsertDraws, writeHistory } = require("../src/services/historyStore");
const { validateDraw } = require("../src/utils/validator");

async function archiveIngest() {
  try {
    const draws = [
      ...await scrapeArchive(),
      ...await scrapeSanookArchive({
        pages: Number(process.env.SANOOK_ARCHIVE_PAGES || 10)
      })
    ];
    const validDraws = draws.filter(validateDraw);

    if (!validDraws.length) {
      throw new Error("LotteryPlus archive returned no valid draws");
    }

    let history = upsertDraws(validDraws);

    // Also attempt to fetch the latest draw from GLO as a supplement
    try {
      const latestDraw = await scrapeLatestDraw();

      if (validateDraw(latestDraw)) {
        history = upsertDraws([latestDraw]);
      }
    } catch (_) {
      // GLO is a supplement; failure is non-fatal
    }

    history = history.sort((a, b) => new Date(b.date) - new Date(a.date));
    writeHistory(history);

    console.log(
      `Archive ingest complete. Added/updated ${validDraws.length} archive draws. Stored draws: ${history.length}`
    );
  } catch (err) {
    console.error(`Archive ingest failed: ${err.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  archiveIngest();
}

module.exports = archiveIngest;
