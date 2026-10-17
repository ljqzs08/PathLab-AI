import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: '../.cache/browser-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: '../.cache/stage-1-browser-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:3210',
    browserName: 'chromium',
    channel: 'msedge',
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    colorScheme: 'dark',
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
  webServer: {
    command: 'npm run start -- --port 3210',
    url: 'http://127.0.0.1:3210',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
