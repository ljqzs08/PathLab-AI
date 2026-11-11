/** Records the v3 primer demo segment for the submission video. Output stays inside D:\竞赛\.cache. */
import { defineConfig } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.env.PATHLAB_TEST_URL = pathToFileURL(fileURLToPath(new URL('../../PathLab AI.html', import.meta.url))).href;
const size = { width: 1906, height: 1080 };

export default defineConfig({
  testDir: '.',
  testMatch: 'record-primer-v3.spec.ts',
  outputDir: '../../../.cache/demo-v3',
  timeout: 300_000,
  workers: 1,
  reporter: 'line',
  use: { actionTimeout: 10_000, browserName: 'chromium', viewport: size, locale: 'zh-CN', colorScheme: 'dark', video: { mode: 'on', size } },
});
