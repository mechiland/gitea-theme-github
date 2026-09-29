// Gitea session helpers: login once (storageState cached in .cache/), ensure
// UI language + user theme via the real web settings forms.
//
// Gitea 1.27 has no CSRF token any more: web POSTs are protected by Go's
// http.CrossOriginProtection (Sec-Fetch-Site / Origin check). We therefore POST
// from inside the page with fetch(), which the browser marks
// `Sec-Fetch-Site: same-origin`, exactly like a real form submit.
import fs from 'node:fs';
import path from 'node:path';

export const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
export const GITEA_URL = (process.env.GITEA_URL || 'http://localhost:3000').replace(/\/$/, '');
export const ADMIN_USER = process.env.GITEA_USER || 'admin';
export const ADMIN_PASS = process.env.GITEA_PASS || '11111111';
export const STATE_FILE = path.join(PROJECT_ROOT, '.cache', `gitea-${ADMIN_USER}-storage.json`);

export function langCookies(baseUrl = GITEA_URL, theme) {
  const u = new URL(baseUrl);
  const c = [{ name: 'lang', value: 'en-US', domain: u.hostname, path: '/' }];
  // gitea_theme cookie is what Gitea uses for signed-out visitors (services/context/context_template.go)
  if (theme) c.push({ name: 'gitea_theme', value: theme, domain: u.hostname, path: '/' });
  return c;
}

async function isLoggedIn(page) {
  const resp = await page.goto(`${GITEA_URL}/user/settings`, { waitUntil: 'domcontentloaded' });
  return resp && resp.ok() && !page.url().includes('/user/login');
}

/** Returns path to a storageState file of a logged-in admin session. */
export async function ensureLogin(browser, { force = false } = {}) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  if (!force && fs.existsSync(STATE_FILE)) {
    const ctx = await browser.newContext({ storageState: STATE_FILE });
    const page = await ctx.newPage();
    const ok = await isLoggedIn(page).catch(() => false);
    await ctx.close();
    if (ok) return STATE_FILE;
  }
  const ctx = await browser.newContext({ locale: 'en-US' });
  await ctx.addCookies(langCookies());
  const page = await ctx.newPage();
  await page.goto(`${GITEA_URL}/user/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#user_name', ADMIN_USER);
  await page.fill('#password', ADMIN_PASS);
  const remember = page.locator('input[name=remember]');
  if (await remember.count()) await remember.check({ force: true }).catch(() => {});
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/user/login'), { timeout: 20000 }),
    page.locator('form[action*="/user/login"] button.primary, form.ui.form button.ui.primary.button').first().click(),
  ]);
  if (!(await isLoggedIn(page))) throw new Error('Gitea login failed (still redirected to /user/login)');
  await ctx.storageState({ path: STATE_FILE });
  await ctx.close();
  return STATE_FILE;
}

async function postForm(page, url, fields) {
  return page.evaluate(async ({ url, fields }) => {
    const body = new URLSearchParams(fields);
    const r = await fetch(url, { method: 'POST', body, credentials: 'same-origin', redirect: 'follow' });
    return { status: r.status, url: r.url };
  }, { url, fields });
}

/** Reads current theme/lang from the appearance page and sets them if different. */
export async function ensureAppearance(browser, stateFile, { theme, lang = 'en-US' } = {}) {
  const ctx = await browser.newContext({ storageState: stateFile });
  await ctx.addCookies(langCookies());
  const page = await ctx.newPage();
  const read = async () => {
    await page.goto(`${GITEA_URL}/user/settings/appearance`, { waitUntil: 'domcontentloaded' });
    return page.evaluate(() => ({
      theme: document.querySelector('form[action$="/theme"] input[name=theme]')?.value ?? null,
      lang: document.querySelector('form[action$="/language"] input[name=language]')?.value ?? null,
      available: [...document.querySelectorAll('form[action$="/theme"] .menu .item[data-value]')].map((e) => e.dataset.value),
      htmlTheme: document.documentElement.dataset.theme || null,
    }));
  };
  let cur = await read();
  const changes = [];
  if (lang && cur.lang !== lang) {
    const r = await postForm(page, `${GITEA_URL}/user/settings/appearance/language`, { language: lang });
    changes.push({ field: 'language', from: cur.lang, to: lang, status: r.status });
  }
  if (theme && cur.theme !== theme) {
    if (cur.available.length && !cur.available.includes(theme)) {
      await ctx.close();
      throw new Error(`Theme "${theme}" is not offered by this Gitea instance. Available: ${cur.available.join(', ')}`);
    }
    const r = await postForm(page, `${GITEA_URL}/user/settings/appearance/theme`, { theme });
    changes.push({ field: 'theme', from: cur.theme, to: theme, status: r.status });
  }
  if (changes.length) cur = await read();
  await ctx.close();
  if (theme && cur.theme !== theme) throw new Error(`Failed to set theme to ${theme} (still ${cur.theme})`);
  if (lang && cur.lang !== lang) throw new Error(`Failed to set language to ${lang} (still ${cur.lang})`);
  return { ...cur, changes };
}

export async function giteaVersion() {
  try {
    const r = await fetch(`${GITEA_URL}/api/v1/version`);
    return (await r.json()).version;
  } catch { return null; }
}
