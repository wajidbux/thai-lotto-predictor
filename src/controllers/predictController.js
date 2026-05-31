const {
  getPredictions
} = require("../services/predictionService");

exports.get2DigitPrediction = (req, res) => {
  const data = getPredictions();
  res.json({ type: "2digit", predictions: data.twoDigit });
};

exports.get3DigitPrediction = (req, res) => {
  const data = getPredictions();
  res.json({ type: "3digit", predictions: data.threeDigit });
};

exports.get6DigitPrediction = (req, res) => {
  const data = getPredictions();
  res.json({ type: "6digit", predictions: data.sixDigit });
};

exports.getAllPredictions = (req, res) => {
  res.json(getPredictions());
};
