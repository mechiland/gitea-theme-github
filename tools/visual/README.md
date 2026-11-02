# Visual regression tests

Every pull request, push to `main` and release tag runs this suite on **Gitea 1.27.3 and 28.2.0**.
The build/package/release job requires both visual jobs to pass.

The suite builds the approved commit in `baseline.json` and the candidate, installs their complete
packages into two disposable Gitea containers, and seeds both through the API. It uses no developer
database, migrations from GitHub, service credentials or pre-existing Gitea installation. Both servers
bind to random loopback ports and are removed after the test run; their logs remain in the report.

For each version, Playwright compares screenshots of the reference and candidate in the **same browser
and operating system**, using light/dark themes and 1440px/390px viewports. This avoids maintaining PNGs
specific to a developer's OS. The reference commit stays fixed until an intentional visual change is
reviewed; it is not automatically replaced by the PR base or by the candidate.

Coverage includes repository home, issue list, issue conversation, PR conversation, unified/split
diffs, comment menus, reaction pickers and the inline reply editor. Menu checks also hit-test every
item (including the last one), so clipping/stacking failures cannot pass merely because an element
exists in the DOM. Mobile split diffs check horizontal scroll restoration after the dropdown closes.

## Run locally

Requires Node 24 and Docker. The runner only creates and removes its own `theme-visual-*` containers.

```sh
npm ci
npx playwright install chromium
npm run test:visual                         # Gitea 28.2.0
VISUAL_GITEA_VERSION=1.27.3 npm run test:visual
npm run test:visual -- --project=light-390 --grep 'PR split menus'
```

`SHOOT_CHROMIUM` can select an installed Chromium executable locally. CI always installs the browser
matching the pinned `playwright` dependency. Screenshots normalize relative timestamps and disable
animations; Git commits have fixed authors/dates, external network requests are blocked in the browser,
and Gitea's footer timing display is disabled.

## Investigate a failure

Download the `visual-gitea-<version>` Actions artifact. It contains the HTML report, reference/actual
PNGs, pixel diffs on comparison failures, traces, JSON results and both Gitea logs. A failed or missing
comparison fails the job; CI never uses `--update-snapshots` to accept new output.

```sh
npx playwright show-report shots/visual/28.2.0/report
npx playwright show-trace <path-to-trace.zip>
```

The pixel threshold permits minor antialiasing differences (80 pixels at a per-pixel threshold of
0.15); it does not permit broad layout/color changes.

## Approve an intentional visual change

First inspect the failing report and actual/diff images for every affected version, theme and viewport.
After reviewing the intended result, set `baseline.json`'s `ref` to the full SHA of the commit containing
that theme change and update its description. Commit this explicit baseline change and rerun CI.
That commit must be available in the repository history fetched by Actions. Changing the fixture or
test suite itself applies identically to reference and candidate, so it normally needs no baseline change.
