// Checks Procurement-Software-Landscape.yaml against the rules in the README.
// Run from the repository folder with: node scripts/check-data.js
// The metric list (fields, points fields, maximums and heading anchors) is read from
// the CRITERIA list in index.html, so the site and this check always agree.
//
// The data file holds only the answers. The points are worked out from them, by
// assets/js/scoring.js, when the site is built and when the page loads. The published
// copy of the data file has the points written in, so when a record has points fields,
// this checks that they match its answers.

const { LIGHTHOUSE_NEEDS, scoreRecord } = require("../assets/js/scoring.js");

const ANSWERS = ["Yes", "No", "N/A", "Print"];
const TEXT_FIELDS = ["Government", "Abbreviation", "System name", "System type", "Vendor"];
const URL_FIELDS = ["Public site URL", "Notices list URL", "Sample posting URL"];
// Dates, as 'YYYY-MM-DD' or "" when not recorded. "Answers checked" is entered by hand;
// the Lighthouse dates are written when the site is built.
const DATE_FIELDS = ["Answers checked", "Lighthouse measured, notices list", "Lighthouse measured, posting page"];
// When a page has a direct URL, the record should include it. This is only a warning,
// because a link can be missing for a while, such as when a government changes systems.
const DIRECT_URL_LINKS = { N1: "Notices list URL", P1: "Sample posting URL" };

function readCriteria(indexHtml) {
  const block = indexHtml.match(/const CRITERIA = \[([\s\S]*?)\];/);
  if (!block) throw new Error("Could not find the CRITERIA list in index.html.");
  const criteria = [...block[1].matchAll(/\{([^}]*)\}/g)].map(m => {
    const get = k => (m[1].match(new RegExp(`${k}:\\s*"([^"]*)"`)) || [])[1];
    return { key: get("key"), field: get("field"), anchor: get("anchor"), max: Number((m[1].match(/max:\s*(\d+)/) || [])[1]) };
  });
  if (criteria.some(c => !c.key || !c.field || !c.anchor || !c.max)) throw new Error("Could not read every CRITERIA entry in index.html.");
  return criteria;
}

