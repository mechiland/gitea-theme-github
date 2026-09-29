# Change requests from foundation

## 1. [BLOCKER, integrator] Stop Vite's preload-helper from re-injecting Gitea's index.css unlayered (wave 1, round 2)

**What.** On pages that lazy-load chunks (repo home: RepoFileSearch, katex, mermaid …) Vite's
`preload-helper` appends `<link rel="stylesheet" href="/assets/css/index.<hash>.css">`, because it only skips a CSS
dependency when a `<link>` with the same href **and `rel="stylesheet"`** already exists. Our github branch of
`templates/base/head_style.tmpl` (and `tools/shoot/lib/preview.mjs`) only emits `rel="preload"` + `@import … layer(gitea)`,
so the helper adds an unlayered copy and all of Gitea's CSS then beats every `gh.*` layer (~0.3 s after load).

**Why / evidence** (`shots/foundation-r3/probe-{preview,fixed,builtin}.json`, `shots/foundation-probe.mjs`,
repo home `/octo-org/theme-playground`):

| | preview today (injected) | with the fix below | built-in gitea-auto |
|---|---|---|---|
| container x / w @1440 | 80 / 1280 | 112 / 1216 (github.com 112 / 1216) | 80 / 1280 |
| container x @390 | 8 | 16 (github.com 16) | 8 |
| nav → content gap | 14 | 24 (github.com 24) | 14 |
| body line-height | 20 | 21 | 20 |
| kbd font/lh/pad/radius | 11/11/2px 4px/4 | 11/10/4/6 (Primer kbd.scss) | 11/11/2px 4px/4 |
| focus ring dark | rgb(68,147,248) | rgb(31,111,235) (github.com) | – |
| CLS light @390 | 0.553 | 0.275 | 0.252 |
| CLS light @1440 | 0.039 | 0.0001 | 0 |

Pages without lazy chunks (commits, releases, settings, explore …) are identical in both columns, so the fix has no
side effect there. With the fix, the only `index.css` stylesheet link in the DOM is the inert one
(`media="not all"`), verified in the probe (`injected: ["not all"]`).

**Exact proposed diff** — `templates/base/head_style.tmpl` (github branch, line 6) — add an inert stylesheet link
next to the preload:

```diff
-{{range StringUtils.Split (StringUtils.ToString (AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css")) "\""}}{{if StringUtils.Contains . ".css"}}<link rel="preload" as="style" href="{{.}}">{{end}}{{end}}
+{{range StringUtils.Split (StringUtils.ToString (AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css")) "\""}}{{if StringUtils.Contains . ".css"}}<link rel="preload" as="style" href="{{.}}"><link rel="stylesheet" href="{{.}}" media="not all">{{end}}{{end}}
```

`tools/shoot/lib/preview.mjs` line 22 — same thing:

```diff
-      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
+      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><link rel="stylesheet" href="${m[1]}" media="not all"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
```

Verify afterwards on `/octo-org/theme-playground`:
`[...document.querySelectorAll('link[rel=stylesheet]')].filter(l => /\/assets\/css\/index\./.test(l.href)).map(l => l.media)`
→ `["not all"]` only.

(Exactly this HTML rewrite is what `shots/foundation-probe.mjs fixed` does; all numbers above come from it.)
