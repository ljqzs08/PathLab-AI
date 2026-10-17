/** AI-only mocked integration. Never contacts DeepSeek or uses real credentials. */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixtures from '../../fixtures/levels.json' with { type: 'json' };
import type { FeedbackRequest, LevelDefinition } from '../../contracts/types';
import { launch, finish, noOverflow } from './helpers';
const level = fixtures[0] as LevelDefinition;
const access = 'synthetic-browser-access-token-123456789';
const offline = () => process.env.PATHLAB_TEST_URL?.startsWith('file:');
const result = (request: FeedbackRequest) => ({ runId: request.runId, gridRevision: request.gridRevision, feedback: {
  schemaVersion: 1, mode: 'remote', summary: '合成远程反馈：核对已给出的搜索事件。', primaryErrorType: null,
  evidence: [{ eventId: request.facts.events[0]!.eventId, factPath: '/facts/events/0/description' }],
  hintLevel: 4, nextQuestion: '哪个已揭示事件支持你的解释？', recommendation: '分开比较路径步数与扩展数。', insufficientEvidence: true,
} });
async function ready(page: Page) {
  await launch(page, level, 'bfs');
  await expect(page.getByTestId('request-remote')).toHaveCount(0);
  await finish(page, level, 'bfs');
  await expect(page.getByTestId('local-feedback')).toBeVisible();
  await page.getByTestId('api-review-options').locator('summary').first().click();
  if (offline()) {
    await expect(page.getByTestId('remote-offline')).toBeVisible();
    await expect(page.getByTestId('request-remote')).toHaveCount(0);
    return false;
  }
  return true;
}
async function consent(page: Page) {
  await page.getByLabel('复盘访问口令（不是 DeepSeek API Key）', { exact: true }).fill(access);
  await page.getByLabel('我同意将上面列出的事实发送给 DeepSeek，并知悉可能产生费用。', { exact: true }).check();
}

test('DeepSeek explicit consent, minimal payload, local fallback, no secret persistence and accessible layout', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/feedback', async route => {
    calls++;
    const request = route.request().postDataJSON() as FeedbackRequest;
    expect(route.request().headers().authorization).toBe('Bearer ' + access);
    expect(route.request().headers()['x-pathlab-consent']).toBe('minimal-facts-v1');
    expect(JSON.stringify(request)).not.toContain('私密解释不得外发');
    expect(Object.keys(request).sort()).toEqual(['schemaVersion','levelId','algorithm','runId','gridRevision','requestedHintLevel','answerRevealed','facts'].sort());
    await route.fulfill({ json: result(request) });
  });
  const online = await ready(page);
  if (online) {
    expect(calls).toBe(0);
    await page.getByLabel('2. 用自己的话解释').fill('私密解释不得外发');
    await expect(page.getByTestId('request-remote')).toBeDisabled();
    await page.getByLabel('复盘访问口令（不是 DeepSeek API Key）', { exact: true }).fill(access);
    await expect(page.getByTestId('request-remote')).toBeDisabled();
    await consent(page);
    await page.getByTestId('request-remote').click();
    await expect(page.getByTestId('remote-result')).toContainText('合成远程反馈');
    await expect(page.getByTestId('local-feedback')).toContainText('规则模板 · 未调用模型');
    expect(calls).toBe(1);
    const stored = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stored).not.toContain(access); expect(stored).not.toContain('合成远程反馈');
  } else expect(calls).toBe(0);
  await noOverflow(page);
  expect((await new AxeBuilder({ page }).include('[data-testid="remote-feedback"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('DeepSeek invalid citations, stale run and quota failures retain local result', async ({ page }) => {
  if (!await ready(page)) return;
  await consent(page);
  for (const mode of ['citation','run','revision','unknown','quota']) {
    await page.route('**/api/feedback', async route => {
      const value = result(route.request().postDataJSON());
      if (mode === 'citation') value.feedback.evidence[0]!.eventId = 'invented';
      if (mode === 'run') value.runId = 'old-run';
      if (mode === 'revision') value.gridRevision += 1;
      if (mode === 'unknown') Object.assign(value.feedback, { unexpected: 'field' });
      await route.fulfill(mode === 'quota' ? { status: 429, json: { status: 'rate_limited' } } : { json: value });
    });
    await page.getByTestId('request-remote').click();
    await expect(page.getByTestId('remote-status')).toContainText(mode === 'quota' ? '额度' : '校验失败');
    await expect(page.getByTestId('remote-result')).toHaveCount(0);
    await expect(page.getByTestId('local-feedback')).toBeVisible();
    await page.unroute('**/api/feedback');
  }
});

test('DeepSeek cancellation and condition changes discard in-flight results', async ({ page }) => {
  if (!await ready(page)) return;
  await consent(page);
  let release!: () => void;
  let called!: () => void;
  let gate = new Promise<void>(resolve => { release = resolve; });
  let received = new Promise<void>(resolve => { called = resolve; });
  await page.route('**/api/feedback', async route => {
    const value = result(route.request().postDataJSON()); called();
    await gate; await route.fulfill({ json: value }).catch(() => {});
  });
  await page.getByTestId('request-remote').click(); await received;
  await page.getByRole('button', { name: '取消远程请求', exact: true }).click(); release();
  await expect(page.getByTestId('remote-status')).toContainText('已取消');
  await expect(page.getByTestId('remote-result')).toHaveCount(0);
  gate = new Promise<void>(resolve => { release = resolve; });
  received = new Promise<void>(resolve => { called = resolve; });
  await page.getByTestId('request-remote').click(); await received;
  await page.getByTestId('open-condition').click();
  release(); await expect(page.getByTestId('remote-feedback')).toHaveCount(0);
  await page.getByRole('button', { name: '取消，返回复盘', exact: true }).click();
  await expect(page.getByTestId('remote-result')).toHaveCount(0);
  await page.getByTestId('api-review-options').locator('summary').first().click();
  await expect(page.getByTestId('request-remote')).toBeDisabled();
});

test('DeepSeek actual local route remains disabled; offline build has no remote controls', async ({ page, request }) => {
  if (!await ready(page)) return;
  const response = await request.post('/api/feedback', { data: {} });
  expect(response.status()).toBe(503); expect(await response.json()).toEqual({ status: 'disabled' });
  await consent(page); await page.getByTestId('request-remote').click();
  await expect(page.getByTestId('remote-status')).toContainText('尚未启用');
  await expect(page.getByTestId('local-feedback')).toBeVisible();
});
