const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const historyPath = path.join(__dirname, "..", "data", "history.json");

function freshPredictionService() {
  delete require.cache[require.resolve("../src/services/predictionService")];
  delete require.cache[require.resolve("../src/services/historyStore")];
  return require("../src/services/predictionService");
}

function withHistory(history, run) {
  const previous = fs.existsSync(historyPath)
    ? fs.readFileSync(historyPath, "utf8")
    : null;

  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  try {
    return run();
  } finally {
    if (previous === null) {
      fs.rmSync(historyPath, { force: true });
    } else {
      fs.writeFileSync(historyPath, previous);
    }
  }
}

const fixtureHistory = [
  {
    date: "2026-05-16",
    prizes: {
      first: { number: ["107387"] },
      last_two: { number: "08" },
      last_three_front: { numbers: ["298", "091"] },
      last_three_back: { numbers: ["602", "716"] }
    }
  },
  {
    date: "2026-05-02",
    prizes: {
      first: { number: ["347258"] },
      last_two: { number: "11" },
      last_three_front: { numbers: ["120", "441"] },
      last_three_back: { numbers: ["835", "902"] }
    }
  },
  {
    date: "2026-04-16",
    prizes: {
      first: { number: ["890123"] },
      last_two: { number: "45" },
      last_three_front: { numbers: ["333", "654"] },
      last_three_back: { numbers: ["789", "012"] }
    }
  }
];

test("top markets use position-based predictions", () => {
  withHistory(fixtureHistory, () => {
    const { getPredictions } = freshPredictionService();
    const { markets } = getPredictions();

    // Position-based predictions are now primary (not raw historical values)
    assert.deepEqual(markets.top6.slice(0, 3), ["107387", "340258", "891123"]);
    assert.deepEqual(markets.top5.slice(0, 3), ["07387", "40258", "91123"]);
    assert.deepEqual(markets.top4.slice(0, 3), ["7387", "0258", "1123"]);
    assert.deepEqual(markets.top3.slice(0, 3), ["387", "258", "123"]);
    assert.deepEqual(markets.top2.slice(0, 3), ["87", "58", "23"]);
  });
});

test("digit pools show top-3 digits and confidence per position", () => {
  withHistory(fixtureHistory, () => {
    const { getPredictions } = freshPredictionService();
    const { markets } = getPredictions();

    assert.ok(markets.firstPools, "firstPools should exist");
    assert.ok(markets.firstPools.positions, "positions should exist");
    assert.equal(markets.firstPools.positions.length, 6, "6 positions for 6-digit number");

    markets.firstPools.positions.forEach(pos => {
      assert.ok(typeof pos.position === "number", "position should be a number");
      assert.ok(Array.isArray(pos.digits), "digits should be an array");
      assert.ok(Array.isArray(pos.confidence), "confidence should be an array");
      assert.equal(pos.digits.length, pos.confidence.length, "digits and confidence should match");
      assert.ok(pos.digits.length <= 3, "top 3 digits max");
    });

    assert.ok(markets.firstPools.suffixes, "suffixes should exist");
    assert.ok(markets.firstPools.suffixes["3"], "last-3 suffix should exist");
    assert.ok(markets.firstPools.suffixes["2"], "last-2 suffix should exist");
    assert.equal(markets.firstPools.suffixes["3"].length, 3, "3 positions for last 3 digits");
    assert.equal(markets.firstPools.suffixes["2"].length, 2, "2 positions for last 2 digits");

    // Verify confidence values are reasonable
    markets.firstPools.positions.forEach(pos => {
      pos.confidence.forEach(pct => {
        assert.ok(pct >= 0 && pct <= 100, `confidence ${pct}% should be 0-100`);
      });
    });
  });
});

test("bottom and running markets are sourced from their official result fields", () => {
  withHistory(fixtureHistory, () => {
    const { getPredictions } = freshPredictionService();
    const { markets } = getPredictions();

    assert.deepEqual(markets.bottom3.slice(0, 4), ["298", "091", "602", "716"]);
    assert.deepEqual(markets.bottom2.slice(0, 3), ["08", "11", "45"]);
    assert.deepEqual(markets.twoRow.slice(0, 3), ["38", "37", "87"]);
    assert.deepEqual(markets.runningTop.slice(0, 3), ["3", "8", "7"]);
    assert.deepEqual(markets.runningBottom.slice(0, 3), ["0", "8", "1"]);
  });
});

test("bottom 2 does not borrow top 2 predictions when history is sparse", () => {
  const repeatedBottomHistory = [
    fixtureHistory[0],
    {
      ...fixtureHistory[1],
      prizes: {
        ...fixtureHistory[1].prizes,
        last_two: { number: "08" }
      }
    },
    {
      ...fixtureHistory[2],
      prizes: {
        ...fixtureHistory[2].prizes,
        last_two: { number: "08" }
      }
    }
  ];

  withHistory(repeatedBottomHistory, () => {
    const { getPredictions } = freshPredictionService();
    const { markets } = getPredictions();

    assert.deepEqual(markets.top2.slice(0, 3), ["87", "58", "23"]);
    assert.deepEqual(markets.bottom2, ["08"]);
    assert.deepEqual(markets.runningBottom, ["0", "8"]);
  });
});

test("row and reverse helpers expand all covered permutations", () => {
  withHistory(fixtureHistory, () => {
    const { getPredictions } = freshPredictionService();
    const { markets } = getPredictions();

    assert.equal(markets.fourRow[0].base, "7387");
    assert.deepEqual(
      markets.fourRow[0].covers,
      ["7387", "7378", "7837", "7873", "7738", "7783", "3787", "3778", "3877", "8737", "8773", "8377"]
    );

    assert.equal(markets.threeReverse[0].base, "387");
    assert.deepEqual(markets.threeReverse[0].covers, ["387", "378", "837", "873", "738", "783"]);

    assert.equal(markets.twoReverse[0].base, "87");
    assert.deepEqual(markets.twoReverse[0].covers, ["87", "78"]);
  });
});
