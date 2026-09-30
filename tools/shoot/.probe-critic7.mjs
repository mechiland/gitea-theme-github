import { launchBrowser } from '/Users/michael/work/gitea/gitea-theme-github/tools/shoot/lib/browser.mjs';
const [url, vw, scheme, out, js] = process.argv.slice(2);
const b = await launchBrowser();
const ctx = await b.newContext({ storageState: '/Users/michael/work/gitea/gitea-theme-github/.cache/gitea-admin-storage.json', viewport: { width: +vw, height: vw==390?844:900 }, deviceScaleFactor: vw==390?2:1, colorScheme: scheme });
const p = await ctx.newPage();
await p.goto('http://localhost:3000' + url, { waitUntil: 'load' });
await p.waitForTimeout(800);
if (js) { const r = await p.evaluate(js); console.log(JSON.stringify(r, null, 1)); }
if (out && out !== '-') await p.screenshot({ path: out });
await b.close();
