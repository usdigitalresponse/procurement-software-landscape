// Checks that every link in Procurement-Software-Landscape.yaml still works, and
// reports the ones that don't. It never fails because of a broken link, so it can't
// stop the site from being published.
//
// Run from the repository folder with Node.js 22 or later:
//   node scripts/check-links.js
//
// In GitHub Actions it also adds a warning to the run for each broken link, writes a
// table to the run summary, and keeps one GitHub issue (labeled "broken links") up to
// date: it opens the issue when links break, comments on it when more break, and
// closes it once every link works again. That needs GITHUB_TOKEN, with permission to
// write issues, and GITHUB_REPOSITORY.
//
// Links that a site's bot protection blocks (such as a Cloudflare challenge) can't be
// checked automatically. They're listed in the run summary, but don't count as broken.

const fs = require("fs");
const path = require("path");
const yaml = require("../assets/js/js-yaml.min.js");

const DATA_FILE = path.join(__dirname, "..", "Procurement-Software-Landscape.yaml");
const URL_FIELDS = ["Public site URL", "Notices list URL", "Sample posting URL"];
const TIMEOUT_MS = 30000;
const RETRY_DELAY_MS = 10000;
const MAX_REDIRECTS = 20;
const PARALLEL = 8;
const LABEL = "broken links";
// Some sites refuse requests that don't look like they come from a browser.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};
const ERROR_NAMES = {
  ENOTFOUND: "domain name not found",
  EAI_AGAIN: "domain name lookup failed",
  ECONNREFUSED: "connection refused",
  ECONNRESET: "connection reset",
  UND_ERR_CONNECT_TIMEOUT: "connection timed out",
  CERT_HAS_EXPIRED: "security certificate has expired",
  ERR_TLS_CERT_ALTNAME_INVALID: "security certificate is for a different domain",
  DEPTH_ZERO_SELF_SIGNED_CERT: "security certificate is self-signed",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "security certificate can't be verified (browsers may still open the page)",
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const DATA_LINK = process.env.GITHUB_REPOSITORY
  ? `[the data file](https://github.com/${process.env.GITHUB_REPOSITORY}/blob/main/Procurement-Software-Landscape.yaml)`
  : "the data file";
const mdEscape = s => String(s).replace(/\|/g, "\\|");

// Every link in the data file, with where it appears: the three link fields, and any
// link written in a note.
function collectLinks() {
  const data = yaml.load(fs.readFileSync(DATA_FILE, "utf8"));
  const links = new Map();
  const add = (url, government, field) => {
    url = url.replace(/[.,;:)\]]+$/, "");
    if (!links.has(url)) links.set(url, []);
    links.get(url).push({ government, field });
  };
  for (const r of data) {
    for (const f of URL_FIELDS) {
      const v = String(r[f] ?? "").trim();
      if (/^https?:\/\//.test(v)) add(v, r.Government, f);
    }
    for (const m of String(r.Note ?? "").matchAll(/https?:\/\/[^\s<>"']+/g)) add(m[0], r.Government, "Note");
  }
  return links;
}

// A refusal from bot protection, rather than from the page itself.
function isBotBlock(res) {
  if (![403, 429, 503].includes(res.status)) return false;
  return res.headers.has("cf-mitigated") || /cloudflare|akamai|incapsula|sucuri/i.test(res.headers.get("server") || "");
}

// Loads a page, following redirects and keeping any cookies they set, as a browser
// does. Some sites redirect in a loop to a client that doesn't send cookies back.
// Returns null if the link works, or { problem, blocked }.
async function checkOnce(url) {
  const cookies = new Map();
  try {
    for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
      const cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
      const res = await fetch(url, {
        headers: cookie ? { ...HEADERS, Cookie: cookie } : HEADERS,
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await res.body?.cancel().catch(() => {});
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";");
        const i = pair.indexOf("=");
        if (i > 0) cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
      }
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        url = new URL(location, url).href;
        continue;
      }
      if (res.ok) return null;
      return { problem: `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`, blocked: isBotBlock(res) };
    }
    return { problem: `more than ${MAX_REDIRECTS} redirects` };
  } catch (e) {
    if (e.name === "TimeoutError") return { problem: `no response in ${TIMEOUT_MS / 1000} seconds` };
    const code = e.cause?.code;
    return { problem: ERROR_NAMES[code] || (code ? `${code}: ${e.cause.message}` : e.cause?.message || e.message) };
  }
}

// Check twice before calling a link broken, since sites have brief outages.
async function check(url) {
  if (!(await checkOnce(url))) return null;
  await sleep(RETRY_DELAY_MS);
  return await checkOnce(url);
}

async function checkAll(urls) {
  const problems = new Map();
  const queue = [...urls];
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const result = await check(url);
      if (result) problems.set(url, result);
    }
  }));
  return problems;
}

const table = list => [
  "| Government | Field | Link | Problem |",
  "|---|---|---|---|",
  ...list.map(b => `| ${mdEscape(b.government)} | ${b.field} | <${b.url}> | ${mdEscape(b.problem)} |`),
].join("\n");

