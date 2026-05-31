const express = require("express");

const router = express.Router();

const {
  getAllPredictions,
  get2DigitPrediction,
  get3DigitPrediction,
  get6DigitPrediction
} = require("../controllers/predictController");

router.get("/all", getAllPredictions);

router.get("/2digit", get2DigitPrediction);

router.get("/3digit", get3DigitPrediction);

router.get("/6digit", get6DigitPrediction);

module.exports = router;