// The abbreviations that have a position on the map, from the MAP_HEX list in index.html.
function readMapTiles(indexHtml) {
  const block = indexHtml.match(/const MAP_HEX = \{([\s\S]*?)\n\};/);
  if (!block) throw new Error("Could not find the MAP_HEX list in index.html.");
  return new Set([...block[1].matchAll(/\b([A-Z]{2}): \[/g)].map(m => m[1]));
}

// The heading IDs GitHub Pages gives Scoring-Metrics.md headings.
const slug = s => s.trim().toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");

// What's wrong with a date field's value, or null if nothing is. Dates must be quoted,
// because YAML reads an unquoted 2026-11-12 as a timestamp rather than text.
function dateProblem(value, present, today = new Date()) {
  if (!present) return `is missing. Use "" when there is no date.`;
  if (value instanceof Date) return `should be in quotes, like '${value.toISOString().slice(0, 10)}'.`;
  if (value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `is ${JSON.stringify(value)}; it should be a date like '2026-11-12', or "".`;
  const d = new Date(value + "T00:00:00Z");
  if (isNaN(d) || d.toISOString().slice(0, 10) !== value) return `is ${value}, which isn't a real date.`;
  // Allow a day's leeway, since the person entering it may be ahead of UTC.
  if (d - today > 86400000) return `is ${value}, which is in the future.`;
  return null;
}

// mapTiles is optional: when given, every government except a benchmark needs a map position.
function check(data, criteria, metricsMd, mapTiles) {
  const errors = [];
  const warnings = [];
  const isLighthouse = c => c.key in LIGHTHOUSE_NEEDS;

  const maxTotal = criteria.reduce((a, c) => a + c.max, 0);
  if (maxTotal !== 100) errors.push(`index.html: the CRITERIA maximums add up to ${maxTotal}, not 100.`);

  const anchors = new Set([...metricsMd.matchAll(/^#{1,6} +(.+?) *$/gm)].map(m => slug(m[1])));
  for (const c of criteria) {
    if (!anchors.has(c.anchor)) errors.push(`index.html: the ${c.key} anchor "${c.anchor}" doesn't match any heading in Scoring-Metrics.md.`);
  }

  if (!Array.isArray(data)) return { errors: errors.concat("The data file should be a list of records."), warnings };

  const known = new Set([...TEXT_FIELDS, ...URL_FIELDS, ...DATE_FIELDS, "Note", "Benchmark", "Total", ...criteria.flatMap(c => [c.field, c.key])]);
  const seen = new Set();
  const seenAbbr = new Map();

  data.forEach((r, i) => {
    if (!r || typeof r !== "object" || Array.isArray(r)) { errors.push(`Record ${i + 1}: should be a set of fields.`); return; }
    const name = typeof r.Government === "string" && r.Government.trim() ? r.Government.trim() : `Record ${i + 1}`;
    const err = msg => errors.push(`${name}: ${msg}`);
    const warn = msg => warnings.push(`${name}: ${msg}`);

    for (const f of Object.keys(r)) if (!known.has(f)) err(`unknown field "${f}".`);

    for (const f of TEXT_FIELDS) {
      if (typeof r[f] !== "string" || !r[f].trim()) err(`"${f}" should be filled in.`);
    }
    if (seen.has(name)) err("appears more than once.");
    seen.add(name);
    if (typeof r.Abbreviation === "string" && r.Abbreviation.trim()) {
      const abbr = r.Abbreviation.trim();
      if (!/^[A-Z]{2}$/.test(abbr)) err(`"Abbreviation" is "${abbr}"; it should be two capital letters, such as AL.`);
      else if (seenAbbr.has(abbr)) err(`"Abbreviation" ${abbr} is also used by ${seenAbbr.get(abbr)}.`);
      else seenAbbr.set(abbr, name);
      if (mapTiles && r.Benchmark !== true && /^[A-Z]{2}$/.test(abbr) && !mapTiles.has(abbr)) {
        err(`has no position on the map. Add ${abbr} to the MAP_HEX list in index.html.`);
      }
    }

    for (const f of URL_FIELDS) {
      if (!(f in r)) err(`"${f}" is missing.`);
      else if (r[f] !== "N/A" && !/^https?:\/\/\S+$/.test(String(r[f]))) err(`"${f}" should be a link starting with http:// or https://, or N/A.`);
    }
    if (!("Note" in r)) err(`"Note" is missing. Use "" when there is no note.`);
    else if (typeof r.Note !== "string") err(`"Note" should be text.`);
    for (const f of DATE_FIELDS) {
      const problem = dateProblem(r[f], f in r);
      if (problem) err(`"${f}" ${problem}`);
    }
    if ("Benchmark" in r && r.Benchmark !== true) err(`"Benchmark" should be true, or left out.`);

    let answersOk = true;
    for (const c of criteria) {
      const answer = r[c.field];
      if (!(c.field in r)) { err(`"${c.field}" is missing.`); answersOk = false; }
      else if (isLighthouse(c)) {
        if (!Number.isInteger(answer) || answer < 0 || answer > 100) { err(`"${c.field}" is ${JSON.stringify(answer)}; it should be a whole number from 0 to 100.`); answersOk = false; }
      } else if (!ANSWERS.includes(answer)) { err(`"${c.field}" is ${JSON.stringify(answer)}; it should be one of ${ANSWERS.join(", ")}.`); answersOk = false; }
    }

    // Points fields are left out of the data file in the repository, and written into
    // the published copy when the site is built. Where they're present, they must match.
    if (answersOk) {
      const earned = scoreRecord(r, criteria);
      for (const k of [...criteria.map(c => c.key), "Total"]) {
        if (k in r && r[k] !== earned[k]) err(`${k} is ${JSON.stringify(r[k])}, but the answers earn ${earned[k]}. Points are worked out from the answers, so leave ${k} out of the data file.`);
      }
    }

    for (const [key, f] of Object.entries(DIRECT_URL_LINKS)) {
      const c = criteria.find(d => d.key === key);
      if (r[c.field] === "Yes" && !/^https?:\/\//.test(String(r[f]))) warn(`"${c.field}" is Yes, but "${f}" has no link.`);
    }
  });

  return { errors, warnings };
}

// The correction form lists every metric, by its answer field name, as an option of its
// "problem" dropdown. Returns a problem for each metric that's missing from it.
const FORM_FILE = ".github/ISSUE_TEMPLATE/correction.yml";
function checkForm(form, criteria) {
  const problem = (form && Array.isArray(form.body) ? form.body : []).find(f => f && f.id === "problem");
  const options = problem && problem.attributes && Array.isArray(problem.attributes.options) ? problem.attributes.options : null;
  if (!options) return [`${FORM_FILE}: could not find the "problem" dropdown's options.`];
  return criteria.filter(c => !options.includes(c.field))
    .map(c => `${FORM_FILE}: the "problem" dropdown has no option for the ${c.key} metric. Add "${c.field}".`);
}

function main() {
  const fs = require("fs");
  const path = require("path");
  const yaml = require("../assets/js/js-yaml.min.js");
  const root = path.join(__dirname, "..");
  const read = f => fs.readFileSync(path.join(root, f), "utf8");

  let errors, warnings = [];
  try {
    const data = yaml.load(read("Procurement-Software-Landscape.yaml"));
    const indexHtml = read("index.html");
    const criteria = readCriteria(indexHtml);
    ({ errors, warnings } = check(data, criteria, read("Scoring-Metrics.md"), readMapTiles(indexHtml)));
    errors.push(...checkForm(yaml.load(read(FORM_FILE)), criteria));
  } catch (e) {
    errors = [e.message];
  }

  // In GitHub Actions, also show each problem and warning in the run summary.
  const annotate = (level, list) => {
    if (process.env.GITHUB_ACTIONS) for (const m of list) console.log(`::${level} file=Procurement-Software-Landscape.yaml::${m}`);
  };
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  if (warnings.length) {
    console.warn(`${plural(warnings.length, "warning")}:`);
    for (const w of warnings) console.warn(`- ${w}`);
    annotate("warning", warnings);
  }
  if (errors.length) {
    console.error(`Found ${plural(errors.length, "problem")}:`);
    for (const e of errors) console.error(`- ${e}`);
    annotate("error", errors);
    process.exit(1);
  }
  console.log("The data file passed every check.");
}

if (typeof require !== "undefined" && require.main === module) main();
if (typeof module !== "undefined") module.exports = { check, readCriteria, readMapTiles, slug, dateProblem, checkForm };
