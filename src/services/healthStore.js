const os = require("os");

const state = {
  serverStartedAt: new Date().toISOString(),
  lastScrapeAt: null,
  lastScrapeSuccess: null,
  lastScrapeMessage: null,
  lastRetrainAt: null,
  lastRetrainSuccess: null,
  lastRetrainMessage: null
};

function recordScrape(success, message) {
  state.lastScrapeAt = new Date().toISOString();
  state.lastScrapeSuccess = success;
  state.lastScrapeMessage = message || null;
}

function recordRetrain(success, message) {
  state.lastRetrainAt = new Date().toISOString();
  state.lastRetrainSuccess = success;
  state.lastRetrainMessage = message || null;
}

function getStatus() {
  return {
    status: "ok",
    serverStartedAt: state.serverStartedAt,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    platform: process.platform,
    nodeVersion: process.version,
    hostname: os.hostname(),
    scrape: {
      lastAttempt: state.lastScrapeAt,
      lastSuccess: state.lastScrapeSuccess,
      lastMessage: state.lastScrapeMessage
    },
    retrain: {
      lastAttempt: state.lastRetrainAt,
      lastSuccess: state.lastRetrainSuccess,
      lastMessage: state.lastRetrainMessage
    }
  };
}

module.exports = {
  recordScrape,
  recordRetrain,
  getStatus
};
