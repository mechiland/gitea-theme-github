import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'playwright/test';

if (!process.env.VISUAL_STATE) throw new Error('Run npm run test:visual to prepare the isolated Gitea fixtures.');
const state = JSON.parse(fs.readFileSync(process.env.VISUAL_STATE, 'utf8'));
const output = path.resolve('shots/visual', state.version);

export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: 'theme.spec.mjs',
  timeout: 30_000,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  updateSnapshots: 'none',
  outputDir: path.join(output, 'test-results'),
  snapshotPathTemplate: path.join(output, 'reference', '{projectName}', '{testName}', '{arg}{ext}'),
  reporter: [
    ['list'],
    ['html', {outputFolder: path.join(output, 'report'), open: 'never'}],
    ['json', {outputFile: path.join(output, 'results.json')}],
  ],
  expect: {toHaveScreenshot: {animations: 'disabled', caret: 'hide', threshold: 0.15, maxDiffPixels: 80}},
  use: {
    baseURL: state.candidate.url,
    storageState: state.candidate.storageState,
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.SHOOT_CHROMIUM ? {executablePath: process.env.SHOOT_CHROMIUM} : {},
  },
  projects: ['light', 'dark'].flatMap((colorScheme) => [1440, 390].map((width) => ({
    name: `${colorScheme}-${width}`,
    use: {colorScheme, viewport: {width, height: width === 390 ? 844 : 1000}},
  }))),
});
