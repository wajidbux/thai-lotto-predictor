const ingest = require("../../scripts/ingest");
const retrain = require("../../scripts/retrain");
const { getPredictions } = require("../services/predictionService");

exports.refreshData = async (req, res) => {
  try {
    // Step 1: Scrape latest draw results
    await ingest();
    console.log("Manual refresh: ingest complete");

    // Step 2: Recalculate predictions
    await retrain();
    console.log("Manual refresh: retrain complete");

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
    // Even if scraping fails, return current predictions
    const predictions = getPredictions();
    res.json({
      success: false,
      message: `Scrape failed: ${err.message}. Showing existing data.`,
      totalHistory: predictions.totalHistory,
      lastIngest: predictions.lastIngest,
      predictions
    });
  }
};
