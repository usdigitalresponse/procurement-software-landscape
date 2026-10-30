// Collects Google Lighthouse scores for every notices list and sample posting page,
// and writes them into Procurement-Software-Landscape.yaml for the published site.
// The GitHub Actions workflow in .github/workflows/pages.yml runs each step in turn.
//
// The scores live in a JSON file (kept in the GitHub Actions cache), keyed by URL:
//   { "pages": { "<url>": { performance, accessibility, measured, checked, error } } }
// "checked" is when the page was last scanned. "measured" is when the scores were
// last collected successfully. A page is scanned at most once per calendar week
// (Monday to Sunday, UTC), and a failed scan keeps the page's last good scores.
//
// Steps, run from the repository folder:
//   node scripts/lighthouse.js plan <scores.json>
//       List the pages due for a scan, split into groups to scan in parallel.
//   node scripts/lighthouse.js scan <results.json> <url>...
//       Scan each page (URLs can also come from the URLS environment variable,
//       as a JSON list) and write the results. Needs the lighthouse command and Chrome.
//   node scripts/lighthouse.js merge <scores.json> <results.json>...
//       Add scan results to the scores file.
//   node scripts/lighthouse.js apply <scores.json>
//       Replace the Lighthouse scores in the data file with the stored scores, and
//       recompute the Lighthouse points and totals. Pages without a stored score get 0.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const yaml = require("../assets/js/js-yaml.min.js");
const { lighthousePoints } = require("./check-data.js");

const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "Procurement-Software-Landscape.yaml");

// Each page's URL field, its two score fields, and their points fields. Points are 0
// unless the page has a direct URL.
const PAGES = [
  { url: "Notices list URL", direct: "Notices list has a direct URL",
    performance: ["Lighthouse performance, notices list", "N4"],
    accessibility: ["Lighthouse accessibility, notices list", "N5"] },
  { url: "Sample posting URL", direct: "Direct URL to an individual posting",
    performance: ["Lighthouse performance, posting page", "P7"],
    accessibility: ["Lighthouse accessibility, posting page", "P8"] },
];
const POINTS_FIELDS = ["G1", "G2", "N1", "N2", "N3", "N4", "N5", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];

const RUNS_PER_PAGE = 3;        // the median of these runs is kept
const RUN_TIMEOUT_MS = 180000;  // give up on a single run after 3 minutes
const URLS_PER_GROUP = 6;       // about 6 minutes of scanning per group
const MAX_GROUPS = 15;

const isUrl = v => /^https?:\/\/\S+$/.test(String(v || ""));
const readJson = (file, fallback) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback;
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
};
const loadScores = file => readJson(file, { pages: {} });

// Start of the current calendar week: Monday 00:00 UTC.
function weekStart(now = new Date()) {
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(day - ((now.getUTCDay() + 6) % 7) * 86400000);
}

function dataUrls() {
  const data = yaml.load(fs.readFileSync(DATA_FILE, "utf8"));
  return [...new Set(data.flatMap(r => PAGES.map(p => String(r[p.url] ?? "").trim()).filter(isUrl)))];
}

