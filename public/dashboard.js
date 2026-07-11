// ---- Language Support ----

const TH = {
  // Header
  pageTitle: "เครื่องทำนายหวยไทย",
  predictBtn: "พยากรณ์ทั้งหมด",
  refreshBtn: "↻ อัปเดตข้อมูล",
  refreshing: "กำลังอัปเดตข้อมูล...",
  refreshSuccess: "อัปเดตข้อมูลสำเร็จ!",
  refreshFail: "อัปเดตล้มเหลว",
  loading: "คลิกเพื่อโหลดคำทำนาย",
  loaded: (n) => `โหลดแล้ว ${n} ตลาดการเดิมพัน`,
  // Summary cards
  top2Summary: "สรุปเลข 2 ตัวบน",
  top2SummaryNote: "เลข 2 ตัวท้ายของรางวัลที่ 1",
  top3Summary: "สรุปเลข 3 ตัวบน",
  top3SummaryNote: "เลข 3 ตัวท้ายของรางวัลที่ 1",
  top4Summary: "สรุปเลข 4 ตัวบน",
  top4SummaryNote: "เลข 4 ตัวท้ายของรางวัลที่ 1",
  top5Summary: "สรุปเลข 5 ตัวบน",
  top5SummaryNote: "เลข 5 ตัวท้ายของรางวัลที่ 1",
  top6Summary: "สรุปเลข 6 ตัวบน",
  top6SummaryNote: "เลข 6 ตัวเต็มของรางวัลที่ 1",
  hotNumbers: "เลขเด่น",
  coldNumbers: "เลขรอง",
  historyHeader: "จำนวนงวดที่บันทึก",
  lastUpdated: "อัปเดตล่าสุด",
  bettingMarkets: "ตลาดการเดิมพัน",
  // Pool card
  poolTitle: "🎯 กลุ่มเลขตามตำแหน่งรางวัลที่ 1",
  poolNote: "เลข 3 อันดับแรกต่อตำแหน่ง พร้อมเปอร์เซ็นต์ความเชื่อมั่น",
  poolFull: "6 หลักเต็ม",
  poolLast3: "3 หลักท้าย",
  poolLast2: "2 หลักท้าย",
  poolViewExact: (n) => `ดูคำทำนายที่แน่นอน (${n})`,
  // Health card
  healthHeader: "สถานะระบบ",
  serverUptime: "เวลาทำงาน",
  serverStarted: "เริ่มทำงานเมื่อ",
  memoryUsage: "การใช้หน่วยความจำ",
  nodeVersion: "เวอร์ชัน Node",
  lastScrape: "ดึงข้อมูลล่าสุด",
  lastRetrain: "คำนวณล่าสุด",
  never: "ไม่เคย",
  justNow: "เมื่อกี้",
  // Market labels
  fourRow: { title: "4 แถว", note: "6 คู่จากเลข 4 ตัวบน" },
  fourReverse: { title: "กลับ 4 ตัว", note: "ช่วยเรียงสับเปลี่ยนเลข 4 ตัว" },
  top5: { title: "5 ตัวบน", note: "เลข 5 ตัวท้ายของรางวัลที่ 1" },
  top4: { title: "4 ตัวบน", note: "เลข 4 ตัวท้ายของรางวัลที่ 1" },
  threeRow: { title: "3 แถว", note: "3 คู่จากเลข 3 ตัวบน" },
  bottom3: { title: "เลข 3 ตัวล่าง", note: "รางวัลเลขหน้า/หลัง 3 ตัว" },
  threeReverse: { title: "กลับ 3 ตัว", note: "ช่วยเรียงสับเปลี่ยนเลข 3 ตัว" },
  bottom2: { title: "เลข 2 ตัวล่าง", note: "รางวัลเลข 2 ตัวท้าย" },
  twoReverse: { title: "กลับ 2 ตัว", note: "ช่วยเรียงสับเปลี่ยนเลข 2 ตัว" },
  twoRow: { title: "2 แถว", note: "เลข 2 หลักที่ปรากฏใน 3 ตัวบน" },
  runningTop: { title: "เลขวิ่งบน", note: "หลักที่ปรากฏใน 3 ตัวบน" },
  runningBottom: { title: "เลขวิ่งล่าง", note: "หลักที่ปรากฏใน 2 ตัวล่าง" }
};

let currentLang = localStorage.getItem("lang") || "en";

