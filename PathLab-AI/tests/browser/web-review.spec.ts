/** AI-only synthetic browser checks; external navigation and clipboard are mocked. */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixtures from '../../fixtures/levels.json' with { type: 'json' };
import type { LevelDefinition } from '../../contracts/types';
import { launch, finish, changedInput, noOverflow } from './helpers';
const level = fixtures[0] as LevelDefinition;
async function ready(page: Page) {
  await launch(page, level, 'bfs');
  await expect(page.getByTestId('web-review')).toHaveCount(0);
  await finish(page, level, 'bfs');
  await expect(page.getByTestId('web-review')).toBeVisible();
}
async function clipboard(page: Page, mode: 'success' | 'denied' | 'absent' | 'pending') {
  await page.evaluate(mode => {
    const state = window as typeof window & { copiedText?: string; resolveCopy?: () => void };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : { writeText: async (text: string) => {
      if (mode === 'denied') throw new Error('Synthetic denial');
      if (mode === 'pending') await new Promise<void>(resolve => { state.resolveCopy = resolve; });
      state.copiedText = text;
    } } });
  }, mode);
}

test('web review is gated, local-only, accessible and leaves API optional', async ({ page }) => {
  const external: string[] = [], errors: string[] = [];
  page.on('request', request => { if (/deepseek\.com|\/api\/feedback/.test(request.url())) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await expect(page.getByTestId('api-review-options')).not.toHaveAttribute('open');
  await expect(page.getByRole('radio', { name: /拆解条件实验/ })).toBeDisabled();
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/缺少完整的前后对照/);
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/\[F1\]/);
  await page.getByLabel('2. 用自己的话解释').fill('PRIVATE_WEB_REVIEW_EXPLANATION');
  expect(await page.getByTestId('web-review-preview').inputValue()).not.toContain('PRIVATE_WEB_REVIEW_EXPLANATION');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByText('第一次使用？查看粘贴与核对方法', { exact: true }).click();
  expect((await new AxeBuilder({ page }).include('[data-testid="web-review"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await noOverflow(page); expect(external).toEqual([]); expect(errors).toEqual([]);
});

test('copy matches visible preview, does not persist, and option changes invalidate success', async ({ page }) => {
  await ready(page); await clipboard(page, 'success');
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  const preview = await page.getByTestId('web-review-preview').inputValue();
  await page.getByTestId('web-review-copy').click();
  await expect(page.getByTestId('web-review-status')).toContainText('尚未发送');
  await expect(page.getByTestId('web-review-copy')).toHaveText('已复制 · 再次复制');
  expect(await page.evaluate(() => (window as typeof window & { copiedText: string }).copiedText)).toBe(preview);
  await page.getByRole('radio', { name: /讲清选择规则/ }).check();
  await expect(page.getByTestId('web-review-copy')).toHaveText('复制复盘内容');
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/一般原理分开/);
  await page.getByLabel('复盘回答风格').selectOption('guided');
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/循序引导/);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.getByTestId('web-review-copy').click();
  expect(await page.evaluate(() => (window as typeof window & { copiedText: string }).copiedText)).toBe(await page.getByTestId('web-review-preview').inputValue());
});

for (const mode of ['denied', 'absent'] as const) test(`clipboard ${mode} offers selectable manual fallback`, async ({ page }) => {
  await ready(page); await clipboard(page, mode);
  await page.getByTestId('web-review-copy').click();
  await expect(page.getByTestId('web-review-status')).toContainText('自动复制不可用');
  await expect(page.getByTestId('web-review-preview')).toBeFocused();
  expect(await page.getByTestId('web-review-preview').evaluate((el: HTMLTextAreaElement) => el.selectionStart === 0 && el.selectionEnd === el.value.length)).toBe(true);
  await expect(page.getByTestId('web-review-copy')).toBeEnabled();
  await page.getByRole('button', { name: '选中全文', exact: true }).click();
  await expect(page.getByTestId('web-review-status')).toContainText('已选中全文');
});

test('late clipboard completion cannot mark changed or unmounted content copied', async ({ page }) => {
  await ready(page); await clipboard(page, 'pending');
  await page.getByTestId('web-review-copy').click();
  await expect(page.getByTestId('web-review-copy')).toBeDisabled();
  await page.getByLabel('复盘回答风格').selectOption('guided');
  await expect(page.getByTestId('web-review-copy')).toBeDisabled(); // Never overlap clipboard writes.
  await page.evaluate(() => (window as typeof window & { resolveCopy: () => void }).resolveCopy());
  await expect(page.getByTestId('web-review-status')).toContainText('重新复制');
  await expect(page.getByTestId('web-review-copy')).toHaveText('复制复盘内容');
  await page.getByTestId('web-review-copy').click();
  await page.getByTestId('open-condition').click();
  await page.evaluate(() => (window as typeof window & { resolveCopy: () => void }).resolveCopy());
  await expect(page.getByTestId('web-review')).toHaveCount(0);
  await page.getByRole('button', { name: '取消，返回复盘', exact: true }).click();
  await expect(page.getByTestId('web-review-copy')).toHaveText('复制复盘内容');
  await expect(page.getByLabel('复盘回答风格')).toHaveValue('brief');
});

test('fresh condition result enables real comparison and clears old review state', async ({ page }) => {
  await ready(page); await clipboard(page, 'success');
  await page.getByTestId('web-review-copy').click();
  await page.getByTestId('open-condition').click();
  await page.getByTestId('apply-condition').click();
  await expect(page.getByTestId('web-review')).toHaveCount(0);
  await page.getByRole('button', { name: '开始预测' }).click();
  await finish(page, changedInput(level), 'bfs');
  await page.getByRole('radio', { name: /拆解条件实验/ }).check();
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/\[C1\] 仅/);
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/上次（修订 0）/);
  await expect(page.getByTestId('web-review-preview')).toHaveValue(/本次（修订 1）/);
  await expect(page.getByTestId('web-review-copy')).toHaveText('复制复盘内容');
  await noOverflow(page);
});

test('external link opens only the fixed official URL without prompt or referrer, not a completion claim', async ({ page, context }) => {
  await context.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Synthetic external page</title><p>Mock, no DeepSeek request.</p>' }));
  await ready(page);
  const link = page.getByTestId('web-review-open');
  await expect(link).toHaveAttribute('href', 'https://chat.deepseek.com/');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('referrerpolicy', 'no-referrer');
  const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe('https://chat.deepseek.com/');
  expect(await popup.evaluate(() => window.opener === null && document.referrer === '')).toBe(true);
  await popup.close();
  await expect(page.getByTestId('web-review-status')).toContainText('尚未发送');
  await expect(page.getByTestId('learning-workbench')).toHaveAttribute('data-state', 'reflection');
});

test('keyboard, finite motion and rapid option changes preserve layout and reduced-motion behavior', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page);
  await expect(page.getByTestId('web-review')).toHaveCSS('animation-duration', '0.22s');
  expect(await page.getByTestId('web-review').evaluate(el => getComputedStyle(el).animationIterationCount)).toBe('1');
  const first = page.getByRole('radio', { name: /看懂预测偏差/ });
  await first.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /讲清选择规则/ })).toBeChecked();
  for (let n = 0; n < 12; n++) await page.getByLabel('复盘回答风格').selectOption(n % 2 ? 'brief' : 'guided');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByTestId('web-review')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.web-review-topics label').first()).toHaveCSS('transition-duration', '0s');
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity).length)).toBe(0);
  await noOverflow(page);
});
