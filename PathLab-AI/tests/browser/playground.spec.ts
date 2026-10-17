/** AI browser checks; not human or physical-device acceptance. */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { appUrl, noOverflow } from './helpers';
import { comparePlayground, createPlayground } from '../../src/domain/playground';

const scope = (page: import('@playwright/test').Page) => page.getByTestId('playground');
test('playground protects endpoints, supports keyboard paint and undo without touching missions', async ({ page }) => {
  await page.goto(appUrl);
  const area = scope(page);
  await expect(area.getByRole('button', {name:'提交预测并对比'})).toBeDisabled();
  await expect(area.getByTestId('playground-results')).toHaveCount(0);
  await area.locator('[data-play-cell="0,0"]').click();
  await expect(area.locator('[data-play-cell="0,0"]')).toHaveAttribute('data-kind','start');
  await area.locator('[data-play-cell="1,0"]').focus();
  await page.keyboard.press('Enter');
  await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','wall');
  await page.keyboard.press('ArrowDown');
  await expect(area.locator('[data-play-cell="1,1"]')).toBeFocused();
  await expect(area.locator('[data-play-cell="1,1"]')).toHaveAttribute('data-kind','road');
  await page.keyboard.press('Space');
  await expect(area.locator('[data-play-cell="1,1"]')).toHaveAttribute('data-kind','wall');
  await area.getByRole('button', {name:'撤销编辑'}).click();
  await expect(area.locator('[data-play-cell="1,1"]')).toHaveAttribute('data-kind','road');
  await area.getByLabel('地图编辑画笔').selectOption('start');
  await area.locator('[data-play-cell="1,0"]').click();
  await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','start');
  await area.getByLabel('地图编辑画笔').selectOption('goal');
  await area.locator('[data-play-cell="1,0"]').click();
  await expect(area.locator('[data-play-cell="8,0"]')).toHaveAttribute('data-kind','goal');
  await expect(page.getByTestId('learning-workbench')).toHaveAttribute('data-state','briefing');
  await expect(page.getByTestId('map-grid').locator('[data-cell="1,0"]')).not.toHaveAttribute('data-kind','start');
  await noOverflow(page);
});

test('predicted comparison uses actual metrics and replay clears on map changes', async ({ page }) => {
  await page.goto(appUrl);
  const area = scope(page), result = comparePlayground(createPlayground('detour'));
  await area.getByLabel('扩展数量预测').selectOption(result.fewerExpanded);
  await area.getByRole('button', {name:'提交预测并对比'}).click();
  await expect(area.getByRole('status')).toContainText('这次预测符合结果');
  for (const id of ['bfs','astar'] as const) {
    await expect(area.getByTestId('playground-result-'+id).locator('dd')).toHaveText([String(result[id].metrics.pathLength),String(result[id].metrics.expandedCount),String(result[id].metrics.frontierPeak)]);
  }
  await expect(area.locator('[data-state="path"]')).toHaveCount(0);
  await area.getByRole('button',{name:'自由回放单步',exact:true}).click();
  await expect(area.getByTestId('playground-step')).toContainText('已选择 1 /');
  await area.getByRole('button',{name:'播放自由回放'}).click();
  await expect(area.getByTestId('playground-step')).not.toContainText('已选择 1 /');
  await area.getByRole('button',{name:'暂停自由回放'}).click();
  const paused = await area.getByTestId('playground-step').innerText();
  await page.waitForTimeout(450);
  await expect(area.getByTestId('playground-step')).toHaveText(paused);
  await area.getByLabel('自由地图回放算法').selectOption('astar');
  await expect(area.getByTestId('playground-step')).toContainText('已选择 0 /');
  await area.getByRole('button',{name:'自由回放单步',exact:true}).click();
  await area.getByRole('button',{name:'从头回放'}).click();
  await expect(area.getByTestId('playground-step')).toContainText('已选择 0 /');
  await area.locator('[data-play-cell="1,1"]').click();
  await expect(area.getByTestId('playground-results')).toHaveCount(0);
  await expect(area.getByLabel('扩展数量预测')).toHaveValue('');
  await expect(area.getByRole('button',{name:'提交预测并对比'})).toBeDisabled();
});

