# Environment facts (verified 2026-09-29)

- Gitea **1.27.3**, Docker container `gitea-server` (image `docker.gitea.com/gitea:1.27.3`), compose file `/Users/michael/work/gitea/docker-compose.yml`.
- URL: http://localhost:3000 — admin login `admin` / `11111111` (basic auth works on the API).
- Actions runner container `gitea-runner-1` (image gitea/runner:latest) is registered against this instance.
- Container `/data` = host `/Users/michael/work/gitea/gitea`. `GITEA_CUSTOM=/data/gitea` → **CUSTOM_PATH on host = `/Users/michael/work/gitea/gitea/gitea`**.
- app.ini: `/Users/michael/work/gitea/gitea/gitea/conf/app.ini` (sqlite3 DB `gitea.db` in the same custom dir). `[ui] THEMES =` (empty → every `theme-*.css` found is offered), `DEFAULT_THEME = gitea-auto`.
- Gitea source at the exact tag: `/Users/michael/work/gitea/gitea-src-1.27.3` (read-only reference; never modify, never build into the running server).
- Project root: `/Users/michael/work/gitea/gitea-theme-github`.

## Things that already exist and must not be broken or edited
- Other custom themes in CUSTOM_PATH/public/assets/css: `theme-modern*.css` + `modern/`, `theme-studio*.css` + `studio/`. Owned by other sessions. Do not touch.
- Custom template overrides owned by the Modern theme: `templates/base/head_style.tmpl`, `templates/repo/view_content.tmpl`, `templates/repo/view_list.tmpl`. Do not edit (only the integrator may, and only additively).
- Pre-seed data (see docs/baseline-pre-seed.json): user `admin`, org `ai`, repos `admin/jiri`, `ai/jiri`. Never delete or alter them.
- The admin's own theme preference was `gitea-auto-tritanopia` before we started.

## Rules for every agent
- Only touch files you own (see ARCHITECTURE.md → Selector ownership / file ownership).
- Never restart Gitea yourself; ask the integrator. Never modify the Gitea source, binary or DB schema.
- Never claim something you have not screenshotted and looked at.
- Never inflate scores.
- `admin/eveland` was created at 23:36 on 2026-09-29 by another session (not ours, not seeded). Never touch it.
- Admin's theme was switched to `gitea-auto` by the screenshot tool setup (original: `gitea-auto-tritanopia`); to be restored at the end.

## Verified source facts (details: docs/research/gitea-1.27.3.md)
- New theme files appear only after a Gitea restart (prod caches the theme list). Editing an existing theme file needs no restart.
- Templates: `docker exec -u git gitea-server gitea manager reload-templates --config /data/gitea/conf/app.ini` hot-reloads them (verified); a broken template is refused, the old one stays.
- Server-rendered icons (`svg` helper) read CUSTOM_PATH/public/assets/img/svg first, at startup → restart needed; applies to all themes. Vue/JS icons are baked into the JS bundle (87 SVGs) → only CSS can restyle/mask them.
- JS decides dark/light from `--is-dark-theme` (Mermaid, `data-gitea-theme-dark`, captcha).
- Lazy-loaded chunk CSS (PullRequestMergeForm, RepoContributors, RepoCodeFrequency, RepoRecentCommits, RepoFileSearch, easymde, colorpicker, swagger) is unlayered → beats our layers; use `*.important.css`.
- Label colors are inline `style` with `!important` → cannot be overridden; exempt.
- Vue-only areas: dashboard repo list, branch/tag selector, file trees, diff commit selector, Actions run view, heatmap, PR merge form, go-to-file, issue hover card; charts are canvas (colors read from CSS vars at load); Mermaid renders in a same-origin iframe.
- Playwright: networkidle never fires on signed-in pages (event stream) — tools/shoot handles it.
