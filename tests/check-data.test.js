// Tests for scripts/check-data.js.
const test = require("node:test");
const assert = require("node:assert/strict");
const { check, readCriteria, slug, dateProblem, checkForm } = require("../scripts/check-data.js");
const { scoreRecord } = require("../assets/js/scoring.js");
const { criteria, data, mapTiles, metricsMd, form } = require("./helpers.js");

const run = records => check(records, criteria, metricsMd, mapTiles);
const field = key => criteria.find(c => c.key === key).field;
// The first record that isn't a benchmark, and the errors check() finds after changing it.
function errorsAfter(change) {
  const records = data();
  change(records.find(r => r.Benchmark !== true), records);
  return run(records).errors;
}

test("the data file passes every check", () => {
  assert.deepEqual(run(data()).errors, []);
});

test("the metric list has 15 metrics worth 100 points", () => {
  assert.equal(criteria.length, 15);
  assert.equal(criteria.reduce((a, c) => a + c.max, 0), 100);
});

test("readCriteria fails when the list is missing", () => {
  assert.throws(() => readCriteria("<script></script>"), /CRITERIA/);
});

test("points fields are optional, but must match the answers", () => {
  // As in the published copy: every record with its points written in.
  const published = data().map(r => ({ ...r, ...scoreRecord(r, criteria) }));
  assert.deepEqual(run(published).errors, []);

  const r = published.find(r => r.Benchmark !== true);
  r.Total += 1;
  r.G1 = r.G1 ? 0 : 5;
  const errors = run(published).errors;
  assert.equal(errors.length, 2);
  assert.match(errors[0], /G1 is \d+, but the answers earn \d+/);
  assert.match(errors[1], /Total is \d+, but the answers earn \d+/);
});

test("answers must be one of the allowed values", () => {
  const errors = errorsAfter(r => { r[field("P3")] = "Maybe"; });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /"Contact name and email" is "Maybe"/);
});

test("Lighthouse scores must be whole numbers from 0 to 100", () => {
  for (const score of [101, -1, 95.5, "95"]) {
    const errors = errorsAfter(r => { r[field("N4")] = score; });
    assert.equal(errors.length, 1, `score ${JSON.stringify(score)}`);
  }
});

test("a missing or unknown field is an error", () => {
  assert.match(errorsAfter(r => { delete r[field("P6")]; }).join(), /"Documents without registration" is missing/);
  assert.match(errorsAfter(r => { r.Colour = "blue"; }).join(), /unknown field "Colour"/);
  assert.match(errorsAfter(r => { delete r.Note; }).join(), /"Note" is missing/);
});

test("links must be full addresses or N/A", () => {
  assert.match(errorsAfter(r => { r["Notices list URL"] = "example.gov/bids"; }).join(), /should be a link/);
  assert.deepEqual(errorsAfter(r => { r["Notices list URL"] = "N/A"; }), []);
});

test("governments and abbreviations can't repeat", () => {
  assert.match(errorsAfter((r, all) => { all.push({ ...r }); }).join(), /appears more than once/);
  assert.match(errorsAfter((r, all) => { r.Abbreviation = all.find(o => o !== r && o.Benchmark !== true).Abbreviation; }).join(), /is also used by/);
  assert.match(errorsAfter(r => { r.Abbreviation = "al"; }).join(), /two capital letters/);
});

test("every government except a benchmark needs a map position", () => {
  assert.match(errorsAfter(r => { r.Abbreviation = "ZZ"; }).join(), /no position on the map/);
  const records = data();
  const benchmark = records.find(r => r.Benchmark === true);
  assert.ok(benchmark, "the data file has a benchmark");
  assert.ok(!mapTiles.has(benchmark.Abbreviation));
});

test("Benchmark must be true or left out", () => {
  assert.match(errorsAfter(r => { r.Benchmark = false; }).join(), /"Benchmark" should be true/);
});

test("a direct URL answer without a link is a warning, not an error", () => {
  const records = data();
  const r = records.find(r => r[field("P1")] === "Yes");
  r["Sample posting URL"] = "N/A";
  const { errors, warnings } = run(records);
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /"Sample posting URL" has no link/);
});

test("each anchor must match a heading on the scoring metrics page", () => {
  const errors = check(data(), criteria, metricsMd.replace("## Project summary (5 pts)", "## Summary (5 pts)"), mapTiles).errors;
  assert.equal(errors.length, 1);
  assert.match(errors[0], /P4 anchor/);
});

test("headings become the anchors GitHub Pages gives them", () => {
  assert.equal(slug("Direct URL to an individual posting (25 pts)"), "direct-url-to-an-individual-posting-25-pts");
  assert.equal(slug("  Web design system in use (5 pts) "), "web-design-system-in-use-5-pts");
});

test("dates must be quoted, real, and not in the future", () => {
  const today = new Date("2026-11-13T12:00:00Z");
  assert.equal(dateProblem("2026-11-12", true, today), null);
  assert.equal(dateProblem("", true, today), null);
  assert.equal(dateProblem("2026-11-14", true, today), null, "a day's leeway for time zones");
  assert.match(dateProblem("2026-11-20", true, today), /in the future/);
  assert.match(dateProblem("2026-02-30", true, today), /isn't a real date/);
  assert.match(dateProblem("11/12/2026", true, today), /should be a date like/);
  assert.match(dateProblem(new Date("2026-11-12"), true, today), /should be in quotes, like '2026-11-12'/);
  assert.match(dateProblem(undefined, false, today), /is missing/);
});

test("the correction form lists every metric", () => {
  assert.deepEqual(checkForm(form, criteria), []);
  const trimmed = structuredClone(form);
  const problem = trimmed.body.find(f => f.id === "problem");
  problem.attributes.options = problem.attributes.options.filter(o => o !== field("P6"));
  const errors = checkForm(trimmed, criteria);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /no option for the P6 metric/);
  assert.match(checkForm({}, criteria)[0], /could not find/);
});
