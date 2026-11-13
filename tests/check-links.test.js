// Tests for scripts/check-links.js: spotting sign-in pages and building the issues.
// These don't make network requests.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { isSignInRedirect, addSignInFromScans, whereProblems, issueBody } = require("../scripts/check-links.js");

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
