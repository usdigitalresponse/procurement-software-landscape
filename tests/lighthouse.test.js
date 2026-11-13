// Tests for scripts/lighthouse.js: writing the stored scores and points into the data
// file, merging scan results, and the scan schedule.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { applyScores, merge, median, weekStart } = require("../scripts/lighthouse.js");
const { check } = require("../scripts/check-data.js");
const { scoreRecord } = require("../assets/js/scoring.js");
const { criteria, data, dataText, yaml, mapTiles, metricsMd } = require("./helpers.js");

const POINTS = [...criteria.map(c => c.key), "Total"];
const field = key => criteria.find(c => c.key === key).field;

test("with no stored scores, apply only adds each record's points", () => {
  const out = applyScores(dataText, {}, criteria);
  const records = yaml.load(out);
  const original = data();
  records.forEach((r, i) => {
    assert.deepEqual(Object.fromEntries(Object.entries(r).filter(([k]) => !POINTS.includes(k))), original[i], r.Government);
    const earned = scoreRecord(original[i], criteria);
    for (const k of POINTS) assert.equal(r[k], earned[k], `${r.Government} ${k}`);
    assert.deepEqual(Object.keys(r).slice(-POINTS.length), POINTS, `${r.Government}: points go last, in order`);
  });
  // Apart from the points lines it adds, and the Lighthouse score and date lines it
  // rewrites (an empty "" date comes back as ''), every line is unchanged and in order.
  const pointsLine = /^\s+(G[12]|N[1-5]|P[1-8]|Total):/;
  const lighthouseLine = /^\s+'Lighthouse /;
  const others = text => text.split("\n").filter(l => !lighthouseLine.test(l));
  assert.deepEqual(others(out).filter(l => !pointsLine.test(l)), others(dataText));
  assert.deepEqual(check(records, criteria, metricsMd, mapTiles).errors, []);
});

test("apply gives the same file when run twice", () => {
  const pages = { [data().find(r => /^https?:/.test(r["Notices list URL"]))["Notices list URL"]]: { performance: 42, accessibility: 97, measured: "2026-11-10T06:30:00Z" } };
  const once = applyScores(dataText, pages, criteria);
  assert.equal(applyScores(once, pages, criteria), once);
});

test("stored scores and dates replace the data file's, and the points follow", () => {
  const original = data();
  const r = original.find(r => r[field("N1")] === "Yes" && /^https?:/.test(r["Notices list URL"]));
  const s = original.find(r => r[field("P1")] === "No" && /^https?:/.test(r["Sample posting URL"]));
  const pages = {
    [r["Notices list URL"]]: { performance: 85, accessibility: 49, measured: "2026-11-10T06:30:00.000Z" },
    ...(s ? { [s["Sample posting URL"]]: { performance: 100, accessibility: 100, measured: "2026-11-10T06:30:00.000Z" } } : {}),
  };
  const records = yaml.load(applyScores(dataText, pages, criteria));

  const rOut = records.find(o => o.Government === r.Government);
  assert.equal(rOut[field("N4")], 85);
  assert.equal(rOut[field("N5")], 49);
  assert.equal(rOut.N4, 4);
  assert.equal(rOut.N5, 0);
  assert.equal(rOut["Lighthouse measured, notices list"], "2026-11-10", "the date stays text");
  assert.equal(rOut.Total, scoreRecord({ ...r, [field("N4")]: 85, [field("N5")]: 49 }, criteria).Total);

  if (s) {
    const sOut = records.find(o => o.Government === s.Government);
    assert.equal(sOut[field("P7")], 100, "the score is recorded");
    assert.equal(sOut.P7, 0, "but earns nothing without a direct URL");
  }
});

test("a page that has never been scanned keeps the data file's score and date", () => {
  const records = yaml.load(applyScores(dataText, { "https://example.gov/never-used": { performance: 1, accessibility: 1 } }, criteria));
  const original = data();
  records.forEach((r, i) => {
    for (const f of [field("N4"), field("N5"), field("P7"), field("P8"), "Lighthouse measured, notices list", "Lighthouse measured, posting page"]) {
      assert.equal(r[f], original[i][f], `${r.Government} ${f}`);
    }
  });
});

test("a failed scan with no earlier scores doesn't replace the data file's", () => {
  const r = data().find(r => /^https?:/.test(r["Notices list URL"]));
  const pages = { [r["Notices list URL"]]: { checked: "2026-11-10T06:30:00Z", error: "timed out" } };
  const out = yaml.load(applyScores(dataText, pages, criteria)).find(o => o.Government === r.Government);
  assert.equal(out[field("N4")], r[field("N4")]);
  assert.equal(out["Lighthouse measured, notices list"], r["Lighthouse measured, notices list"]);
});

test("merge keeps the last good scores when a scan fails", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lighthouse-test-"));
  try {
    const scoresFile = path.join(dir, "scores.json");
    const results = path.join(dir, "results.json");
    const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value));
    write(scoresFile, { pages: { "https://a.gov/": { performance: 70, accessibility: 80, measured: "2026-11-03T06:00:00Z", checked: "2026-11-03T06:00:00Z", error: null } } });
    write(results, {
      "https://a.gov/": { error: "timed out", checked: "2026-11-10T06:00:00Z" },
      "https://b.gov/": { performance: 91, accessibility: 88, runs: 3, finalUrl: "https://b.gov/login", checked: "2026-11-10T06:00:00Z" },
    });
    const log = console.log;
    console.log = () => {};
    try { merge(scoresFile, [results]); } finally { console.log = log; }
    const { pages } = JSON.parse(fs.readFileSync(scoresFile, "utf8"));
    assert.deepEqual(pages["https://a.gov/"], { performance: 70, accessibility: 80, measured: "2026-11-03T06:00:00Z", checked: "2026-11-10T06:00:00Z", error: "timed out" });
    assert.deepEqual(pages["https://b.gov/"], { performance: 91, accessibility: 88, finalUrl: "https://b.gov/login", measured: "2026-11-10T06:00:00Z", checked: "2026-11-10T06:00:00Z", error: null });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("median of the runs", () => {
  assert.equal(median([70, 90, 80]), 80);
  assert.equal(median([71, 80]), 76);
  assert.equal(median([5]), 5);
});

test("the scan week starts on Monday, UTC", () => {
  assert.equal(weekStart(new Date("2026-11-13T12:00:00Z")).toISOString(), "2026-11-09T00:00:00.000Z");  // a Friday
  assert.equal(weekStart(new Date("2026-11-09T00:00:00Z")).toISOString(), "2026-11-09T00:00:00.000Z");  // Monday
  assert.equal(weekStart(new Date("2026-11-15T23:59:59Z")).toISOString(), "2026-11-09T00:00:00.000Z");  // Sunday
});
