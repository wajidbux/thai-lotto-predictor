const cron = require("node-cron");
const retrain = require("../../scripts/retrain");
const { recordRetrain } = require("../services/healthStore");

async function runRetrain(label) {
  console.log(`Running ${label}...`);
  try {
    await retrain();
    recordRetrain(true, `${label} completed`);
  } catch (err) {
    console.error(`${label} failed: ${err.message}`);
    recordRetrain(false, `${label}: ${err.message}`);
  }
}

// Run immediately on server start (with short delay for server to be ready)
setTimeout(() => runRetrain("Startup retrain"), 5000);

// Then every 12 hours after that
cron.schedule("15 */12 * * *", () => runRetrain("Scheduled retrain"));
