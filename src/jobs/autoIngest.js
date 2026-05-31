const cron = require("node-cron");
const ingest = require("../../scripts/ingest");

cron.schedule("0 */12 * * *", async () => {
  console.log("Running scheduled ingestion...");
  await ingest();
});
