/** AI checks: normal motion, map-based prediction and reduced-motion parity. */
import { test, expect } from '@playwright/test';
import levels from '../../fixtures/levels.json' with { type: 'json' };
import { appUrl, finish, noOverflow, workbench } from './helpers';

test.describe('motion and map prediction', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('normal motion is finite and keeps map geometry stable', async ({ page }) => {
    await page.goto(appUrl);
    await expect(page.locator('.intro-copy')).toHaveCSS('animation-name', 'pathlab-rise-in');
    await expect(page.locator('.learning-loop')).toHaveCSS('animation-duration', '0.55s');
    await page.getByRole('button', { name: '开始预测' }).click();
    const candidates = page.locator('[data-prediction-candidate="true"]');
    expect(await candidates.count()).toBeGreaterThan(1);
    const metrics = await page.getByTestId('map-grid').evaluate(grid => {
      const canvas = grid.querySelector('canvas')!.getBoundingClientRect();
      const rect = grid.getBoundingClientRect();
      return { dx: Math.abs(canvas.x - rect.x), dy: Math.abs(canvas.y - rect.y), dw: Math.abs(canvas.width - rect.width),
        transforms: Array.from(grid.querySelectorAll('button'), el => getComputedStyle(el).transform),
        infinite: document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity).length };
    });
    expect(metrics.dx).toBeLessThan(1); expect(metrics.dy).toBeLessThan(1); expect(metrics.dw).toBeLessThan(1);
    expect(metrics.transforms.every(t => t === 'none')).toBe(true);
    expect(metrics.infinite).toBe(0);
    await noOverflow(page);
  });

  test('map and candidate cards share a draft without bypassing prediction gate', async ({ page }) => {
    await page.goto(appUrl);
    await page.getByRole('button', { name: '开始预测' }).click();
    const candidates = page.locator('[data-prediction-candidate="true"]');
    const id = (await candidates.first().getAttribute('data-cell'))!;
    await candidates.first().click();
    await expect(page.getByTestId('candidate-' + id.replace(',', '-'))).toHaveAttribute('aria-pressed', 'true');
    await expect(candidates.first()).toHaveAttribute('data-prediction-selected', 'true');
    await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
    await expect(page.getByTestId('selection-count')).toHaveText('1');
    await expect(page.getByTestId('play-pause')).toBeDisabled();
    await expect(page.getByTestId('step')).toBeDisabled();
    await expect(page.getByTestId('path-length')).toHaveText('未揭示');
    // Arrow-key inspection must not silently change the draft; Enter can explicitly select.
    await candidates.first().press('ArrowRight');
    await expect(page.getByTestId('candidate-' + id.replace(',', '-'))).toHaveAttribute('aria-pressed', 'true');
    const second = candidates.nth(1);
    const secondId = (await second.getAttribute('data-cell'))!;
    await second.press('Enter');
    await expect(page.getByTestId('candidate-' + secondId.replace(',', '-'))).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /规则提示/ }).click();
    await expect(second).toHaveAttribute('data-prediction-selected', 'true');
    await page.getByTestId('candidate-' + id.replace(',', '-')).click();
    await expect(candidates.first()).toHaveAttribute('data-prediction-selected', 'true');
    await page.locator('[data-prediction-candidate="false"][data-kind="wall"]').first().click();
    await expect(candidates.first()).toHaveAttribute('data-prediction-selected', 'true');
    await page.getByTestId('submit-prediction').click();
    await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
    await expect(page.locator('[data-prediction-selected="true"]')).toHaveCount(0);
    await page.getByRole('button', { name: '重置当前任务' }).click();
    await page.getByRole('button', { name: '开始预测' }).click();
    await expect(page.getByTestId('submit-prediction')).toBeDisabled();
    await expect(page.locator('[data-prediction-selected="true"]')).toHaveCount(0);
    await noOverflow(page);
  });

  test('normal-motion replay completes with no overflow or active decorative loop', async ({ page }) => {
    await page.goto(appUrl);
    await page.getByRole('button', { name: '开始预测' }).click();
    await finish(page, levels[0]!, 'bfs');
    await expect(workbench(page)).toHaveAttribute('data-state', 'reflection');
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity).length)).toBe(0);
    await noOverflow(page);
  });
});

test('reduced motion disables animation but keeps map prediction usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(appUrl);
  await expect(page.locator('.intro-copy')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: '开始预测' }).click();
  await page.locator('[data-prediction-candidate="true"]').first().click();
  await expect(page.getByTestId('submit-prediction')).toBeEnabled();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.getByTestId('submit-prediction').click();
  await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
  await noOverflow(page);
});