function t(key, ...args) {
  if (currentLang !== "th") return null; // Not Thai → leave as-is
  const val = TH[key];
  if (typeof val === "function") return val(...args);
  return val || null;
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "th" : "en";
  localStorage.setItem("lang", currentLang);
  document.querySelectorAll(".lang-en, .lang-th").forEach(el => {
    el.classList.toggle("active", el.classList.contains("lang-" + currentLang));
  });
  applyTranslations();
  // Re-render pool card if it exists
  const container = document.getElementById("marketPredictions");
  if (container && window._lastMarkets) {
    container.innerHTML = renderDigitPools(window._lastMarkets.firstPools, window._lastMarkets, true) +
      renderMarketCards(window._lastMarkets, true);
  }
}

function applyTranslations() {
  // Page title
  const titleText = t("pageTitle");
  if (titleText) document.getElementById("pageTitle").textContent = titleText;
  else if (currentLang === "en") document.getElementById("pageTitle").textContent = "Thai Lotto AI Predictor";

  // Predict button
  const btnText = t("predictBtn");
  if (btnText) document.getElementById("predictBtn").textContent = btnText;
  else if (currentLang === "en") document.getElementById("predictBtn").textContent = "Predict All";

  // Refresh button
  const refreshText = t("refreshBtn");
  if (refreshText) document.getElementById("refreshBtn").textContent = refreshText;
  else if (currentLang === "en") document.getElementById("refreshBtn").textContent = "↻ Refresh Data";

  const status = document.getElementById("status");
  if (status && currentLang === "th") {
    const text = status.textContent;
    if (text === "Click to Load predictions") status.textContent = TH.loading;
    else if (text.startsWith("Predict All loaded")) {
      const m = text.match(/\d+/);
      status.textContent = m ? TH.loaded(m[0]) : TH.loaded(0);
    }
  } else if (status && currentLang === "en") {
    if (status.textContent === TH.loading) status.textContent = "Click to Load predictions";
    else if (status.textContent.startsWith("โหลดแล้ว")) {
      const m = status.textContent.match(/\d+/);
      status.textContent = m ? `Predict All loaded ${m[0]} betting markets.` : "Predict All loaded 0 betting markets.";
    }
  }

  const map = {
    top2SummaryHeader: "top2Summary",
    top2SummaryNote: "top2SummaryNote",
    top3SummaryHeader: "top3Summary",
    top3SummaryNote: "top3SummaryNote",
    top4SummaryHeader: "top4Summary",
    top4SummaryNote: "top4SummaryNote",
    top5SummaryHeader: "top5Summary",
    top5SummaryNote: "top5SummaryNote",
    top6SummaryHeader: "top6Summary",
    top6SummaryNote: "top6SummaryNote",
    hotNumbersHeader: "hotNumbers",
    coldNumbersHeader: "coldNumbers",
    historyHeader: "historyHeader",
    bettingMarketsHeader: "bettingMarkets"
  };

  for (const [id, key] of Object.entries(map)) {
    const val = t(key);
    if (val) document.getElementById(id).textContent = val;
    else if (currentLang === "en") {
      // Restore English defaults
      const defaults = {
        top2SummaryHeader: "Top 2 Summary",
        top2SummaryNote: "Last 2 digits of the 1st prize",
        top3SummaryHeader: "Top 3 Summary",
        top3SummaryNote: "Last 3 digits of the 1st prize",
        top4SummaryHeader: "Top 4 Summary",
        top4SummaryNote: "Last 4 digits of the 1st prize",
        top5SummaryHeader: "Top 5 Summary",
        top5SummaryNote: "Last 5 digits of the 1st prize",
        top6SummaryHeader: "Top 6 Summary",
        top6SummaryNote: "Full 6 digits of the 1st prize",
        hotNumbersHeader: "Hot Numbers",
        coldNumbersHeader: "Cold Numbers",
        historyHeader: "Total Historical Draws",
        bettingMarketsHeader: "Betting Markets"
      };
      if (defaults[id]) document.getElementById(id).textContent = defaults[id];
    }
  }

  // Health card labels — only update static labels, dynamic values are set by loadHealth()
  const healthLabels = {
    healthUptimeLabel: t("serverUptime") || "Server Uptime",
    healthStartedLabel: t("serverStarted") || "Server Started",
    healthMemoryLabel: t("memoryUsage") || "Memory Usage",
    healthNodeLabel: t("nodeVersion") || "Node Version",
    healthScrapeLabel: t("lastScrape") || "Last Scrape",
    healthRetrainLabel: t("lastRetrain") || "Last Retrain"
  };
  for (const [id, label] of Object.entries(healthLabels)) {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  }

  // Health card header
  const healthHeader = document.getElementById("healthHeader");
  if (healthHeader) {
    const thLabel = t("healthHeader");
    if (thLabel) {
      const dot = healthHeader.querySelector(".health-dot");
      healthHeader.innerHTML = `<span class="${dot.className}"></span> ${thLabel}`;
    }
  }

  // Handle last updated note separately (has dynamic timestamp)
  const lastEl = document.getElementById("lastUpdatedNote");
  if (lastEl && lastEl.dataset.lastIngest) {
    const prefix = t("lastUpdated") || "Last updated";
    lastEl.textContent = `${prefix}: ${lastEl.dataset.lastIngest}`;
  }
}

