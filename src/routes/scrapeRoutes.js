const express = require("express");
const router = express.Router();
const { refreshData } = require("../controllers/scrapeController");

router.post("/", refreshData);

module.exports = router;
