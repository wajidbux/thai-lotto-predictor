const { getPredictions } = require("../src/services/predictionService");

async function retrain() {
  console.log("Recalculating statistical prediction cache...");

  // The in-memory cache inside predictionService will be auto-invalidated
  // when history.json mtime changes. Calling getPredictions() ensures
  // the cache is refreshed and available for subsequent API calls.
  const predictions = getPredictions();

  console.log(`Retrain complete. History rows: ${predictions.totalHistory}`);
}

if (require.main === module) {
  retrain();
}

module.exports = retrain;
