const cron = require("node-cron");
const ingest = require("../../scripts/ingest");
const { recordScrape } = require("../services/healthStore");

async function runIngest(label) {
  console.log(`Running ${label}...`);
  try {
    await ingest();
    recordScrape(true, `${label} completed`);
  } catch (err) {
    console.error(`${label} failed: ${err.message}`);
    recordScrape(false, `${label}: ${err.message}`);
  }
}

// Run immediately on server start (with short delay for server to be ready)
setTimeout(() => runIngest("Startup ingestion"), 3000);

// Then every 12 hours after that
cron.schedule("0 */12 * * *", () => runIngest("Scheduled ingestion"));
