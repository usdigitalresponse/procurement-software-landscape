# Procurement Software Landscape

This project evaluates and scores the websites that state and territorial government procurement agencies use to publicly advertise contracting opportunities, like requests for proposals (RFPs) and invitations to bid (ITBs), to potential vendors and the public.

**View the landscape: https://usdigitalresponse.github.io/procurement-software-landscape/**

Each site is scored out of 100 points on whether its notices are easy to find, share, and use: direct links to the notices list and to individual postings, contact details, project summaries, data exports, access to documents without registration, and Google Lighthouse performance and accessibility. See [Scoring-Metrics.md](./Scoring-Metrics.md) for what each metric means, how it is scored, and why it matters.

## What's in this repository

| File | Purpose |
|---|---|
| [`Procurement-Software-Landscape.yaml`](./Procurement-Software-Landscape.yaml) | The data: one record per state or territory, with links, answers to each metric, and points. |
| [`Scoring-Metrics.md`](./Scoring-Metrics.md) | The scoring methodology, published as the site's Scoring metrics page. |
| [`index.html`](./index.html) | The landscape page. It reads `Procurement-Software-Landscape.yaml` in the browser, so there is no build step. |
| `_layouts/default.html` | The page layout GitHub Pages uses for `Scoring-Metrics.md`. |
| `scripts/check-data.js` | Checks the data file against the scoring rules. See [Automatic checks](#automatic-checks). |
| `scripts/lighthouse.js` | Collects Lighthouse scores for each site. See [Lighthouse scores](#lighthouse-scores). |
| `scripts/check-links.js` | Checks that every link in the data file works. See [Link check](#link-check). |
| `.github/workflows/pages.yml` | Builds and publishes the site, with fresh Lighthouse scores, and checks links weekly. |
| `assets/js/js-yaml.min.js` | [js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 (MIT license), used to read the data file. |

The site is built and published to GitHub Pages by a GitHub Actions workflow each time a change is pushed to `main`. Changes appear on the site within a few minutes, or longer when the build has Lighthouse scans to run.

## Updating the data

Edit `Procurement-Software-Landscape.yaml` directly. Each record has these kinds of fields:

- **Description:** `Government` (the name of the state, DC, territory, or benchmark site such as the United Kingdom), `System name`, `System type`, and `Vendor`. Separate more than one vendor with a semicolon.
- **Note:** `Note` holds a free-text note, shown on the site in the entry's details. Use `""` when there is none.
- **Benchmark:** `Benchmark: true` marks a site scored for comparison only, such as the United Kingdom. Benchmark sites appear in their own section and are left out of the rankings, the summary figures, the filters, and the CSV download. Leave the field out for every other record.
- **Links:** `Public site URL`, `Notices list URL`, and `Sample posting URL`. Use `N/A` when there is none.
- **Answers:** one field per metric, named for the metric, such as `Contact name and email: Yes`, or a Lighthouse score from 0 to 100. Lighthouse scores are collected automatically when the site is built; see [Lighthouse scores](#lighthouse-scores).
- **Points:** one field per metric, `G1` through `P8`, plus `Total`.

Each points field is named for its section and its order within that section: `G` for General, `N` for the notices list, and `P` for the individual posting. The table lists each points field with its matching answer field.

| Points field | Answer field | Max |
|---|---|---|
| `G1` | `State web design system in use` | 5 |
| `G2` | `Data standard is published` | 5 |
| `N1` | `Notices list has a direct URL` | 10 |
| `N2` | `Includes local listings` | 5 |
| `N3` | `Data export of notices list` | 5 |
| `N4` | `Lighthouse performance, notices list` | 5 |
| `N5` | `Lighthouse accessibility, notices list` | 5 |
| `P1` | `Direct URL to an individual posting` | 25 |
| `P2` | `Individual posting page` | 5 |
| `P3` | `Contact name and email` | 5 |
| `P4` | `Project summary` | 5 |
| `P5` | `Data export of posting` | 5 |
| `P6` | `Documents without registration` | 5 |
| `P7` | `Lighthouse performance, posting page` | 5 |
| `P8` | `Lighthouse accessibility, posting page` | 5 |

When you change a record, keep these consistent:

- A "Yes" answer earns the metric's full points; anything else earns 0.
- Lighthouse points use these bands: 90 or more = 5, 80–89 = 4, 70–79 = 3, 60–69 = 2, 50–59 = 1, below 50 = 0.
- Lighthouse points for the notices list or posting page are 0 unless that page has a direct URL.
- `Total` must equal the sum of the 15 points fields.

If you rename a heading in `Scoring-Metrics.md`, update the matching `anchor` value in the `CRITERIA` list in `index.html`, because the landscape page links each metric to its heading.

### Lighthouse scores

The four Lighthouse scores, and their points (`N4`, `N5`, `P7` and `P8`) and `Total`, are not taken from the data file. When the site is built, `scripts/lighthouse.js` runs [Google Lighthouse](https://developer.chrome.com/docs/lighthouse) on each `Notices list URL` and `Sample posting URL` and writes the new scores, points and totals into the published copy of the data file. The copy in this repository is not changed, so its Lighthouse scores, points and totals may not match the site. In a new record, enter 0 for each Lighthouse score and its points, and a `Total` to match, so that the record passes the [automatic checks](#automatic-checks).

- Each page is scanned three times with Lighthouse's desktop settings, and the median score is kept.
- Each page is scanned at most once per calendar week (Monday to Sunday, UTC). Builds in between reuse the stored scores. A page whose URL changes is scanned at the next build.
- The workflow also runs on a schedule: on Mondays to rescan every page, and on Thursdays to rebuild the site, which keeps the stored scores from expiring.
- If a page can't be scanned, it keeps its last good score, and the run's summary lists it with the reason. A page that has never been scanned gets 0, shown on the site as "Not tested".
- Pages are split into groups that are scanned at the same time, so a full rescan takes about 10 minutes.

The scores are stored in the GitHub Actions cache, not in the repository. GitHub deletes a cache that goes unused for 7 days, which the twice-weekly schedule prevents. If the cache is lost, such as when GitHub turns off the schedule after 60 days with no activity in the repository, the next build rescans every page from scratch. To rescan or rebuild without pushing a change, run the "Build and publish site" workflow from the repository's Actions tab.

To scan pages yourself, install Node.js 22 or later and Lighthouse (`npm install --global lighthouse`), and run, for example:

```bash
node scripts/lighthouse.js scan results.json https://example.gov/bids
```

### Link check

Every Monday, the "Build and publish site" workflow also checks every link in the data file: the three link fields in each record, and any link in a note. Running the workflow by hand from the Actions tab also runs the check. A broken link never stops the site from being published. Instead:

- the workflow opens a GitHub issue for each state (or other government) with broken links, titled "Broken links: " and the state's name and labeled "broken links", and GitHub notifies people watching the repository;
- each week after that, it updates each issue's list, and adds a comment when more of that state's links break;
- it closes a state's issue once none of its links are broken.

Each issue holds a hidden marker with the state's name, which is how the check finds it again, so its title can be edited, and it can be assigned like any other issue. Leave the marker in place.

A link counts as broken if it still fails when checked a second time. Some sites, such as those behind a Cloudflare challenge, refuse automated checks. Those links are listed in the run's summary as not checked, and don't count as broken.

To check the links yourself, install Node.js 22 or later and run `node scripts/check-links.js` from the repository folder.

### Automatic checks

Whenever a change to the data file, `index.html`, or `Scoring-Metrics.md` is pushed to `main` or opened as a pull request, GitHub runs `scripts/check-data.js`. It runs again on the published copy of the data file each time the site is built, after the Lighthouse scores are added, and a failed check stops the site from being published. It checks that:

- every record has all of the fields above, with no misspelled or extra fields, and no government appears twice;
- each link is a full `http://` or `https://` address, or `N/A`;
- each answer is `Yes`, `No`, `N/A`, or `Print`, and each Lighthouse score is a whole number from 0 to 100;
- each points field matches its answer, using the rules above, and `Total` equals their sum;
- each `anchor` in `index.html` matches a heading in `Scoring-Metrics.md`.

If a check fails, GitHub marks the commit or pull request with a red X, and the run's details list each problem. It also warns, without failing, when a direct URL answer is `Yes` but the record has no link for that page.

To run the checks yourself, install [Node.js](https://nodejs.org/) and run this from the repository folder:

```bash
node scripts/check-data.js
```

## Previewing locally

The landscape page loads the data with `fetch`, so it needs to be served over HTTP rather than opened as a file. From the repository folder, run any static file server, for example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/. The Scoring metrics page is rendered by GitHub Pages (Jekyll), so locally you can read `Scoring-Metrics.md` directly instead.

## Reporting a correction

If a score or link looks wrong, [open an issue](https://github.com/usdigitalresponse/procurement-software-landscape/issues/new) with the state, the metric, and what you found.

## Code of Conduct

This repository falls under [U.S. Digital Response’s Code of Conduct](./CODE_OF_CONDUCT.md), and we will hold all participants in issues, pull requests, discussions, and other spaces related to this project to that Code of Conduct. Please see [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for the full code.

## Contributing

Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md) to find out how you can help.

**Lead Maintainer:** [@gideonkdavis](https://github.com/gideonkdavis)

## License & Copyright

Copyright (C) 2022–2026 U.S. Digital Response (USDR)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License. You may obtain a copy of the License at:

[`LICENSE`](./LICENSE) in this repository or http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
