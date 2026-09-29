// Theme preview for a GitHub theme that is deployed but not yet registered (Gitea caches the theme list until
// restart). Rewrites every Gitea HTML document exactly like the github-* branch of templates/base/head_style.tmpl:
// Gitea's index CSS goes into @layer gitea, the theme file is linked after it, html[data-theme] is set.
// The admin's real theme stays on a registered base theme (gitea-auto) meanwhile.
import { GITEA_URL } from './gitea.mjs';

export const PREVIEW_BASE_THEME = 'gitea-auto';

export async function installThemePreview(ctx, themeName) {
  const origin = new URL(GITEA_URL).origin;
  const stamp = String(Date.now());
  await ctx.route((url) => url.origin === origin, async (route) => {
    const req = route.request();
    if (req.resourceType() !== 'document' || req.method() !== 'GET') return route.fallback();
    let resp;
    try { resp = await route.fetch(); } catch { return route.fallback(); }
    const ct = resp.headers()['content-type'] || '';
    if (!ct.includes('text/html')) return route.fulfill({ response: resp });
    let html = await resp.text();
    const m = html.match(/<link rel="stylesheet" href="([^"]*\/assets\/css\/index\.[^"]*\.css)">/);
    if (m) {
      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><link rel="stylesheet" href="${m[1]}" media="not all"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
      html = html.replace(/<link rel="stylesheet" href="[^"]*\/assets\/css\/theme-[^"]*\.css[^"]*">/, `<link rel="stylesheet" href="/assets/css/theme-${themeName}.css?preview=${stamp}">`);
      html = html.replace(/(<html[^>]*\bdata-theme=")[^"]*"/, `$1${themeName}"`);
    }
    return route.fulfill({ response: resp, body: html });
  });
}
