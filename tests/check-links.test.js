// Tests for scripts/check-links.js: spotting sign-in pages and building the issues.
// These don't make network requests.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { isSignInRedirect, addSignInFromScans, excuseLoadedInScans, whereProblems, issueBody } = require("../scripts/check-links.js");

test("a link that ends up on a sign-in page is a sign-in redirect", () => {
  assert.equal(isSignInRedirect("https://a.gov/bids/123", "https://a.gov/login?next=/bids/123"), true);
  assert.equal(isSignInRedirect("https://a.gov/bids/123", "https://a.gov/Account/SignIn"), true);
  assert.equal(isSignInRedirect("https://a.gov/bids/123", "https://a.gov/user/log-on"), true);
});

test("other redirects aren't", () => {
  assert.equal(isSignInRedirect("https://a.gov/bids/123", "https://a.gov/bids/123"), false, "no redirect");
  assert.equal(isSignInRedirect("https://a.gov/bids", "https://a.gov/bids/open"), false, "not a sign-in page");
  assert.equal(isSignInRedirect("https://a.gov/login", "https://a.gov/login?x=1"), false, "the link was already a sign-in page");
  assert.equal(isSignInRedirect("not a url", "https://a.gov/login"), false);
});

// Links as collectLinks() returns them: each URL with the places it appears.
const links = new Map([
  ["https://a.gov/bids", [{ government: "Alpha", field: "Notices list URL" }]],
  ["https://a.gov/bids/1", [{ government: "Alpha", field: "Sample posting URL" }]],
  ["https://a.gov/", [{ government: "Alpha", field: "Public site URL" }]],
  ["https://b.gov/x", [{ government: "Beta", field: "Sample posting URL" }, { government: "Beta", field: "Note" }]],
]);

