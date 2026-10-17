import { appUrl } from './helpers';
/** AI-executed synthetic browser interactions; never presented as human learner evidence. */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import levels from '../../fixtures/levels.json' with { type: 'json' };
import { runBfs } from '../../src/domain/algorithms/bfs';
import { runAstar } from '../../src/domain/algorithms/astar';
import type { Algorithm } from '../../contracts/types';

const workbench = (page: Page) => page.getByTestId('learning-workbench');
async function answer(page: Page, levelIndex: number, algorithm: Algorithm, wrong = false) {
  const ordinal = Number(await page.getByTestId('selection-count').innerText()) + 1;
  const trace = (algorithm === 'bfs' ? runBfs : runAstar)(levels[levelIndex]!);
  const actual = trace.events.filter(e => e.type === 'node_selected')[ordinal - 1]!.payload.node;
  let choice = page.getByTestId('candidate-' + actual.x + '-' + actual.y);
  if (wrong) choice = page.locator('[data-testid^="candidate-"]').filter({ hasNotText: '(' + actual.x + ', ' + actual.y + ')' }).first();
  await choice.click(); await page.getByTestId('submit-prediction').click();
}
async function finish(page: Page, index: number, algorithm: Algorithm) {
  for (let n = 0; n < 100; n++) {
    const state = await workbench(page).getAttribute('data-state');
    if (state === 'reflection') return;
    if (state === 'prediction') await answer(page, index, algorithm);
    else { expect(state).toBe('paused'); await page.getByTestId('step').click(); }
  }
  throw new Error('Replay did not terminate within the fixed-map bound');
}
async function noOverflow(page: Page) {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
}

test('prediction gates DOM Canvas aria timeline and controls until an actual single submission', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.getByTestId('path-length')).toHaveText('未揭示');
  await page.getByRole('button', { name: '开始预测' }).click();
  await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
  await expect(page.getByTestId('selection-count')).toHaveText('1');
  await expect(page.getByTestId('prediction-feedback')).toHaveCount(0);
  await expect(page.getByTestId('submit-prediction')).toBeDisabled();
  await expect(page.getByTestId('step')).toBeDisabled();
  await expect(page.getByTestId('play-pause')).toBeDisabled();
  await expect(page.locator('[data-event-type="run_finished"]')).toHaveCount(0);
  expect(await page.getByTestId('map-grid').locator('[data-search="当前选中"]').count()).toBe(1);
  await page.getByRole('button', { name: '规则提示 0/3' }).click();
  await expect(page.getByTestId('prediction-feedback')).toHaveCount(0);
  await answer(page, 0, 'bfs', true);
  await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
  await expect(page.getByTestId('prediction-feedback')).toContainText('实际选择');
  await expect(page.getByTestId('selection-count')).toHaveText('2');
  await expect(page.getByTestId('submit-prediction')).toHaveCount(0);
  await page.getByTestId('step').click();
  await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
  await expect(page.getByTestId('selection-count')).toHaveText('3');
  await expect(page.getByTestId('path-length')).toHaveText('未揭示');
  await noOverflow(page);
});

for (const [index, level] of levels.entries()) for (const algorithm of level.algorithms as Algorithm[]) {
  test(level.id + ' ' + algorithm + ' completes from gated browser controls with exact engine metrics', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(appUrl); await page.getByTestId('mission-' + level.id).click();
    await page.getByLabel('本关算法').selectOption(algorithm);
    await page.getByRole('button', { name: '开始预测' }).click();
    await expect(page.getByLabel('本关算法')).toBeDisabled();
    await finish(page, index, algorithm);
    const result = (algorithm === 'bfs' ? runBfs : runAstar)(level);
    await expect(page.getByTestId('path-length')).toHaveText(String(result.metrics.pathLength));
    await expect(page.getByTestId('expanded-count')).toHaveText(String(result.metrics.expandedCount));
    await expect(page.getByTestId('selection-count')).toHaveText(String(result.metrics.selectionCount));
    await expect(page.getByTestId('discovered-count')).toHaveText(String(result.metrics.discoveredCount));
    await expect(page.getByTestId('first-attempt-stats')).toContainText('2/2');
    await expect(page.getByTestId('run-summary')).toBeVisible();
    await expect(page.getByTestId('search-canvas')).toBeVisible();
    await expect(page.getByTestId('search-canvas')).toHaveAttribute('aria-hidden', 'true');
    await noOverflow(page); expect(errors).toEqual([]);
  });
}

