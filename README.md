# Procurement Software Landscape

This project evaluates and scores the websites that state and territorial government procurement agencies use to publicly advertise contracting opportunities, like requests for proposals (RFPs) and invitations to bid (ITBs), to potential vendors and the public.

**View the inventory: https://usdigitalresponse.github.io/procurement-software-landscape/**

Each site is scored out of 100 points on whether its notices are easy to find, share, and use: direct links to the notice list and to individual postings, contact details, project summaries, data exports, access to documents without registration, and Google Lighthouse performance and accessibility. See [Scoring-Metrics.md](./Scoring-Metrics.md) for what each metric means, how it is scored, and why it matters.

## What's in this repository

| File | Purpose |
|---|---|
| [`Website-Inventory.yaml`](./Website-Inventory.yaml) | The data: one record per state or territory, with links, answers to each metric, and points. |
| [`Scoring-Metrics.md`](./Scoring-Metrics.md) | The scoring methodology, published as the site's Scoring metrics page. |
| [`index.html`](./index.html) | The inventory page. It reads `Website-Inventory.yaml` in the browser, so there is no build step. |
| `_layouts/default.html` | The page layout GitHub Pages uses for `Scoring-Metrics.md`. |
| `assets/js/js-yaml.min.js` | [js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 (MIT license), used to read the data file. |

The site is published with GitHub Pages from the `main` branch. Changes pushed to `main` appear on the site within a minute or two.

## Updating the data

Edit `Website-Inventory.yaml` directly. Each record has these kinds of fields:

- **Description:** `State` (the government's name, including DC, the territories, and benchmark sites such as the United Kingdom), `System Name`, `System Type`, and `Platform` (with its `Vendor`).
- **Note:** `Note` holds a free-text note, shown on the site in the entry's details. Use `""` when there is none.
- **Benchmark:** `Benchmark: true` marks a site scored for comparison only, such as the United Kingdom. Benchmark sites appear in their own section and are left out of the rankings, the summary figures, the filters, and the CSV download. Leave the field out for every other record.
- **Links:** `Public Link`, `Notice list URL`, and `Single Posting URL`. Use `N/A` when there is none.
- **Answers:** one field per metric, such as `Contact Name and Email: Yes`, or a Lighthouse score from 0 to 100. Use 0 for a Lighthouse score that could not be measured.
- **Points:** one field per metric, `G1` through `P8`, plus `Total`.

Each points field is named for its section and its order within that section: `G` for General, `N` for the notice list, and `P` for the individual posting.

| Field | Metric | Max |
|---|---|---|
| `G1` | State web design system in use | 5 |
| `G2` | Data standard is published | 5 |
| `N1` | Notice list has a direct URL | 10 |
| `N2` | Includes local listings | 5 |
| `N3` | Data export of notices list | 5 |
| `N4` | Lighthouse performance, notice list | 5 |
| `N5` | Lighthouse accessibility, notice list | 5 |
| `P1` | Direct URL to an individual posting | 25 |
| `P2` | Individual posting page | 5 |
| `P3` | Contact name and email | 5 |
| `P4` | Project summary | 5 |
| `P5` | Data export of posting | 5 |
| `P6` | Documents without registration | 5 |
| `P7` | Lighthouse performance, posting page | 5 |
| `P8` | Lighthouse accessibility, posting page | 5 |

When you change a record, keep these consistent:

- A "Yes" answer earns the metric's full points; anything else earns 0.
- Lighthouse points use these bands: 90 or more = 5, 80–89 = 4, 70–79 = 3, 60–69 = 2, 50–59 = 1, below 50 = 0.
- Lighthouse points for the notice list or posting page are 0 unless that page has a direct URL.
- `Total` must equal the sum of the 15 points fields.

If you rename a heading in `Scoring-Metrics.md`, update the matching `anchor` value in the `CRITERIA` list in `index.html`, because the inventory links each metric to its heading.

## Previewing locally

The inventory page loads the data with `fetch`, so it needs to be served over HTTP rather than opened as a file. From the repository folder, run any static file server, for example:

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

Copyright (C) 2022 U.S. Digital Response (USDR)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License. You may obtain a copy of the License at:

[`LICENSE`](./LICENSE) in this repository or http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
