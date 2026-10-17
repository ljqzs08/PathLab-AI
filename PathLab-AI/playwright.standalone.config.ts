import { defineConfig } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.env.PATHLAB_TEST_URL = pathToFileURL(fileURLToPath(new URL('./PathLab AI.html', import.meta.url))).href;

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/browser/*.spec.ts', '**/standalone/*.spec.ts'],
  testIgnore: '**/stage6-review.temp.spec.ts',
  outputDir: '../.cache/standalone-browser-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: '../.cache/standalone-browser-results.json' }]],
  use: {
    baseURL: process.env.PATHLAB_TEST_URL,
    browserName: 'chromium',
    channel: 'msedge',
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    colorScheme: 'dark',
    offline: true,
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'narrow-320', use: { viewport: { width: 320, height: 860 }, isMobile: true, hasTouch: true } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
  ],
});
