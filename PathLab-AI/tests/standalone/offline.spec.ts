/** AI-executed file:// tests, not a claim about all browsers or human acceptance. */
import { test, expect } from '@playwright/test';
import { copyFile, mkdtemp, readFile, readdir, rmdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fixtures from '../../fixtures/levels.json' with { type: 'json' };
import type { LevelDefinition } from '../../contracts/types';
import { appUrl, answer, finish, noOverflow, workbench } from '../browser/helpers';

const html = fileURLToPath(appUrl);
const levels = fixtures as LevelDefinition[];

test('the complete single HTML loads offline without localhost, network or sidecar resources', async ({ page, context }) => {
  await context.setOffline(true);
  const attempts: string[] = [], errors: string[] = [];
  page.on('request', request => { if (/^(https?|wss?):/.test(request.url())) attempts.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(appUrl);
  expect(new URL(page.url()).protocol).toBe('file:');
  await expect(page.getByTestId('learning-workbench')).toBeVisible();
  await expect(page.getByTestId('search-canvas')).toBeVisible();
  await expect(page.getByRole('note')).toContainText('完整 HTML 单文件版');
  await expect(page.getByRole('complementary', { name: '单文件运行说明' }).getByRole('note')).toBeVisible();
  expect(await readFile(html, 'utf8')).toContain('Permission is hereby granted');
  expect(await page.locator('script[src], link[rel="stylesheet"], iframe, a[href^="http"]').count()).toBe(0);
  expect(await page.locator('script:not([src])').count()).toBe(1);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toMatch(/^data:image\/svg\+xml,/);
  for (const level of levels) {
    await page.getByTestId('mission-' + level.id).click();
    await expect(page.getByTestId('mission-title')).toHaveText(level.title);
  }
  await page.reload();
  await expect(page.getByTestId('mission-title')).toHaveText(levels[3]!.title);
  await noOverflow(page);
  expect(attempts).toEqual([]);
  expect(errors).toEqual([]);
});

test('copying only the HTML to a different folder still runs a complete A-star learning session offline', async ({ page, context }) => {
  const cache = resolve(dirname(html), '..', '.cache');
  const folder = await mkdtemp(join(cache, 'standalone-portability-'));
  const copy = join(folder, '独立移动的 PathLab 作品.html');
  await copyFile(html, copy);
  try {
    expect(await readdir(folder)).toEqual(['独立移动的 PathLab 作品.html']);
    expect(await readFile(copy, 'utf8')).toBe(await readFile(html, 'utf8'));
    await context.setOffline(true);
    const network: string[] = [];
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    await page.goto(pathToFileURL(copy).href);
    const level = levels.find(item => item.algorithms.includes('astar'))!;
    await page.getByTestId('mission-' + level.id).click();
    await page.getByLabel('本关算法').selectOption('astar');
    await page.getByRole('button', { name: '开始预测' }).click();
    await finish(page, level, 'astar');
    await expect(workbench(page)).toHaveAttribute('data-state', 'reflection');
    await expect(page.getByTestId('local-feedback')).toBeVisible();
    expect(network).toEqual([]);
    await noOverflow(page);
  } finally {
    // Exact files created by this test; no recursive removal or existing-cache cleanup.
    await page.goto('about:blank');
    await unlink(copy);
    await rmdir(folder);
  }
});

test('a denied file-origin storage accessor does not prevent prediction or JSON backup', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('file storage denied', 'SecurityError'); } });
  });
  await page.goto(appUrl);
  await expect(page.getByTestId('save-status')).toContainText('存储不可用');
  await page.getByRole('button', { name: '开始预测' }).click();
  await answer(page, levels[0]!, 'bfs');
  await expect(page.getByTestId('prediction-feedback')).toBeVisible();
  await page.getByTestId('progress-panel').locator('summary').click();
  const event = page.waitForEvent('download');
  await page.getByTestId('export-progress').click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('pathlab-progress-v1.json');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Missing in-memory backup.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const backup = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  expect(backup.schemaVersion).toBe(1);
  expect(backup.sessions.some((session: { commands: unknown[] }) => session.commands.length > 0)).toBe(true);
  await noOverflow(page);
});
