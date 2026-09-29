// Lists the themes offered on /user/settings/appearance (read-only; uses the shoot tool's cached admin session).
import {launchBrowser} from './lib/browser.mjs';
const b = await launchBrowser();
const ctx = await b.newContext({storageState: new URL('../../.cache/gitea-admin-storage.json', import.meta.url).pathname});
const p = await ctx.newPage();
await p.goto('http://localhost:3000/user/settings/appearance', {waitUntil: 'load'});
const themes = await p.$$eval('.menu .item[data-value]', (els) => els.map((e) => e.dataset.value));
console.log(JSON.stringify({url: p.url(), count: themes.length, themes}));
await b.close();
