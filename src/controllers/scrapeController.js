const ingest = require("../../scripts/ingest");
const retrain = require("../../scripts/retrain");
const { getPredictions } = require("../services/predictionService");
const { recordScrape, recordRetrain } = require("../services/healthStore");

exports.refreshData = async (req, res) => {
  try {
    // Step 1: Scrape latest draw results
    await ingest();
    console.log("Manual refresh: ingest complete");
    recordScrape(true, "Manual scrape completed");

    // Step 2: Recalculate predictions
    await retrain();
    console.log("Manual refresh: retrain complete");
    recordRetrain(true, "Manual retrain completed");

    // Step 3: Return fresh predictions
    const predictions = getPredictions();
    res.json({
      success: true,
      message: "Data refreshed successfully",
      totalHistory: predictions.totalHistory,
      lastIngest: predictions.lastIngest,
      predictions
    });
  } catch (err) {
    console.error(`Manual refresh failed: ${err.message}`);
    recordScrape(false, err.message);

    // Even if scrape fails, return current predictions with error info
    // Use HTTP 200 so the frontend can still display existing data
    const predictions = getPredictions();
    res.status(200).json({
      success: false,
      message: `Scrape failed: ${err.message}. Showing existing data.`,
      totalHistory: predictions.totalHistory,
      lastIngest: predictions.lastIngest,
      predictions
    });
  }
};