// ---- Refresh Data (Scrape + Retrain) ----

async function refreshData() {
  const btn = document.getElementById("refreshBtn");
  const status = document.getElementById("status");

  if (!btn) return;

  btn.disabled = true;
  btn.textContent = t("refreshing") || "↻ Refreshing...";
  if (status) status.textContent = t("refreshing") || "Refreshing data...";

  try {
    const res = await fetch("/scrape", {
      method: "POST",
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`Refresh failed (HTTP ${res.status})`);
    }

    const data = await res.json();

    // Always populate cards (even on scrape failure, we have existing data)
    if (data.predictions) {
      populatePredictions(data.predictions);
    }

    // Refresh health card after operation
    loadHealth();

    if (status) {
      if (data.success) {
        status.textContent = t("refreshSuccess") || "✅ Data refreshed successfully!";
      } else {
        status.textContent = `⚠️ ${data.message || "Refresh failed"}`;
        // Flash the status red momentarily to draw attention
        status.style.color = "#fbbf24";
        setTimeout(() => { status.style.color = "#bfdbfe"; }, 4000);
      }
    }
  } catch (err) {
    if (status) {
      status.textContent = `${t("refreshFail") || "❌ Refresh failed"}: ${err.message}`;
      status.style.color = "#f87171";
      setTimeout(() => { status.style.color = "#bfdbfe"; }, 4000);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = t("refreshBtn") || "↻ Refresh Data";
  }
}

// ---- Prediction Loading ----

// ---- Population Helper (shared by loadPredictions & refreshData) ----

function populatePredictions(data) {
  document.getElementById("twoDigit").innerHTML =
    data.twoDigit.join(", ");

  document.getElementById("threeDigit").innerHTML =
    data.threeDigit.join(", ");

  document.getElementById("sixDigit").innerHTML =
    data.sixDigit.join(", ");

  document.getElementById("fiveDigit").innerHTML =
    (data.markets.top5 || []).join(", ");

  document.getElementById("fourDigit").innerHTML =
    (data.markets.top4 || []).join(", ");

  document.getElementById("hotNumbers").innerHTML =
    data.hotNumbers.join(", ");

  document.getElementById("coldNumbers").innerHTML =
    data.coldNumbers.join(", ");

  document.getElementById("historyCount").innerHTML =
    data.totalHistory;

  // Show last updated time
  const lastUpdatedEl = document.getElementById("lastUpdatedNote");
  if (lastUpdatedEl && data.lastIngest) {
    const d = new Date(data.lastIngest);
    const localTime = d.toLocaleString();
    lastUpdatedEl.dataset.lastIngest = localTime;
    const prefix = t("lastUpdated") || "Last updated";
    lastUpdatedEl.textContent = `${prefix}: ${localTime}`;
  }

  renderMarkets(data.markets || {});
}

async function loadPredictions() {
  const status = document.getElementById("status");
  const loadingText = t("loading") || "Click to Load predictions";

  if (status) {
    status.textContent = loadingText;
  }

  try {
    const res = await fetch(`/predict/all?ts=${Date.now()}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error(`Prediction request failed: ${res.status}`);
    }

    const data = await res.json();

    populatePredictions(data);

    if (status) {
      const loadedText = t("loaded", Object.keys(data.markets || {}).length) ||
        `Predict All loaded ${Object.keys(data.markets || {}).length} betting markets.`;
      status.textContent = loadedText;
    }
  } catch (err) {
    if (status) {
      status.textContent = err.message;
    }
  }
}

// ---- Formatting & Rendering ----

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && Array.isArray(value.covers)) {
    return `${value.base}: ${value.covers.join(", ")}`;
  }

  if (value && typeof value === "object") {
    return Object.values(value).join(", ");
  }

  return String(value || "");
}

function renderDigitPools(pools, allMarkets, skipApply) {
  if (!pools || !pools.positions) {
    return "";
  }

  const isTh = currentLang === "th";

  function poolTable(positions, posOffset) {
    const rows = positions.map(p => {
      const digitsHtml = p.digits.map((d, i) =>
        `<span class="pool-digit">${d}</span> <span class="pool-pct">${p.confidence[i]}%</span>`
      ).join(" &nbsp; ");
      const posLabel = posOffset !== undefined ? `${p.position + posOffset}` : `${p.position}`;
      const posPrefix = isTh ? "ตำแหน่ง" : "Pos";
      return `<tr><td class="pool-pos">${posPrefix} ${posLabel}</td><td class="pool-digs">${digitsHtml}</td></tr>`;
    }).join("");
    return `<table class="pool-table">${rows}</table>`;
  }

  const positions = pools.positions;
  const suffixes = pools.suffixes || {};

  const fullPoolHtml = poolTable(positions);
  const top3PoolHtml = suffixes["3"] ? poolTable(suffixes["3"], 3) : "";
  const top2PoolHtml = suffixes["2"] ? poolTable(suffixes["2"], 4) : "";

  const poolTitle = t("poolTitle") || "🎯 1st Prize Digit Pools";
  const poolNote = t("poolNote") || "Top 3 most likely digits per position with confidence %";
  const fullLabel = t("poolFull") || "Full 6-Digit";
  const last3Label = t("poolLast3") || "Last 3 Digits";
  const last2Label = t("poolLast2") || "Last 2 Digits";
  const viewExact6 = t("poolViewExact", (allMarkets.top6 || []).length) || `View exact predictions (${(allMarkets.top6 || []).length})`;
  const viewExact3 = t("poolViewExact", (allMarkets.top3 || []).length) || `View exact predictions (${(allMarkets.top3 || []).length})`;
  const viewExact2 = t("poolViewExact", (allMarkets.top2 || []).length) || `View exact predictions (${(allMarkets.top2 || []).length})`;

  const html = `
    <div class="card market-card pools-card">
      <h3>${poolTitle}</h3>
      <small>${poolNote}</small>
      <div class="pools-grid">
        <div class="pool-section">
          <h4>${fullLabel}</h4>
          ${fullPoolHtml}
          <details class="pool-exact">
            <summary>${viewExact6}</summary>
            <p>${(allMarkets.top6 || []).join(", ")}</p>
          </details>
        </div>
        <div class="pool-section">
          <h4>${last3Label}</h4>
          ${top3PoolHtml}
          <details class="pool-exact">
            <summary>${viewExact3}</summary>
            <p>${(allMarkets.top3 || []).join(", ")}</p>
          </details>
        </div>
        <div class="pool-section">
          <h4>${last2Label}</h4>
          ${top2PoolHtml}
          <details class="pool-exact">
            <summary>${viewExact2}</summary>
            <p>${(allMarkets.top2 || []).join(", ")}</p>
          </details>
        </div>
      </div>
    </div>
  `;

  if (!skipApply) {
    window._lastMarkets = allMarkets;
  }
  return html;
}

function renderMarketCards(markets, skipApply) {
  const labels = {
    top5: { titleKey: "top5" },
    top4: { titleKey: "top4" },
    fourRow: { titleKey: "fourRow" },
    fourReverse: { titleKey: "fourReverse" },
    threeRow: { titleKey: "threeRow" },
    bottom3: { titleKey: "bottom3" },
    threeReverse: { titleKey: "threeReverse" },
    bottom2: { titleKey: "bottom2" },
    twoReverse: { titleKey: "twoReverse" },
    twoRow: { titleKey: "twoRow" },
    runningTop: { titleKey: "runningTop" },
    runningBottom: { titleKey: "runningBottom" }
  };

  return Object.entries(labels)
    .map(([key, config]) => {
      const value = markets[key] || [];
      const rows = Array.isArray(value)
        ? value.map(formatValue).join("<br>")
        : formatValue(value);

      // English defaults
      const enLabels = {
        top5: { title: "Top 5 Digits", note: "Last 5 digits of the 1st prize" },
        top4: { title: "Top 4 Digits", note: "Last 4 digits of the 1st prize" },
        fourRow: { title: "4 Row", note: "6 pairs from Top 4" },
        fourReverse: { title: "4 Reverse Numbers", note: "All 24 permutations of 4-digit bets" },
        threeRow: { title: "3 Row", note: "3 pairs from Top 3" },
        bottom3: { title: "Bottom 3 Digits", note: "Official front/back 3-digit prizes" },
        threeReverse: { title: "3 Reverse Numbers", note: "All 6 permutations of 3-digit bets" },
        bottom2: { title: "Bottom 2 Digits", note: "Official last 2 digits prize" },
        twoReverse: { title: "2 Reverse Digits", note: "Both orders of each 2-digit pair" },
        twoRow: { title: "2 Row", note: "2 digits appearing in Top 3" },
        runningTop: { title: "Top 1 Digit / Running Top", note: "Digits appearing in Top 3" },
        runningBottom: { title: "Bottom 1 Digit / Running Bottom", note: "Digits appearing in Bottom 2" }
      };

      const en = enLabels[key] || { title: key, note: "" };
      const title = currentLang === "th" ? (TH[config.titleKey]?.title || en.title) : en.title;
      const note = currentLang === "th" ? (TH[config.titleKey]?.note || en.note) : en.note;

      return `
        <div class="card market-card">
          <h3>${title}</h3>
          <small>${note}</small>
          <p>${rows}</p>
        </div>
      `;
    })
    .join("");
}

function renderMarkets(markets) {
  const container = document.getElementById("marketPredictions");

  if (!container) {
    return;
  }

  window._lastMarkets = markets;

  // Render digit pools card
  const poolsHtml = renderDigitPools(markets.firstPools, markets, true);

  // Render the rest of the markets
  const marketsHtml = renderMarketCards(markets, true);

  container.innerHTML = poolsHtml + marketsHtml;
}

// ---- System Health Card ----

function formatUptime(seconds) {
  if (seconds == null) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return t("never") || "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 5000) return t("justNow") || "Just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function setHealthEventIcon(el, success) {
  if (success === true) {
    el.textContent = "✅";
  } else if (success === false) {
    el.textContent = "❌";
  } else {
    el.textContent = "⏳";
  }
}

function healthMsgClass(msg, success) {
  if (!msg) return "";
  if (success === true) return "success";
  if (success === false) return "error";
  return "";
}

async function loadHealth() {
  const card = document.getElementById("healthCard");
  if (!card) return;

  try {
    const res = await fetch("/health", { cache: "no-store" });
    if (!res.ok) return;

    const h = await res.json();

    // Update dot based on overall status
    const dot = document.getElementById("healthStatusDot");
    if (dot) {
      const hasScrapeIssue = h.scrape && h.scrape.lastSuccess === false;
      const hasRetrainIssue = h.retrain && h.retrain.lastSuccess === false;
      if (hasScrapeIssue || hasRetrainIssue) {
        dot.className = "health-dot health-dot-err";
      } else if (h.scrape && h.scrape.lastSuccess === null) {
        dot.className = "health-dot health-dot-warn";
      } else {
        dot.className = "health-dot health-dot-ok";
      }
    }

    // Header
    const healthHeader = document.getElementById("healthHeader");
    if (healthHeader) {
      const label = t("healthHeader") || "System Health";
      const dot = healthHeader.querySelector(".health-dot");
      healthHeader.innerHTML = `<span class="${dot.className}"></span> ${label}`;
    }

    // Grid stats
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || "—";
    };
    setVal("healthUptime", formatUptime(h.uptimeSeconds));
    setVal("healthStarted", h.serverStartedAt ? new Date(h.serverStartedAt).toLocaleString() : "—");
    setVal("healthMemory", h.memoryUsageMB ? `${h.memoryUsageMB} MB` : "—");
    setVal("healthNode", h.nodeVersion || "—");

    // Scrape event
    setVal("healthScrapeTime", formatTimeAgo(h.scrape?.lastAttempt));
    const scrapeMsg = document.getElementById("healthScrapeMsg");
    if (scrapeMsg) {
      scrapeMsg.textContent = h.scrape?.lastMessage || "";
      scrapeMsg.className = "health-event-msg " + healthMsgClass(h.scrape?.lastMessage, h.scrape?.lastSuccess);
    }
    setHealthEventIcon(document.getElementById("scrapeIcon"), h.scrape?.lastSuccess);

    // Retrain event
    setVal("healthRetrainTime", formatTimeAgo(h.retrain?.lastAttempt));
    const retrainMsg = document.getElementById("healthRetrainMsg");
    if (retrainMsg) {
      retrainMsg.textContent = h.retrain?.lastMessage || "";
      retrainMsg.className = "health-event-msg " + healthMsgClass(h.retrain?.lastMessage, h.retrain?.lastSuccess);
    }
    setHealthEventIcon(document.getElementById("retrainIcon"), h.retrain?.lastSuccess);
  } catch {
    // Silently fail — health card will show dashes
  }
}

// Apply language on page load, then load health
document.addEventListener("DOMContentLoaded", () => {
  if (currentLang === "th") {
    document.querySelectorAll(".lang-en, .lang-th").forEach(el => {
      el.classList.toggle("active", el.classList.contains("lang-th"));
    });
    applyTranslations();
  }

  // Load health data on page load
  loadHealth();
});
