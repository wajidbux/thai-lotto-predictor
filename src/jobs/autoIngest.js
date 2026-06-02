const cron = require("node-cron");
const ingest = require("../../scripts/ingest");

// Run immediately on server start (with short delay for server to be ready)
setTimeout(async () => {
  console.log("Running startup ingestion...");
  try {
    await ingest();
  } catch (err) {
    console.error(`Startup ingestion failed: ${err.message}`);
  }
}, 3000);

// Then every 12 hours after that
cron.schedule("0 */12 * * *", async () => {
  console.log("Running scheduled ingestion...");
  try {
    await ingest();
  } catch (err) {
    console.error(`Scheduled ingestion failed: ${err.message}`);
  }
});
