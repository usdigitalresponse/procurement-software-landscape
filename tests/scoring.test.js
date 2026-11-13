// Tests for the scoring rules in assets/js/scoring.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const { lighthousePoints, scoreRecord, LIGHTHOUSE_NEEDS } = require("../assets/js/scoring.js");
const { criteria, data } = require("./helpers.js");

const field = key => criteria.find(c => c.key === key).field;

// A record that answers Yes to every metric, with perfect Lighthouse scores.
function perfect() {
  const r = {};
  for (const c of criteria) r[c.field] = c.key in LIGHTHOUSE_NEEDS ? 100 : "Yes";
  return r;
}

test("Lighthouse points follow the bands", () => {
  const cases = [[100, 5], [90, 5], [89, 4], [80, 4], [79, 3], [70, 3], [69, 2], [60, 2], [59, 1], [50, 1], [49, 0], [0, 0]];
  for (const [score, points] of cases) assert.equal(lighthousePoints(score), points, `score ${score}`);
});

test("a perfect record earns 100", () => {
  const points = scoreRecord(perfect(), criteria);
  assert.equal(points.Total, 100);
  for (const c of criteria) assert.equal(points[c.key], c.max, c.key);
});

test("only Yes earns points", () => {
  for (const answer of ["No", "N/A", "Print", "yes", "", undefined]) {
    const r = perfect();
    r[field("P5")] = answer;
    const points = scoreRecord(r, criteria);
    assert.equal(points.P5, 0, `answer ${JSON.stringify(answer)}`);
    assert.equal(points.Total, 95);
  }
});

test("Lighthouse metrics earn 0 without a direct URL to the page", () => {
  const r = perfect();
  r[field("N1")] = "No";
  let points = scoreRecord(r, criteria);
  assert.deepEqual([points.N1, points.N4, points.N5, points.P7, points.P8], [0, 0, 0, 5, 5]);
  assert.equal(points.Total, 80);

  r[field("P1")] = "No";
  points = scoreRecord(r, criteria);
  assert.deepEqual([points.P1, points.P7, points.P8], [0, 0, 0]);
  assert.equal(points.Total, 45);
});

test("a Lighthouse score that isn't a whole number earns 0", () => {
  for (const score of ["95", 95.5, null, undefined]) {
    const r = perfect();
    r[field("N4")] = score;
    assert.equal(scoreRecord(r, criteria).N4, 0, `score ${JSON.stringify(score)}`);
  }
});

test("Total is the sum of the points", () => {
  for (const r of data()) {
    const points = scoreRecord(r, criteria);
    const sum = criteria.reduce((a, c) => a + points[c.key], 0);
    assert.equal(points.Total, sum, r.Government);
    assert.ok(points.Total >= 0 && points.Total <= 100, r.Government);
  }
});

test("every Lighthouse metric depends on a metric that exists", () => {
  const keys = new Set(criteria.map(c => c.key));
  for (const [key, needs] of Object.entries(LIGHTHOUSE_NEEDS)) {
    assert.ok(keys.has(key), key);
    assert.ok(keys.has(needs), needs);
  }
});
