# gitea-theme-github

A **GitHub (Primer) look-and-feel theme for Gitea 1.27.3**: light, dark and auto (follows the OS colour scheme).
Every color, size, radius, shadow, type and motion value comes from [Primer Primitives](https://primer.style/product/primitives/)
(`@primer/primitives` 11.10.0), icons are [Octicons](https://primer.style/octicons/) (19.38.0), controls follow the Primer
component specs. No GitHub logos or trademarks are included; the Gitea logo stays.

Design, cascade model, ownership and policies: **[ARCHITECTURE.md](ARCHITECTURE.md)**. Current scores, open issues, budgets:
**[docs/STATUS.json](docs/STATUS.json)**.

## Install (Gitea 1.27.3, files under CUSTOM_PATH only)

```sh
npm ci
npm run build            # → dist/theme-github-{auto,light,dark}.css (≤ 300 KB each)
```

1. Copy `dist/theme-github-*.css` to `$CUSTOM_PATH/public/assets/css/`.
2. Copy `templates/**` to `$CUSTOM_PATH/templates/` (github-only branches; other themes render upstream bytes).
   `templates/base/head_style.tmpl` is required: it puts Gitea's own CSS into a low cascade layer (ARCHITECTURE §3).
3. Copy `src/icons/svg/*.svg` to `$CUSTOM_PATH/public/assets/img/svg/` (Octicons 19.38 upgrade + replacements).
4. Add `github-auto,github-light,github-dark` to `[ui] THEMES` in app.ini (keep your other themes), restart Gitea once.
   Later CSS changes need no restart; templates hot-reload with `gitea manager reload-templates`.

`npm run deploy` does all of this for the local development instance described in `docs/CONTEXT.md` and verifies that
Gitea serves the new bytes.

Browser support: Chrome/Edge 112+, Safari 16.5+, Firefox 121+ (uses `@layer`, `:has()`, CSS nesting).

## Development

- `npm run lint` — no literal colors outside the token layer, type/radius/shadow from tokens, selector ownership.
- `tools/seed/` — idempotent seed data; `tools/shoot/` — Playwright screenshots, audits, github.com reference capture,
  pixel diff, CSS coverage, smoke test; `tools/judge/` — blind A/B pairs.

## License

MIT for this project's code. Includes/derives from Primer Primitives, Octicons and Primer CSS (MIT, © GitHub Inc.) — see [NOTICE](NOTICE).
Not affiliated with GitHub.
