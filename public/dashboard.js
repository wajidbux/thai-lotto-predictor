// ---- Language Support ----

const TH = {
  // Header
  pageTitle: "เครื่องทำนายหวยไทย",
  predictBtn: "พยากรณ์ทั้งหมด",
  loading: "คลิกเพื่อโหลดคำทำนาย",
  loaded: (n) => `โหลดแล้ว ${n} ตลาดการเดิมพัน`,
  // Summary cards
  top2Summary: "สรุปเลข 2 ตัวบน",
  top2SummaryNote: "เลข 2 ตัวท้ายของรางวัลที่ 1",
  top3Summary: "สรุปเลข 3 ตัวบน",
  top3SummaryNote: "เลข 3 ตัวท้ายของรางวัลที่ 1",
  top6Summary: "สรุปเลข 6 ตัวบน",
  top6SummaryNote: "เลข 6 ตัวเต็มของรางวัลที่ 1",
  hotNumbers: "เลขเด่น",
  coldNumbers: "เลขรอง",
  historyHeader: "จำนวนงวดที่บันทึก",
  bettingMarkets: "ตลาดการเดิมพัน",
  // Pool card
  poolTitle: "🎯 กลุ่มเลขตามตำแหน่งรางวัลที่ 1",
  poolNote: "เลข 3 อันดับแรกต่อตำแหน่ง พร้อมเปอร์เซ็นต์ความเชื่อมั่น",
  poolFull: "6 หลักเต็ม",
  poolLast3: "3 หลักท้าย",
  poolLast2: "2 หลักท้าย",
  poolViewExact: (n) => `ดูคำทำนายที่แน่นอน (${n})`,
  // Market labels
  fourRow: { title: "4 แถว", note: "เรียงสับเปลี่ยนของ 4 ตัวบน" },
  threeRow: { title: "3 แถว", note: "เรียงสับเปลี่ยนของ 3 ตัวบน" },
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
}

// ---- Prediction Loading ----

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

    document.getElementById("twoDigit").innerHTML =
      data.twoDigit.join(", ");

    document.getElementById("threeDigit").innerHTML =
      data.threeDigit.join(", ");

    document.getElementById("sixDigit").innerHTML =
      data.sixDigit.join(", ");

    document.getElementById("hotNumbers").innerHTML =
      data.hotNumbers.join(", ");

    document.getElementById("coldNumbers").innerHTML =
      data.coldNumbers.join(", ");

    document.getElementById("historyCount").innerHTML =
      data.totalHistory;

    renderMarkets(data.markets || {});

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
    fourRow: { titleKey: "fourRow" },
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
        fourRow: { title: "4 Row", note: "Permutations of Top 4" },
        threeRow: { title: "3 Row", note: "Permutations of Top 3" },
        bottom3: { title: "Bottom 3 Digits", note: "Official front/back 3-digit prizes" },
        threeReverse: { title: "3 Reverse Numbers", note: "Permutation helper for 3-digit bets" },
        bottom2: { title: "Bottom 2 Digits", note: "Official last 2 digits prize" },
        twoReverse: { title: "2 Reverse Digits", note: "Permutation helper for 2-digit bets" },
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

// Apply language on page load
document.addEventListener("DOMContentLoaded", () => {
  if (currentLang === "th") {
    document.querySelectorAll(".lang-en, .lang-th").forEach(el => {
      el.classList.toggle("active", el.classList.contains("lang-th"));
    });
    applyTranslations();
  }
});
