// Writes the landscape's data as data.json and data.csv, so it can be downloaded or
// linked to at fixed URLs. The GitHub Actions workflow in .github/workflows/pages.yml
// runs this after the Lighthouse scores and dates are written into the data file, so
// the files match the published site.
//
// Run from the repository folder with Node.js 22 or later:
//   node scripts/export-data.js [site URL]
// The site URL, such as https://usdigitalresponse.github.io/procurement-software-landscape/,
// is used for the links in data.json. The files are written to the repository folder,
// and aren't committed (see .gitignore).
//
// Both files use the data file's own field names, explained in the README, plus Rank.
// Benchmark sites, such as the United Kingdom, are included with "Benchmark" set to true
// and no rank, so they're easy to leave out.

const DEFAULT_SITE = "https://usdigitalresponse.github.io/procurement-software-landscape/";

// Competition ranking by total score, as on the site: ties share a rank, and benchmark
// sites aren't ranked.
function ranks(data) {
  const ranked = data.filter(r => r.Benchmark !== true).sort((a, b) => b.Total - a.Total);
  const rank = new Map();
  ranked.forEach((r, i) => rank.set(r, i && r.Total === ranked[i - 1].Total ? rank.get(ranked[i - 1]) : i + 1));
  return rank;
}

// The columns, in the data file's order, with Rank first and Benchmark after Abbreviation.
function columns(data) {
  const seen = [];
  for (const r of data) for (const k of Object.keys(r)) if (!seen.includes(k) && k !== "Benchmark") seen.push(k);
  seen.splice(seen.indexOf("Abbreviation") + 1, 0, "Benchmark");
  return ["Rank", ...seen];
}

function exportData(data, criteria, siteUrl = DEFAULT_SITE, now = new Date()) {
  const site = siteUrl.endsWith("/") ? siteUrl : siteUrl + "/";
  const rank = ranks(data);
  const cols = columns(data);
  const records = data.map(r => Object.fromEntries(cols.map(c =>
    [c, c === "Rank" ? rank.get(r) ?? null : c === "Benchmark" ? r.Benchmark === true : r[c] ?? null])));

  const json = {
    name: "Procurement Software Landscape",
    description: "Scores the public solicitation websites of U.S. states, territories, and DC out of 100 points.",
    site,
    methodology: `${site}Scoring-Metrics.html`,
    source: "https://github.com/usdigitalresponse/procurement-software-landscape",
    generated: now.toISOString(),
    metrics: criteria.map(c => ({ points: c.key, answer: c.field, max: c.max, definition: `${site}Scoring-Metrics.html#${c.anchor}` })),
    governments: records,
  };

  // RFC 4180: every value quoted, quotes doubled, CRLF line endings. Missing values and
  // false are left empty.
  const cell = v => `"${String(v === null || v === undefined || v === false ? "" : v).replace(/"/g, '""')}"`;
  const csv = [cols, ...records.map(r => cols.map(c => r[c]))].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";

  return { json: JSON.stringify(json, null, 2) + "\n", csv };
}

function main() {
  const fs = require("fs");
  const path = require("path");
  const yaml = require("../assets/js/js-yaml.min.js");
  const { readCriteria } = require("./check-data.js");
  const root = path.join(__dirname, "..");
  const read = f => fs.readFileSync(path.join(root, f), "utf8");

  const data = yaml.load(read("Procurement-Software-Landscape.yaml"));
  const { json, csv } = exportData(data, readCriteria(read("index.html")), process.argv[2] || DEFAULT_SITE);
  fs.writeFileSync(path.join(root, "data.json"), json);
  fs.writeFileSync(path.join(root, "data.csv"), csv);
  console.log(`Wrote data.json and data.csv with ${data.length} records.`);
}

if (typeof require !== "undefined" && require.main === module) main();
if (typeof module !== "undefined") module.exports = { exportData, ranks, columns };
