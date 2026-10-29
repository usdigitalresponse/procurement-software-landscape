// Checks Procurement-Software-Landscape.yaml against the scoring rules in the README.
// Run from the repository folder with: node scripts/check-data.js
// The metric list (fields, points fields, maximums and heading anchors) is read from
// the CRITERIA list in index.html, so the site and this check always agree.

const ANSWERS = ["Yes", "No", "N/A", "Print"];
const TEXT_FIELDS = ["Government", "System name", "System type", "Vendor"];
const URL_FIELDS = ["Public site URL", "Notices list URL", "Sample posting URL"];
// Lighthouse points depend on the page having a direct URL.
const LIGHTHOUSE_NEEDS = { N4: "N1", N5: "N1", P7: "P1", P8: "P1" };
// When a page has a direct URL, the record should include it. This is only a warning,
// because a link can be missing for a while, such as when a state changes systems.
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

// The heading IDs GitHub Pages gives Scoring-Metrics.md headings.
const slug = s => s.trim().toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");

function lighthousePoints(score) {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  if (score >= 50) return 1;
  return 0;
}

function check(data, criteria, metricsMd) {
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

  const known = new Set([...TEXT_FIELDS, ...URL_FIELDS, "Note", "Benchmark", "Total", ...criteria.flatMap(c => [c.field, c.key])]);
  const seen = new Set();

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

    for (const f of URL_FIELDS) {
      if (!(f in r)) err(`"${f}" is missing.`);
      else if (r[f] !== "N/A" && !/^https?:\/\/\S+$/.test(String(r[f]))) err(`"${f}" should be a link starting with http:// or https://, or N/A.`);
    }
    if (!("Note" in r)) err(`"Note" is missing. Use "" when there is no note.`);
    else if (typeof r.Note !== "string") err(`"Note" should be text.`);
    if ("Benchmark" in r && r.Benchmark !== true) err(`"Benchmark" should be true, or left out.`);

    let sum = 0;
    for (const c of criteria) {
      const answer = r[c.field];
      const points = r[c.key];
      if (!(c.field in r)) { err(`"${c.field}" is missing.`); }
      if (!(c.key in r)) { err(`${c.key} is missing.`); continue; }
      if (!Number.isInteger(points) || points < 0 || points > c.max) { err(`${c.key} is ${JSON.stringify(points)}; it should be a whole number from 0 to ${c.max}.`); continue; }
      sum += points;
      if (!(c.field in r)) continue;

      let expected;
      if (isLighthouse(c)) {
        if (!Number.isInteger(answer) || answer < 0 || answer > 100) { err(`"${c.field}" is ${JSON.stringify(answer)}; it should be a whole number from 0 to 100.`); continue; }
        const direct = criteria.find(d => d.key === LIGHTHOUSE_NEEDS[c.key]);
        expected = r[direct.field] === "Yes" ? lighthousePoints(answer) : 0;
        if (points !== expected) {
          err(r[direct.field] === "Yes"
            ? `${c.key} is ${points}, but a Lighthouse score of ${answer} earns ${expected}.`
            : `${c.key} is ${points}, but it should be 0 because "${direct.field}" isn't Yes.`);
        }
      } else {
        if (!ANSWERS.includes(answer)) { err(`"${c.field}" is ${JSON.stringify(answer)}; it should be one of ${ANSWERS.join(", ")}.`); continue; }
        expected = answer === "Yes" ? c.max : 0;
        if (points !== expected) err(`${c.key} is ${points}, but "${c.field}: ${answer}" earns ${expected}.`);
      }
    }

    for (const [key, f] of Object.entries(DIRECT_URL_LINKS)) {
      const c = criteria.find(d => d.key === key);
      if (r[c.field] === "Yes" && !/^https?:\/\//.test(String(r[f]))) warn(`"${c.field}" is Yes, but "${f}" has no link.`);
    }

    if (!Number.isInteger(r.Total)) err(`Total is ${JSON.stringify(r.Total)}; it should be a whole number.`);
    else if (r.Total !== sum) err(`Total is ${r.Total}, but the points fields add up to ${sum}.`);
  });

  return { errors, warnings };
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
    ({ errors, warnings } = check(data, readCriteria(read("index.html")), read("Scoring-Metrics.md")));
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
if (typeof module !== "undefined") module.exports = { check, readCriteria, lighthousePoints, slug };
