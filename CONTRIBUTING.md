# Contributing to the Procurement Software Landscape

Thank you for helping. This project is only as useful as its data is accurate, and most contributions are about keeping the data right: reporting a correction, rechecking a government's answers, or fixing a broken link. You don't need to write code to help.

Everyone who takes part is expected to follow [U.S. Digital Response's Code of Conduct](./CODE_OF_CONDUCT.md). To volunteer with other USDR projects, sign up at [usdigitalresponse.org/raisingyourhand](https://www.usdigitalresponse.org/raisingyourhand).

## Ways to help

- **[Report a correction](https://github.com/usdigitalresponse/procurement-software-landscape/issues/new?template=correction.yml)** when an answer, link, or system detail looks wrong. This is the most helpful thing you can do, and it doesn't need a GitHub pull request.
- **Recheck a government's answers.** The yes-or-no answers, worth 80 of the 100 points, are checked by hand and aren't rechecked on a schedule. Records whose `Answers checked` date says "Not recorded" or is old are good places to start. See [Checking a government's answers](#checking-a-governments-answers).
- **Fix a broken link.** Every Monday, the link check opens an issue labeled [broken links](https://github.com/usdigitalresponse/procurement-software-landscape/labels/broken%20links) for each government with links that stopped working. A broken link often means the government changed systems, so its answers may need a recheck too.
- **Improve the site or the scripts.** See [Changing the site or the scripts](#changing-the-site-or-the-scripts).

Before starting on something big, search the [open issues](https://github.com/usdigitalresponse/procurement-software-landscape/issues) to see whether someone is already on it, or open one to talk it over.

## Reporting a correction

Use the [correction form](https://github.com/usdigitalresponse/procurement-software-landscape/issues/new?template=correction.yml). You can also open it from a government's details on the landscape page, which fills in the government for you. The form asks for:

- the government, and what's wrong (a metric's answer, a link, or the system details);
- what the landscape shows now, and what it should be;
- evidence: a link to the page that shows it, and a screenshot if the page needs steps to reach or may change;
- the date you checked.

Please check against the definition of the metric in [Scoring-Metrics.md](./Scoring-Metrics.md). Many questions come down to a detail in a definition. For example, a print button or a PDF doesn't count as a data export, and a CAPTCHA doesn't lower a score.

Lighthouse scores are measured automatically each week, so please don't report a different score from your own Lighthouse run. Scores vary between runs and between computers. Do report a Lighthouse score if the page it was measured on is the wrong page.

## Checking a government's answers

Work through each yes-or-no metric in [Scoring-Metrics.md](./Scoring-Metrics.md) for the government's site:

1. **Use a private browser window, signed out.** The metrics are about what the public can see without registering, so don't use an account you're signed in to.
2. **Start from the notices list.** Check whether its URL leads straight to the list, whether it includes local governments' notices, and whether it offers a data export.
3. **Open a current posting.** Check whether its URL leads straight to it, and whether it shows a contact name and email, a plain-language project summary, a data export, and documents you can open without registering. If the record's `Sample posting URL` has closed, pick a current one and update the link.
4. **Check the system details:** `System name`, `System type`, and `Vendor`.
5. **Write down anything unusual in the `Note`,** such as a CAPTCHA, a planned move to a new system, or why a borderline answer went the way it did. Say when you checked, such as "(checked November 2026)".

Then update the record as described in [Updating a record](#updating-a-record), including the `Answers checked` date, even if no answers changed.

## Updating a record

The data is in [`Procurement-Software-Landscape.yaml`](./Procurement-Software-Landscape.yaml), one record per government. The [README](./README.md#updating-the-data) explains every field and the scoring rules. In short:

- Change only the answers. The points and totals are worked out from them, so there are no points fields to update.
- Set `Answers checked` to the date you checked, in quotes, like `'2026-11-12'`.
- Don't edit the Lighthouse scores or the `Lighthouse measured` dates by hand. They're replaced each time the site is built. The exception is a new record: give each Lighthouse score 0, and each `Lighthouse measured` date `""`.
- When you add a government, give it an `Abbreviation` and a position on the map in the `MAP_HEX` list in `index.html`.

To make the change, either edit the file on GitHub, which creates a fork and a pull request for you, or work on a branch on your own computer.

Before you open a pull request, run the data checks if you can. Install [Node.js](https://nodejs.org/) 22 or later and run this from the repository folder:

```bash
node scripts/check-data.js
```

The same checks run automatically on every pull request. If they find a problem, the pull request gets a red X, and the run's details list each problem.

## Changing the site or the scripts

The site is a single page, [`index.html`](./index.html), which reads the data file in the browser. The scoring metrics page is [`Scoring-Metrics.md`](./Scoring-Metrics.md), rendered by GitHub Pages with [`_layouts/default.html`](./_layouts/default.html). The scripts in [`scripts/`](./scripts) check the data, collect Lighthouse scores, and check links. The [README](./README.md) explains each of them.

- **Preview the site** with any static file server, such as `python -m http.server 8000`, and open http://localhost:8000/. The page can't load its data when opened as a file.
- **Keep the metric list in step.** If you rename a heading in `Scoring-Metrics.md`, update its `anchor` in the `CRITERIA` list in `index.html`. If you add, remove, or rename a metric, also update the list of metrics in the [correction form](./.github/ISSUE_TEMPLATE/correction.yml). The data checks catch all of these.
- **Test your change.** The tests in [`tests/`](./tests) cover the scoring rules and the scripts. Run them with `node --test` from the repository folder, and add or update a test for what you changed. Every pull request also runs the tests and tries the site build, so a change that would stop the site from being published shows up as a red X before it's merged.
- **Check accessibility.** The landscape scores other sites on accessibility, so it should do well itself. Test new controls with a keyboard, and run Lighthouse on your local preview.

## Pull request checklist

- The title sums up the change, such as "Update Ohio's notices list URL".
- If it fixes an issue, the description says so, such as "Fixes #12", so the issue closes when it's merged.
- For data changes, the description says what you checked and when, with links, and `Answers checked` is updated.
- The data checks pass, and for changes to the scripts or the scoring rules, so do the tests (`node --test`).
- If the work isn't finished, open it as a draft pull request.

Maintainers may ask for changes. That's a normal part of review, and it happens to everyone.
