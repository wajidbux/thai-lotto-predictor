const cron = require("node-cron");
const retrain = require("../../scripts/retrain");

cron.schedule("15 */12 * * *", async () => {
  console.log("Running scheduled retrain...");
  await retrain();
});
