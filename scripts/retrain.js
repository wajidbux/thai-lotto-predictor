const fs = require("fs");
const path = require("path");
const { getPredictions } = require("../src/services/predictionService");

async function retrain() {
  try {
    console.log("Recalculating statistical prediction cache...");

    const predictions = getPredictions();
    const cachePath = path.join(__dirname, "..", "data", "cache.json");

    fs.writeFileSync(
      cachePath,
      JSON.stringify(predictions, null, 2)
    );

    console.log(`Retrain complete. History rows: ${predictions.totalHistory}`);
  } catch (err) {
    console.error("Retrain failed:", err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  retrain();
}

module.exports = retrain;
