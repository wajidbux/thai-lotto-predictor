const { getStatus } = require("../services/healthStore");
const { getPredictions } = require("../services/predictionService");

exports.getHealth = (req, res) => {
  const predictions = getPredictions();
  const health = getStatus();

  res.json({
    ...health,
    history: {
      totalDraws: predictions.totalHistory,
      lastIngest: predictions.lastIngest,
      generatedAt: predictions.generatedAt
    }
  });
};