function plan(scoresFile) {
  const { pages } = loadScores(scoresFile);
  const since = weekStart();
  const due = dataUrls().filter(u => !pages[u] || new Date(pages[u].checked) < since);
  const groupCount = Math.min(MAX_GROUPS, Math.ceil(due.length / URLS_PER_GROUP));
  const groups = Array.from({ length: groupCount }, (_, i) => ({
    group: i + 1,
    urls: due.filter((_, j) => j % groupCount === i),
  }));

  console.log(`${due.length} of ${dataUrls().length} pages are due for a Lighthouse scan, in ${groupCount} groups.`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${due.length}\nmatrix=${JSON.stringify({ include: groups })}\n`);
  }
}

// Runs Lighthouse once. Returns { performance, accessibility } (0–100) or { error }.
function runOnce(url) {
  const bin = process.env.LIGHTHOUSE_BIN || "lighthouse";
  const res = spawnSync(bin, [
    url,
    "--preset=desktop",
    "--only-categories=performance,accessibility",
    "--output=json",
    "--output-path=stdout",
    "--quiet",
    "--max-wait-for-load=60000",
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
  ], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, timeout: RUN_TIMEOUT_MS, killSignal: "SIGKILL" });

  if (res.error) return { error: res.error.code === "ETIMEDOUT" ? "timed out" : res.error.message };
  let lhr;
  try { lhr = JSON.parse(res.stdout); } catch (e) {
    return { error: (res.stderr || "").trim().split("\n").pop() || `Lighthouse exited with code ${res.status}` };
  }
  if (lhr.runtimeError) return { error: `${lhr.runtimeError.code}: ${lhr.runtimeError.message}` };
  const score = c => lhr.categories?.[c]?.score;
  if (typeof score("performance") !== "number" || typeof score("accessibility") !== "number") {
    return { error: "Lighthouse did not return both scores" };
  }
  return { performance: Math.round(score("performance") * 100), accessibility: Math.round(score("accessibility") * 100) };
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function scan(resultsFile, urls) {
  if (!urls.length && process.env.URLS) urls = JSON.parse(process.env.URLS);
  const results = {};
  for (const url of urls) {
    const runs = [];
    let error;
    for (let i = 0; i < RUNS_PER_PAGE; i++) {
      const r = runOnce(url);
      if (r.error) error = r.error;
      else runs.push(r);
    }
    const checked = new Date().toISOString();
    if (runs.length) {
      results[url] = {
        performance: median(runs.map(r => r.performance)),
        accessibility: median(runs.map(r => r.accessibility)),
        runs: runs.length,
        checked,
      };
      console.log(`${url}: performance ${results[url].performance}, accessibility ${results[url].accessibility} (${runs.length} of ${RUNS_PER_PAGE} runs)`);
    } else {
      results[url] = { error, checked };
      console.log(`${url}: could not be scanned. ${error}`);
      if (process.env.GITHUB_ACTIONS) console.log(`::warning::Lighthouse could not scan ${url}: ${error}`);
    }
    writeJson(resultsFile, results); // save as we go, in case the job is stopped
  }
}

function merge(scoresFile, resultsFiles) {
  const scores = loadScores(scoresFile);
  let ok = 0, failed = 0;
  for (const file of resultsFiles) {
    for (const [url, r] of Object.entries(readJson(file, {}))) {
      const prev = scores.pages[url] || {};
      if (r.error) {
        // Keep the last good scores, but record the failed attempt.
        scores.pages[url] = { ...prev, checked: r.checked, error: r.error };
        failed++;
      } else {
        scores.pages[url] = { performance: r.performance, accessibility: r.accessibility, measured: r.checked, checked: r.checked, error: null };
        ok++;
      }
    }
  }
  writeJson(scoresFile, scores);
  console.log(`Merged ${ok} new scores and ${failed} failed scans into ${scoresFile}.`);
}

// Rewrites only the score and points lines of each record, so the rest of the file,
// including its formatting, stays as it is.
function apply(scoresFile) {
  const { pages } = loadScores(scoresFile);
  const text = fs.readFileSync(DATA_FILE, "utf8");
  const data = yaml.load(text);

  const updates = data.map(r => {
    const u = {};
    for (const p of PAGES) {
      const stored = pages[String(r[p.url] ?? "").trim()] || {};
      for (const kind of ["performance", "accessibility"]) {
        const [field, key] = p[kind];
        const score = Number.isInteger(stored[kind]) ? stored[kind] : 0;
        u[field] = score;
        u[key] = r[p.direct] === "Yes" ? lighthousePoints(score) : 0;
      }
    }
    u.Total = POINTS_FIELDS.reduce((sum, k) => sum + (k in u ? u[k] : r[k]), 0);
    return u;
  });

  // Records start with a line that is just "-"; fields are indented beneath it.
  let record = -1;
  const lines = text.split("\n").map(line => {
    if (/^-\s*$/.test(line)) { record++; return line; }
    const m = line.match(/^(\s+)('([^']*)'|[^:'\s][^:]*):(\s*)(.*)$/);
    if (!m || record < 0) return line;
    const field = m[3] ?? m[2];
    if (!(field in updates[record])) return line;
    return `${m[1]}${m[2]}:${m[4] || " "}${updates[record][field]}`;
  });
  const out = lines.join("\n");

  // Make sure every update landed and nothing else changed.
  const check = yaml.load(out);
  check.forEach((r, i) => {
    for (const [f, v] of Object.entries(updates[i])) {
      if (r[f] !== v) throw new Error(`${r.Government}: could not set "${f}" to ${v}.`);
    }
    for (const f of Object.keys(data[i])) {
      if (!(f in updates[i]) && JSON.stringify(r[f]) !== JSON.stringify(data[i][f])) throw new Error(`${r.Government}: "${f}" changed unexpectedly.`);
    }
  });

  fs.writeFileSync(DATA_FILE, out);
  const scored = new Set(Object.entries(pages).filter(([, p]) => Number.isInteger(p.performance)).map(([u]) => u));
  const missing = dataUrls().filter(u => !scored.has(u));
  console.log(`Wrote Lighthouse scores for ${data.length} records.`);
  if (missing.length) console.log(`${missing.length} pages have no Lighthouse score yet and were given 0:\n${missing.map(u => `- ${u}`).join("\n")}`);
}

const [cmd, file, ...rest] = process.argv.slice(2);
const steps = { plan, scan, merge, apply };
if (!steps[cmd] || !file) {
  console.error("Usage: node scripts/lighthouse.js plan|scan|merge|apply <file> [...]");
  process.exit(2);
}
steps[cmd](file, rest);