test('unreachable map has no fake path and presets are undoable', async ({ page }) => {
  await page.goto(appUrl);
  const area = scope(page);
  await area.getByRole('button',{name:'空白地图',exact:true}).click();
  await area.locator('[data-play-cell="1,0"]').click();
  await area.locator('[data-play-cell="0,1"]').click();
  await area.getByLabel('扩展数量预测').selectOption('astar');
  await area.getByRole('button',{name:'提交预测并对比'}).click();
  await expect(area.getByRole('status')).toContainText('这次预测与结果不同');
  await expect(area.getByRole('status')).toContainText('终点不可达');
  await expect(area.getByTestId('playground-result-bfs')).toContainText('不可达');
  await area.getByRole('button',{name:'自由回放单步',exact:true}).click();
  await expect(area.getByTestId('playground-step')).toContainText('回放完成');
  await expect(area.locator('[data-state="path"]')).toHaveCount(0);
  await area.getByRole('button',{name:'岔路探索',exact:true}).click();
  await area.getByRole('button',{name:'撤销编辑'}).click();
  await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','wall');
  await expect(area.locator('[data-play-cell="0,1"]')).toHaveAttribute('data-kind','wall');
});

test('playground replay reaches exact path, retries and survives reduced motion access checks', async ({ page }) => {
  await page.goto(appUrl);
  const area = scope(page), result = comparePlayground(createPlayground('open'));
  await area.getByRole('button',{name:'空白地图',exact:true}).click();
  await area.getByLabel('扩展数量预测').selectOption('astar');
  await area.getByRole('button',{name:'提交预测并对比'}).click();
  await area.getByLabel('自由地图回放算法').selectOption('astar');
  await area.getByLabel('自由地图回放速度').selectOption('4');
  await area.getByRole('button',{name:'播放自由回放'}).click();
  await expect(area.getByTestId('playground-step')).toContainText('回放完成',{timeout:10000});
  const path = await area.locator('[data-state="path"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-play-cell')).sort());
  expect(path).toEqual(result.astar.path.map(p=>p.x+','+p.y).sort());
  await expect(area.getByRole('button',{name:'播放自由回放'})).toBeDisabled();
  await noOverflow(page);
  const axe = await new AxeBuilder({page}).include('#free-playground').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(axe.violations).toEqual([]);
  await area.getByRole('button',{name:'重新预测'}).click();
  await expect(area.getByTestId('playground-results')).toHaveCount(0);
  await expect(area.locator('[data-kind="wall"]')).toHaveCount(0);
});

test('playground never saves practice into learning progress or generates network requests', async ({ page }) => {
  await page.goto(appUrl);
  await page.getByTestId('mission-L02').click();
  const saved = await page.evaluate(()=>localStorage.getItem('pathlab.progress.v1'));
  const external: string[] = [];
  page.on('request',request=>{const url=new URL(request.url()); if(url.protocol!=='file:' && url.hostname!=='127.0.0.1') external.push(request.url());});
  const area = scope(page);
  await area.locator('[data-play-cell="1,0"]').click();
  await area.getByLabel('扩展数量预测').selectOption('bfs');
  await area.getByRole('button',{name:'提交预测并对比'}).click();
  expect(await page.evaluate(()=>localStorage.getItem('pathlab.progress.v1'))).toBe(saved);
  await page.reload();
  await expect(page.getByTestId('mission-L02')).toHaveAttribute('aria-pressed','true');
  await expect(area.locator('[data-play-cell="1,0"]')).toHaveAttribute('data-kind','road');
  await expect(area.getByTestId('playground-results')).toHaveCount(0);
  expect(external).toEqual([]);
});
