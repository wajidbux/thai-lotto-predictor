const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const predictRoutes = require("./src/routes/predictRoutes");
const scrapeRoutes = require("./src/routes/scrapeRoutes");
const healthRoutes = require("./src/routes/healthRoutes");

app.use("/predict", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/predict", predictRoutes);
app.use("/scrape", scrapeRoutes);
app.use("/health", healthRoutes);

require("./src/jobs/autoIngest");
require("./src/jobs/autoRetrain");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
