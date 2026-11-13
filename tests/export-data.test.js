// Tests for scripts/export-data.js: data.json and data.csv.
const test = require("node:test");
const assert = require("node:assert/strict");
const { exportData, ranks } = require("../scripts/export-data.js");
const { scoreRecord } = require("../assets/js/scoring.js");
const { criteria, data } = require("./helpers.js");

const NOW = new Date("2026-11-13T12:00:00Z");
const SITE = "https://example.org/landscape";

// Splits RFC 4180 CSV, where every value is quoted, into rows of values.
function parseCsv(text) {
  return text.trimEnd().split("\r\n").map(line => [...line.matchAll(/"((?:[^"]|"")*)"/g)].map(m => m[1].replace(/""/g, '"')));
}

test("ranks share ties and leave out benchmarks", () => {
  const rows = [{ Total: 50 }, { Total: 80 }, { Total: 80 }, { Total: 30 }, { Total: 99, Benchmark: true }];
  const rank = ranks(rows);
  assert.deepEqual(rows.map(r => rank.get(r)), [3, 1, 1, 4, undefined]);
});

test("data.json has every government, its points, and the metrics", () => {
  const source = data();
  const json = JSON.parse(exportData(source, criteria, SITE, NOW).json);
  assert.equal(json.site, SITE + "/");
  assert.equal(json.methodology, SITE + "/Scoring-Metrics.html");
  assert.equal(json.generated, NOW.toISOString());
  assert.equal(json.metrics.length, criteria.length);
  assert.equal(json.metrics[0].definition, `${SITE}/Scoring-Metrics.html#${criteria[0].anchor}`);
  assert.equal(json.governments.length, source.length);

  json.governments.forEach((g, i) => {
    const earned = scoreRecord(source[i], criteria);
    for (const k of [...criteria.map(c => c.key), "Total"]) assert.equal(g[k], earned[k], `${g.Government} ${k}`);
    assert.equal(g.Benchmark, source[i].Benchmark === true);
    if (g.Benchmark) assert.equal(g.Rank, null);
    else assert.ok(Number.isInteger(g.Rank) && g.Rank >= 1);
  });
  const keys = Object.keys(json.governments[0]);
  assert.deepEqual(keys.slice(0, 3), ["Rank", "Government", "Abbreviation"]);
  assert.equal(keys[3], "Benchmark");
  assert.deepEqual(keys.slice(-criteria.length - 1), [...criteria.map(c => c.key), "Total"]);
});

test("points written into the data file keep their place", () => {
  // As in the published copy, after the build writes the points in.
  const published = data().map(r => ({ ...r, ...scoreRecord(r, criteria) }));
  assert.equal(exportData(published, criteria, SITE, NOW).csv, exportData(data(), criteria, SITE, NOW).csv);
});

test("data.csv matches data.json", () => {
  const { json, csv } = exportData(data(), criteria, SITE, NOW);
  const governments = JSON.parse(json).governments;
  const [header, ...rows] = parseCsv(csv);
  assert.deepEqual(header, Object.keys(governments[0]));
  assert.equal(rows.length, governments.length);
  rows.forEach((row, i) => {
    header.forEach((col, j) => {
      const v = governments[i][col];
      assert.equal(row[j], v === null || v === false ? "" : String(v), `${governments[i].Government} ${col}`);
    });
  });
});

test("data.csv quotes every value and doubles quotes", () => {
  const records = data().slice(0, 2);
  records[0].Note = 'Says "closed", then reopens';
  const { csv } = exportData(records, criteria, SITE, NOW);
  assert.ok(csv.endsWith("\r\n"));
  assert.ok(csv.includes('"Says ""closed"", then reopens"'));
  assert.equal(parseCsv(csv)[1][parseCsv(csv)[0].indexOf("Note")], 'Says "closed", then reopens');
});
