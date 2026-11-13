// Shared by the tests: the repository's own files, read once.
const fs = require("fs");
const path = require("path");
const yaml = require("../assets/js/js-yaml.min.js");
const { readCriteria, readMapTiles } = require("../scripts/check-data.js");

const ROOT = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

const indexHtml = read("index.html");
const dataText = read("Procurement-Software-Landscape.yaml");

module.exports = {
  ROOT,
  read,
  yaml,
  dataText,
  data: () => yaml.load(dataText),  // a fresh copy each time, so tests can change it
  criteria: readCriteria(indexHtml),
  mapTiles: readMapTiles(indexHtml),
  metricsMd: read("Scoring-Metrics.md"),
  form: yaml.load(read(".github/ISSUE_TEMPLATE/correction.yml")),
};