test("the last Lighthouse scan can show a sign-in page", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "links-test-"));
  try {
    const scoresFile = path.join(dir, "scores.json");
    fs.writeFileSync(scoresFile, JSON.stringify({ pages: {
      "https://a.gov/bids/1": { finalUrl: "https://a.gov/login", measured: "2026-11-10T06:30:00Z" },
      "https://a.gov/bids": { finalUrl: "https://a.gov/bids" },
      "https://a.gov/": { finalUrl: "https://a.gov/login" },  // not a field checked for this
    } }));
    const problems = new Map();
    assert.equal(addSignInFromScans(problems, links, scoresFile), 1);
    assert.deepEqual(problems.get("https://a.gov/bids/1"), { problem: "goes to a sign-in page (/login) in a browser, in the Lighthouse scan on 2026-11-10", signIn: true });
    assert.equal(addSignInFromScans(new Map(), links, path.join(dir, "missing.json")), 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Writes a scores file with the given pages to a new folder, runs fn with its path, and
// removes the folder.
function withScores(pages, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "links-test-"));
  try {
    const scoresFile = path.join(dir, "scores.json");
    fs.writeFileSync(scoresFile, JSON.stringify({ pages }));
    return fn(scoresFile);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("a link that loaded in Chrome in a recent scan doesn't count as broken", () => {
  const now = new Date("2026-11-16T07:00:00Z");
  const loaded = finalUrl => ({ performance: 80, accessibility: 90, finalUrl, measured: "2026-11-16T06:40:00Z", checked: "2026-11-16T06:40:00Z", error: null });
  const problems = new Map([
    ["https://a.gov/bids", { problem: "HTTP 403 Forbidden" }],
    ["https://a.gov/bids/1", { problem: "security certificate can't be verified (browsers may still open the page)" }],
    ["https://b.gov/x", { problem: "HTTP 404 Not Found" }],
    ["https://a.gov/", { problem: "HTTP 500 Internal Server Error" }],
  ]);
  const count = withScores({
    "https://a.gov/bids": loaded("https://a.gov/bids"),
    "https://a.gov/bids/1": loaded("https://a.gov/bids/1"),
    "https://b.gov/x": loaded("https://b.gov/login"),  // ended on a sign-in page
    "https://a.gov/": loaded("https://a.gov/"),         // not a page the scan is meant for
  }, file => excuseLoadedInScans(problems, links, file, now));

  assert.equal(count, 2);
  assert.deepEqual(problems.get("https://a.gov/bids"), { problem: "HTTP 403 Forbidden, but it loaded in Chrome in the Lighthouse scan on 2026-11-16", blocked: true });
  assert.equal(problems.get("https://a.gov/bids/1").blocked, true);
  assert.equal(problems.get("https://b.gov/x").blocked, undefined, "a scan that ended on a sign-in page doesn't help");
  assert.equal(problems.get("https://a.gov/").blocked, undefined, "the public site isn't scanned");
  // The links still broken: Alpha's public site, and Beta's link, in its note and as its sample posting.
  assert.deepEqual(whereProblems(problems, links, false).map(b => `${b.government} ${b.field}`), ["Alpha Public site URL", "Beta Note", "Beta Sample posting URL"]);
});

test("an old or failed scan doesn't excuse a broken link", () => {
  const now = new Date("2026-11-16T07:00:00Z");
  for (const page of [
    { finalUrl: "https://a.gov/bids", measured: "2026-11-02T06:40:00Z", error: null },                          // two weeks old
    { finalUrl: "https://a.gov/bids", measured: "2026-11-09T06:40:00Z", error: "timed out" },                   // the latest scan failed
    { measured: "2026-11-16T06:40:00Z", error: null },                                                         // no page recorded
  ]) {
    const problems = new Map([["https://a.gov/bids", { problem: "HTTP 403 Forbidden" }]]);
    assert.equal(withScores({ "https://a.gov/bids": page }, file => excuseLoadedInScans(problems, links, file, now)), 0, JSON.stringify(page));
    assert.equal(problems.get("https://a.gov/bids").blocked, undefined);
  }
  // A week-old scan, from last Monday's run, still counts.
  const problems = new Map([["https://a.gov/bids", { problem: "HTTP 403 Forbidden" }]]);
  withScores({ "https://a.gov/bids": { finalUrl: "https://a.gov/bids", measured: "2026-11-09T06:40:00Z", error: null } },
    file => excuseLoadedInScans(problems, links, file, now));
  assert.equal(problems.get("https://a.gov/bids").blocked, true);
  assert.equal(excuseLoadedInScans(new Map([["https://a.gov/bids", { problem: "x" }]]), links, undefined, now), 0, "no scores file");
});

test("a sign-in redirect only counts for the notices list and sample posting", () => {
  const problems = new Map([
    ["https://b.gov/x", { problem: "goes to a sign-in page (/login)", signIn: true }],
    ["https://a.gov/", { problem: "HTTP 404 Not Found" }],
    ["https://a.gov/bids", { problem: "HTTP 403 Forbidden", blocked: true }],
  ]);
  const broken = whereProblems(problems, links, false);
  assert.deepEqual(broken.map(b => `${b.government} ${b.field}`), ["Alpha Public site URL", "Beta Sample posting URL"]);
  const blocked = whereProblems(problems, links, true);
  assert.deepEqual(blocked.map(b => `${b.government} ${b.field}`), ["Alpha Notices list URL"]);
});

test("each issue carries its government's marker and suggests a fix for sign-in pages", () => {
  const list = [{ url: "https://a.gov/bids/1", government: "Alpha", field: "Sample posting URL", problem: "goes to a sign-in page (/login)", signIn: true }];
  const body = issueBody("Alpha", list);
  assert.ok(body.startsWith("<!-- broken-links: Alpha -->"));
  assert.match(body, /This link for Alpha/);
  assert.match(body, /<https:\/\/a\.gov\/bids\/1>/);
  assert.match(body, /Replace it with a current one/);
  assert.doesNotMatch(issueBody("Alpha", [{ ...list[0], problem: "HTTP 404", signIn: false }]), /Replace it/);
});
