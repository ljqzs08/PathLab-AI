import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import levels from '../../fixtures/levels.json' with { type: 'json' };

test('renders an honest local shell without claiming algorithm or AI results', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('PathLab AI · 路径学习实验室');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('先解释下一步');
  await expect(page.getByTestId('mission-title')).toHaveText(levels[0]!.title);
  await expect(page.getByRole('button', { name: '开始预测' })).toBeDisabled();
  await expect(page.getByText('仅展示原始关卡；没有计算路径、扩展节点或预测答案。')).toBeVisible();
  await expect(page.getByText('远程 AI / 进度保存 / JSON 导入导出')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('all four mission buttons project the unchanged fixed fixture, never a generated path', async ({ page }) => {
  await page.goto('/');
  for (const level of levels) {
    await page.getByTestId('mission-' + level.id).click();
    await expect(page.getByTestId('mission-title')).toHaveText(level.title);
    await expect(page.getByRole('button', { pressed: true })).toHaveCount(1);
    await expect(page.getByTestId('mission-' + level.id)).toHaveAttribute('aria-pressed', 'true');
    const map = page.getByTestId('map-grid');
    await expect(map).toHaveAttribute('data-level-id', level.id);
    await expect(map).toHaveAccessibleName(new RegExp(level.grid.width + '列' + level.grid.height + '行'));
    const cells = await map.locator('[data-cell]').evaluateAll((items) => items.map((item) => ({ cell: item.getAttribute('data-cell'), kind: item.getAttribute('data-kind') })));
    const expected = level.grid.rows.flatMap((row, y) => [...row].map((cell, x) => ({
      cell: x + ',' + y,
      kind: x === level.start.x && y === level.start.y ? 'start' : x === level.goal.x && y === level.goal.y ? 'goal' : cell === '#' ? 'wall' : 'road',
    })));
    expect(cells).toEqual(expected);
    for (const objective of level.learningObjectives) await expect(page.locator('.objectives')).toContainText(objective);
  }
});

test('keyboard selection and skip navigation work without pointer input', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到任务工作台' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mission-workspace')).toBeFocused();
  await page.getByTestId('mission-L02').focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('mission-title')).toHaveText(levels[1]!.title);
  await page.getByTestId('mission-L04').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mission-title')).toHaveText(levels[3]!.title);
  await expect(page.getByRole('status')).toContainText('已选择 L04');
  await expect(page.getByTestId('mission-L04')).toBeFocused();
});

test('every fixed map and panel stays within the viewport', async ({ page }) => {
  await page.goto('/');
  for (const level of levels) {
    await page.getByTestId('mission-' + level.id).click();
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    const box = await page.getByTestId('map-grid').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(dimensions.width);
  }
});

test('default and final mission pass automated WCAG A and AA checks', async ({ page }) => {
  await page.goto('/');
  for (const id of ['L01', 'L04']) {
    await page.getByTestId('mission-' + id).click();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations).toEqual([]);
  }
});

test('default usage makes no remote requests or learning-storage writes', async ({ page }) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3210') return route.continue();
    external.push(url.origin + url.pathname);
    return route.abort();
  });
  await page.goto('/');
  await page.getByTestId('mission-L04').click();
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.reload();
  await expect(page.getByTestId('mission-title')).toHaveText(levels[0]!.title);
});

test('reduced motion disables smooth scrolling and decorative transitions', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  const duration = await page.getByTestId('mission-L02').evaluate((item) => getComputedStyle(item).transitionDuration);
  expect(duration).toBe('0s');
});