// Each issue carries a hidden marker naming its government, so the check can find it
// again even if someone edits the title.
const marker = government => `<!-- broken-links: ${government} -->`;
const MARKER_RE = /<!-- broken-links: (.+?) -->/;

function issueBody(government, list) {
  return [
    marker(government),
    `${list.length === 1 ? "This link" : `These ${list.length} links`} for ${government} in ${DATA_LINK} didn't work when they were last checked, on ${new Date().toUTCString()}.`,
    "",
    table(list),
    "",
    `Some sites block automated checks, so a link listed here may still open in a browser. The links are checked every Monday. This issue is updated then, and closed once none of the links for ${government} are broken.`,
  ].join("\n");
}

async function github(method, endpoint, body) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub API ${method} ${endpoint}: HTTP ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Keep one open issue per government in step with its broken links. People watching
// the repository are notified when an issue is opened, when more of that government's
// links break, and when the issue is closed.
async function updateIssues(broken) {
  const open = [];
  for (let page = 1; ; page++) {
    const batch = await github("GET", `/issues?state=open&labels=${encodeURIComponent(LABEL)}&per_page=100&page=${page}`);
    open.push(...batch.filter(i => !i.pull_request));
    if (batch.length < 100) break;
  }
  const issues = new Map();
  for (const issue of open) {
    const m = (issue.body || "").match(MARKER_RE);
    if (m) issues.set(m[1], issue);
  }
  const byGovernment = new Map();
  for (const b of broken) {
    if (!byGovernment.has(b.government)) byGovernment.set(b.government, []);
    byGovernment.get(b.government).push(b);
  }

  for (const [government, issue] of issues) {
    if (byGovernment.has(government)) continue;
    await github("POST", `/issues/${issue.number}/comments`, { body: `None of the links for ${government} are broken now.` });
    await github("PATCH", `/issues/${issue.number}`, { state: "closed", state_reason: "completed" });
    console.log(`Closed issue #${issue.number} (${government}).`);
  }

  if ([...byGovernment.keys()].some(g => !issues.has(g))) {
    // Make sure the label exists. GitHub answers 422 if it already does.
    await github("POST", "/labels", { name: LABEL, color: "d93f0b", description: "Links in the data file that stopped working" })
      .catch(e => { if (!/HTTP 422/.test(e.message)) throw e; });
  }

  for (const [government, list] of byGovernment) {
    const body = issueBody(government, list);
    const issue = issues.get(government);
    if (!issue) {
      const created = await github("POST", "/issues", { title: `Broken links: ${government}`, body, labels: [LABEL] });
      console.log(`Opened issue #${created.number} (${government}).`);
      continue;
    }
    const added = list.filter(b => !(issue.body || "").includes(`<${b.url}>`));
    await github("PATCH", `/issues/${issue.number}`, { body });
    if (added.length) {
      const lines = added.map(b => `- ${b.field}: <${b.url}> (${b.problem})`).join("\n");
      await github("POST", `/issues/${issue.number}/comments`, {
        body: `${added.length === 1 ? "Another link has" : `${added.length} more links have`} stopped working:\n\n${lines}`,
      });
    }
    console.log(`Updated issue #${issue.number} (${government})${added.length ? `, noting ${added.length} newly broken links` : ""}.`);
  }
}

async function main() {
  const links = collectLinks();
  console.log(`Checking ${links.size} links...`);
  const problems = await checkAll(links.keys());

  const where = blocked => [...problems]
    .filter(([, r]) => !!r.blocked === blocked)
    .flatMap(([url, r]) => links.get(url).map(w => ({ url, problem: r.problem, ...w })))
    .sort((a, b) => a.government.localeCompare(b.government) || URL_FIELDS.indexOf(a.field) - URL_FIELDS.indexOf(b.field));
  const broken = where(false);
  const blocked = where(true);
  const line = b => `- ${b.government}, ${b.field}: ${b.url} (${b.problem})`;

  console.log(broken.length ? `Broken links:\n${broken.map(line).join("\n")}` : "No broken links.");
  if (blocked.length) console.log(`Blocked by bot protection, so not checked:\n${blocked.map(line).join("\n")}`);

  if (process.env.GITHUB_ACTIONS) {
    for (const b of broken) console.log(`::warning file=Procurement-Software-Landscape.yaml,title=Broken link::${b.government}, ${b.field}: ${b.url} (${b.problem})`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      let summary = `## Link check\n\n${broken.length ? `${new Set(broken.map(b => b.url)).size} of ${links.size} links didn't work:\n\n${table(broken)}` : `None of the ${links.size} links are broken.`}\n`;
      if (blocked.length) summary += `\n### Blocked by bot protection\n\nThese sites refused the automated check, so these links weren't checked.\n\n${table(blocked)}\n`;
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    }
  }
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) await updateIssues(broken);
}

main().catch(e => {
  // Report the problem without failing the run.
  console.log(`::warning title=Link check didn't finish::${e.message}`);
  console.error(e);
});
