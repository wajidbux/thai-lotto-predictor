const cron = require("node-cron");
const retrain = require("../../scripts/retrain");

// Run immediately on server start (with short delay for server to be ready)
setTimeout(async () => {
  console.log("Running startup retrain...");
  try {
    await retrain();
  } catch (err) {
    console.error(`Startup retrain failed: ${err.message}`);
  }
}, 5000);

// Then every 12 hours after that
cron.schedule("15 */12 * * *", async () => {
  console.log("Running scheduled retrain...");
  try {
    await retrain();
  } catch (err) {
    console.error(`Scheduled retrain failed: ${err.message}`);
  }
});
