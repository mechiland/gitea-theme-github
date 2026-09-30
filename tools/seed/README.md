# tools/seed — local Gitea seed data

`seed.mjs` fills the local Gitea (http://localhost:3000, Gitea 1.27.3) with realistic,
GitHub-comparable content so the GitHub-lookalike theme can be screenshotted page by page
next to the same page on github.com.

```sh
node tools/seed/seed.mjs                    # full run (the first run takes ~10+ min because of the GitHub migrations)
node tools/seed/seed.mjs --skip-migrations  # everything except the three GitHub migrations
node tools/seed/seed.mjs --only=manifest    # only rebuild docs/seed-manifest.json from the live instance
node tools/seed/seed.mjs --only=tidy        # only remove visible seed markers left by older runs (no migrations, manifest untouched)
SEED_VERBOSE=1 node tools/seed/seed.mjs     # also print every item that already existed
```

Requirements: Node 24 (no npm dependencies; it uses the built-in `fetch`) and, only for the
migrations, a logged-in `gh` CLI (`gh auth token` is read at runtime).

Environment overrides: `GITEA_URL`, `GITEA_ADMIN_USER`, `GITEA_ADMIN_PASS`, `SEED_USER_PASSWORD`,
`SEED_ACTIONS_WAIT_MS` (how long to wait for Actions runs, default 8 min).

## Idempotency

Every step reads the current state first (GET) and only creates what is missing. Items are matched by
natural keys: user/org/repo name, label/milestone/issue title, PR head branch, commit message,
release tag, wiki page title, review author + state, comment author + body prefix, reaction user + type.
A second run prints `0 change(s)`. The manifest is rewritten on every run.

## Credentials

| Account | Password | Notes |
| --- | --- | --- |
| `admin` | (pre-existing, see docs/CONTEXT.md) | Only used for basic auth to create the `theme-seed` API token |
| `alice-dev` | `seed-pass-2026` | Local test account; owner of `octo-org`, team `core` |
| `bob-dev` | `seed-pass-2026` | Local test account; team `core` |
| `carol-ops` | `seed-pass-2026` | Local test account; teams `core`, `triage`; owner of `pixel-guild` |
| `dave-qa` | `seed-pass-2026` | Local test account; team `triage` (read only) |

`must_change_password` is false for all seeded users. These accounts exist only in the local dev
instance.

The admin API token (name `theme-seed`, scope `all`) is stored in `tools/seed/.token` (gitignored,
mode 0600). If that file is lost, the script deletes the `theme-seed` token (and only that one) and
creates a new one. The GitHub token from `gh auth token` is only held in memory and passed as
`auth_token` to `POST /repos/migrate` with `mirror: false`; it is never written to disk or logged
(error messages are scrubbed). Non-mirror migrations do not keep the credential in the repository.

## What gets seeded

| Kind | Items |
| --- | --- |
| Users | `alice-dev`, `bob-dev`, `carol-ops`, `dave-qa`: full name, short bio, location, website, generated avatar, follows |
| Orgs | `octo-org` (neutral description, website, location, generated avatar, teams `Owners`, `core` (write), `triage` (read)); `pixel-guild` (second org, no repos) |
| Migrated repos | `octo-org/grex` ← github.com/pemistahl/grex, `octo-org/prom_ex` ← github.com/akoutmos/prom_ex, `octo-org/folderify` ← github.com/lgarron/folderify (issues, PRs, labels, milestones, releases, wiki). Issue/PR numbers and commit SHAs match GitHub. Description and topics are exactly github.com's |
| Native repo | `octo-org/theme-playground`: GFM showcase README, sources in Go/TS/TSX/Python/Rust/SQL/Shell/CSS/YAML/JSON, nested `docs/` tree, an ~800 line generated file, PNG/SVG images, 6 commits by 4 authors |
| Issues | #1–#15 with labels (including exclusive scoped `priority/*`), 3 milestones (one with due date, one closed), assignees, comments by several users, reactions, pinned #1, closed #4/#9/#12/#15, cross references, task lists |
| PRs | #16 large diff (20 files: modified, added, deleted, renamed, binary, long lines; approve + request changes + comment reviews with line comments), #17 merged (closes #5), #18 closed unmerged, #19 draft (`WIP:`), #20 open with requested reviewer |
| Releases | `v0.9.0`, `v1.0.0` (notes + 3 assets), `v1.1.0-rc.1` (pre-release), `v1.2.0` (draft) |
| Wiki | Home, Getting-Started, Architecture, FAQ, _Sidebar |
| Projects | "Theme v1 board" (basic kanban, cards in 4 columns) and "Bug triage" — created through the web UI as `alice-dev` (there is no project API in 1.27) |
| Actions | `.gitea/workflows/ci.yml` (lint, 3-way matrix, multi-step build with log groups/annotations, one job that fails on purpose); push, pull_request and workflow_dispatch runs |
| Packages | generic `theme-demo` 1.0.0 and 1.1.0, npm `@octo-org/theme-tokens` 1.0.0 (linked to theme-playground) |
| Social | fork `bob-dev/theme-playground`, stars, watches, profile READMEs `alice-dev/.profile` and `octo-org/.profile` |

Seeded objects carry **no visible marker** (FG-015: blind judges used them to spot the clone). They are
recognised by `docs/seed-manifest.json` (the machine-readable inventory, with Gitea and github.com URLs,
see its `markers` block) and, where it is invisible, by the HTML comment `<!-- theme-seed -->` at the end
of every seeded issue, PR and release body. Older versions of the script added a `[seed] ` description
prefix, a ` (migrated from github.com/…)` suffix, `theme-seed` / `migrated-from-github` topics,
"(seeded test account)" bios and seed wording in the org README, playground README/LICENSE/package.json/
ci.yml and wiki; every run (and `--only=tidy` on its own) rewrites those in place, never deleting anything.
Leftovers that cannot be rewritten: the published npm package `@octo-org/theme-tokens@1.0.0` metadata
(immutable; not shown in the UI), existing "Smoke edit …" commits / "Smoke PR …" merges and their Actions
runs, and README line 3 ("A seeded repository …"), kept so the open PR #16 stays mergeable.

## Never touched

The pre-seed baseline (user `admin`'s profile/settings, org `ai`, repos `admin/jiri`, `ai/jiri`) and
any other data not created by this script. The only changes involving `admin`: the `theme-seed` API
token, admin being owner of the seeded orgs (it creates them), and comments/issues authored by admin
inside seeded repos.

## Known limitations

- **Actions runs stay queued.** The only runner, `gitea-runner-1`, is registered as a *user-level*
  runner of `admin` (`action_runner.owner_id = 1`), so it only picks up jobs for repositories owned by
  `admin`. Jobs in `octo-org/theme-playground` wait for a runner. To execute them, register a runner
  for `octo-org` (or the instance), e.g. with a token from
  `GET /api/v1/orgs/octo-org/actions/runners/registration-token`; the queued runs will then execute.
  The manifest records every run's status.
- GitHub's issue/PR pages require no login, but the github.com "equivalents" for settings pages
  require being signed in on GitHub; admin-only Gitea pages have no GitHub equivalent (`null`).
- Visiting a PR "files changed" URL with `?style=split|unified` while signed in stores that diff style
  as the signed-in user's preference (Gitea behaviour). Screenshot runs as `admin` therefore change
  admin's `diff_view_style`; capture as a seeded user or reset it afterwards if that matters.
- Other sessions have used `octo-org/theme-playground` for smoke tests (issues/PRs titled "Smoke …"
  by admin, appended lines in README.md). Those are not seed data; the script leaves them alone.
  `tools/shoot/smoke.mjs` now titles its commit and PR `Update <file>` on a `patch-<ts>` branch.