test('replay keyboard shortcuts are scoped and timer stops before the next checkpoint', async ({ page }) => {
  await page.goto(appUrl); await page.getByRole('button', { name: '开始预测' }).click();
  await answer(page, 0, 'bfs');
  await page.getByLabel('回放速度').selectOption('0.5');
  const controls = page.getByRole('group', { name: '回放快捷键' });
  await controls.focus(); await page.keyboard.press('Space');
  await expect(workbench(page)).toHaveAttribute('data-state', 'running');
  await page.keyboard.press('Space');
  await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
  const count = await page.getByTestId('selection-count').innerText();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('selection-count')).toHaveText(count);
  await page.getByLabel('回放速度').selectOption('4');
  await page.getByTestId('play-pause').click();
  await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
  await page.waitForTimeout(500);
  await expect(page.getByTestId('selection-count')).toHaveText('3');
  await expect(page.getByTestId('play-pause')).toBeDisabled();
});

test('first-attempt statistics and completed summaries survive resets and mission switching', async ({ page }) => {
  await page.goto(appUrl); await page.getByRole('button', { name: '开始预测' }).click();
  await answer(page, 0, 'bfs', true); await finish(page, 0, 'bfs');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('1/2');
  await page.getByRole('button', { name: '重置当前任务' }).click();
  await page.getByRole('button', { name: '开始预测' }).click(); await finish(page, 0, 'bfs');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('1/2');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('2 次完整运行');
  await page.getByTestId('mission-L02').click(); await page.getByTestId('mission-L01').click();
  await expect(workbench(page)).toHaveAttribute('data-state', 'reflection');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('1/2');
  await page.reload(); await expect(workbench(page)).toHaveAttribute('data-state', 'reflection');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('1/2');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('2 次完整运行');
});

test('map inspector has keyboard parity and does not fabricate costs for undiscovered nodes', async ({ page }) => {
  await page.goto(appUrl);
  await page.getByTestId('map-grid').locator('[data-kind="goal"]').click();
  await expect(page.getByTestId('node-inspector')).toContainText('尚无已揭示的代价');
  await page.getByRole('button', { name: '开始预测' }).click();
  const start = levels[0]!.start;
  await page.getByTestId('map-grid').locator('[data-cell="' + start.x + ',' + start.y + '"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('node-inspector')).toContainText('(' + (start.x + 1) + ',' + start.y + ')');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('node-inspector')).toContainText('g 已走步数');
  await page.getByRole('button', { name: '规则提示 0/3' }).focus(); await page.keyboard.press('Space');
  await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
  await expect(page.getByRole('button', { name: '规则提示 1/3' })).toBeFocused();
});

test('prediction paused and terminal views pass automated WCAG checks and remain local-only', async ({ page }) => {
  const external: string[] = [], errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => { const url=new URL(route.request().url()); if(url.origin==='http://127.0.0.1:3210'||(process.env.PATHLAB_TEST_URL&&url.protocol==='file:')) return route.continue(); external.push(url.origin); return route.abort(); });
  await page.goto(appUrl); await page.getByRole('button', { name: '开始预测' }).click();
  for (const state of ['prediction','paused','reflection']) {
    if (state === 'paused') await answer(page, 0, 'bfs');
    if (state === 'reflection') await finish(page, 0, 'bfs');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(result.violations).toEqual([]); await noOverflow(page);
  }
  expect(external).toEqual([]); expect(errors).toEqual([]);
  expect(await page.evaluate(() => ({keys:Object.keys(localStorage),session:sessionStorage.length}))).toEqual({keys:['pathlab.progress.v1'],session:0});
});
