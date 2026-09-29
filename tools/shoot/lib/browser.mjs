// Browser launch helper: tries Playwright's bundled chromium first, then falls
// back to any chromium / headless-shell already present in the ms-playwright cache
// (the installed playwright version may expect a revision that was never downloaded).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function cacheCandidates() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), 'Library/Caches/ms-playwright');
  let dirs = [];
  try { dirs = fs.readdirSync(root); } catch { return []; }
  const out = [];
  const rev = (d) => Number(d.split('-').pop()) || 0;
  const shells = dirs.filter((d) => d.startsWith('chromium_headless_shell-')).sort((a, b) => rev(b) - rev(a));
  for (const d of shells) {
    for (const sub of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-mac-x64', 'chrome-headless-shell-linux64']) {
      const p = path.join(root, d, sub, 'chrome-headless-shell');
      if (fs.existsSync(p)) out.push(p);
    }
  }
  const full = dirs.filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => rev(b) - rev(a));
  for (const d of full) {
    for (const sub of ['chrome-mac-arm64', 'chrome-mac']) {
      const p = path.join(root, d, sub, 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (fs.existsSync(p)) out.push(p);
    }
    const p = path.join(root, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) out.push(p);
  }
  return out;
}

export async function launchBrowser(opts = {}) {
  const base = { headless: true, ...opts };
  if (process.env.SHOOT_CHROMIUM) return chromium.launch({ ...base, executablePath: process.env.SHOOT_CHROMIUM });
  try {
    return await chromium.launch(base);
  } catch (err) {
    if (!/Executable doesn't exist/i.test(String(err && err.message))) throw err;
    for (const executablePath of cacheCandidates()) {
      try {
        const b = await chromium.launch({ ...base, executablePath });
        process.stderr.write(`[shoot] bundled chromium missing; using ${executablePath} (${b.version()})\n`);
        return b;
      } catch { /* try next */ }
    }
    throw err;
  }
}
