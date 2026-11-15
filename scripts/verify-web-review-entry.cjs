/** AI-only offline Edge verification. No external navigation or real clipboard interaction. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..'), TEMP = path.join(ROOT, '.cache/web-review-entry-20261115');
fs.mkdirSync(TEMP, { recursive: true }); process.env.TEMP = process.env.TMP = TEMP;
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(ROOT, '.cache/playwright');
const { chromium } = require(path.join(ROOT, 'PathLab-AI/node_modules/playwright-core'));
const AxeBuilder = require(path.join(ROOT, 'PathLab-AI/node_modules/@axe-core/playwright')).default;
const target = path.join(ROOT, 'PathLab_AI_v4_optimized_final.html'), url = pathToFileURL(target).href;
const sha = () => crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
const checks = [], results = [];
const check = (name, actual, expected) => { assert.deepEqual(actual, expected, name); checks.push({ name, passed: true }); };
async function closeWelcome(page) { await page.locator('#pl-open-coach').waitFor(); if (await page.locator('#welcome-overlay').evaluate(el => el.open)) await page.keyboard.press('Escape'); }
async function finish(page) {
 for (let n = 0; n < 110; n++) {
  const state = await page.getByTestId('learning-workbench').getAttribute('data-state');
  if (state === 'reflection') { await page.getByTestId('web-review').waitFor(); return; }
  if (state === 'prediction') { await page.locator('[data-testid^="candidate-"]').first().click(); await page.getByTestId('submit-prediction').click(); }
  else { assert.equal(state, 'paused'); await page.getByTestId('step').click(); }
 }
 throw Error('Search did not reach reflection');
}
async function launch(page) {
 await page.evaluate(() => { location.hash = 'lab'; });
 await page.getByTestId('mission-L01').click(); await page.getByLabel('本关算法').selectOption('bfs');
 await page.getByRole('button', { name: '开始预测', exact: true }).click();
}
(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true, downloadsPath: TEMP });
 try {
  if (process.argv.includes('--probe')) {
   const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, offline: true, locale: 'zh-CN' });
   const page = await ctx.newPage(); await page.goto(url); await closeWelcome(page);
   const before = { date: '2026-11-15', executor: 'AI', sha256: sha(), browser: browser.version(), homeEntry: await page.locator('#pl-open-review').count(), homeCard: await page.locator('#pl-review-entry').count(), originalReviewBeforeSearch: await page.getByTestId('web-review').count() };
   await launch(page); await finish(page);
   before.originalReviewAfterSearch = await page.getByTestId('web-review').isVisible();
   before.previewHasRealFacts = (await page.getByTestId('web-review-preview').inputValue()).includes('[F1]');
   before.finding = '原网页复盘存在，但首页无可操作入口，仅在任务搜索结束后的复盘阶段出现。';
   fs.writeFileSync(path.join(ROOT, 'docs/evidence/web-review-entry-before-20261115.json'), JSON.stringify(before, null, 2) + '\n');
   console.log(JSON.stringify(before, null, 2)); await ctx.close(); return;
  }
  for (const width of [1440, 768, 390, 320]) {
   const first = checks.length, requests = [], errors = [];
   const ctx = await browser.newContext({ viewport: { width, height: width > 800 ? 1000 : 900 }, offline: true, locale: 'zh-CN', reducedMotion: 'reduce', ...(width < 800 ? { hasTouch: true } : {}) });
   const page = await ctx.newPage();
   page.on('request', req => { if (/^https?:/.test(req.url())) requests.push(req.url()); }); page.on('pageerror', error => errors.push(error.message));
   await page.goto(url); await closeWelcome(page); await page.locator('#pl-open-review').waitFor();
   check(width + ' home card visible', await page.locator('#pl-review-entry').isVisible(), true);
   check(width + ' still eight original stations', await page.locator('.route-card').count(), 8);
   check(width + ' original review not prematurely created', await page.getByTestId('web-review').count(), 0);
   check(width + ' no external link activated before user opens panel', await page.locator('#pl-review-open').getAttribute('href'), null);
   if (width === 1440 || width === 390) { await page.locator('#pl-review-entry').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(TEMP, 'home-' + width + '.png') }); }
   const storeBefore = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
   await page.locator('#pl-open-review').click();
   check(width + ' persistent header entry opens modal', await page.locator('#pl-review-dialog').evaluate(el => el.open), true);
   check(width + ' default learner template available', (await page.locator('#pl-review-preview').inputValue()).includes('【问题】'), true);
   check(width + ' learning template not invented evidence', (await page.locator('#pl-review-preview').inputValue()).includes('没有附带我的运行结果'), true);
   check(width + ' learner template has no F evidence', /\[F\d+\]/.test(await page.locator('#pl-review-preview').inputValue()), false);
   await page.locator('#pl-review-evidence').click();
   check(width + ' absent evidence clearly gated', await page.locator('#pl-review-locked').isVisible(), true);
   check(width + ' no invented result preview', await page.locator('#pl-review-preview').inputValue(), '');
   check(width + ' no empty clipboard copy', await page.locator('#pl-review-copy').isDisabled(), true);
   check(width + ' source adjustment unavailable until real result', await page.locator('#pl-review-go-original').isHidden(), true);
   await page.locator('#pl-review-api summary').click();
   check(width + ' API truthful offline boundary', (await page.locator('#pl-review-api').innerText()).includes('当前离线 HTML 不提供站内 API 请求'), true);
   check(width + ' no API key field in entry', await page.locator('#pl-review-dialog input').count(), 0);
   await page.locator('#pl-review-learn').click();
   for (const topic of ['start', 'costs', 'walls', 'compare']) {
    const before = await page.locator('#pl-review-preview').inputValue(); await page.locator('#pl-review-topic').selectOption(topic);
    const prompt = await page.locator('#pl-review-preview').inputValue();
    check(width + ' topic ' + topic + ' generates safe template', prompt.includes('【本课前提】') && prompt.includes('新术语必须先白话解释'), true);
    if (topic !== 'start') check(width + ' topic ' + topic + ' actually changes prompt', prompt !== before, true);
   }
   await page.locator('#pl-review-style').selectOption('brief');
   check(width + ' brief style reflected in preview', (await page.locator('#pl-review-preview').inputValue()).includes('【方式】简明解释'), true);
   await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__reviewCopy = text; } } }); });
   await page.locator('#pl-review-copy').click();
   check(width + ' copy matches preview exactly', await page.evaluate(() => window.__reviewCopy), await page.locator('#pl-review-preview').inputValue());
   check(width + ' copied status does not claim sending', (await page.locator('#pl-review-status').innerText()).includes('尚未发送'), true);
   await page.locator('#pl-review-topic').selectOption('start');
   check(width + ' changed prompt invalidates copied state', await page.locator('#pl-review-copy').innerText(), '复制提问内容');
   // Deliberately delayed fake clipboard verifies changing content cannot produce stale success.
   await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(resolve => { window.__resolveReviewCopy = resolve; }) } }); });
   await page.locator('#pl-review-copy').click(); await page.locator('#pl-review-topic').selectOption('costs');
   check(width + ' new prompt unblocks after pending old copy', await page.locator('#pl-review-copy').isEnabled(), true);
   await page.evaluate(() => window.__resolveReviewCopy()); await page.waitForTimeout(40);
   check(width + ' late copy never marks changed content copied', await page.locator('#pl-review-copy').innerText(), '复制提问内容');
   for (const fallback of ['denied', 'absent']) {
    await page.evaluate(mode => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'absent' ? undefined : { writeText: async () => { throw Error('synthetic denial'); } } }); }, fallback);
    await page.locator('#pl-review-copy').click();
    check(width + ' ' + fallback + ' fallback message', (await page.locator('#pl-review-status').innerText()).includes('自动复制不可用'), true);
    check(width + ' ' + fallback + ' fallback selects entire preview', await page.locator('#pl-review-preview').evaluate(el => document.activeElement === el && el.selectionStart === 0 && el.selectionEnd === el.value.length), true);
    check(width + ' ' + fallback + ' fallback permits retry', await page.locator('#pl-review-copy').isEnabled(), true);
   }
   await page.locator('#pl-review-select').click();
   check(width + ' manual select available', (await page.locator('#pl-review-status').innerText()).includes('已选中全文'), true);
   const link = page.locator('#pl-review-open');
   check(width + ' only official fixed webpage', await link.getAttribute('href'), 'https://chat.deepseek.com/');
   check(width + ' safe external target', await link.getAttribute('target'), '_blank');
   check(width + ' no opener/referrer leakage', [await link.getAttribute('rel'), await link.getAttribute('referrerpolicy')], ['noopener noreferrer', 'no-referrer']);
   await ctx.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Synthetic external page</title><p>Mock only. No request to DeepSeek.</p>' }));
   const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]); await popup.waitForLoadState();
   check(width + ' manual link opens only fixed URL without prompt', popup.url(), 'https://chat.deepseek.com/');
   check(width + ' external popup has no opener/referrer', await popup.evaluate(() => window.opener === null && document.referrer === ''), true); await popup.close();
   check(width + ' opening website does not complete local task', await page.getByTestId('web-review').count(), 0);
   await page.locator('.pl-review-help summary').click();
   check(width + ' dark review accessibility', (await new AxeBuilder({ page }).include('#pl-review-dialog').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
   check(width + ' modal horizontal fit', await page.locator('#pl-review-dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
   check(width + ' review actions never write storage', await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), storeBefore);
   if (width === 1440 || width === 390) { await page.locator('#pl-review-dialog').evaluate(el => { el.scrollTop = 0; }); await page.screenshot({ path: path.join(TEMP, 'learning-' + width + '.png') }); }
   if (width === 390) { await page.locator('#pl-review-copy').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(TEMP, 'actions-390.png') }); }
   // A copy that finishes after closing must not poison the next opening.
   await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(resolve => { window.__resolveClosedCopy = resolve; }) } }); });
   await page.locator('#pl-review-copy').click();
   await page.keyboard.press('Escape');
   check(width + ' Escape closes modal', await page.locator('#pl-review-dialog').evaluate(el => el.open), false);
   check(width + ' close returns focus to opener', await page.locator('#pl-open-review').evaluate(el => document.activeElement === el), true);
   await page.locator('#pl-open-review').click();
   check(width + ' closing pending copy resets button', await page.locator('#pl-review-copy').innerText(), '复制提问内容');
   check(width + ' reopening pending copy allows new request', await page.locator('#pl-review-copy').isEnabled(), true);
   await page.evaluate(() => window.__resolveClosedCopy()); await page.waitForTimeout(40);
   check(width + ' closed copy cannot mark reopened preview copied', await page.locator('#pl-review-copy').innerText(), '复制提问内容');
   await page.keyboard.press('Escape');
   await page.locator('#pl-theme-toggle').click(); await page.locator('#pl-open-review').click();
   check(width + ' light review accessibility', (await new AxeBuilder({ page }).include('#pl-review-dialog').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
   if (width === 1440) { await page.locator('#pl-review-dialog').evaluate(el => { el.scrollTop = 0; }); await page.screenshot({ path: path.join(TEMP, 'light-1440.png') }); }
   await page.keyboard.press('Escape'); await page.locator('#pl-theme-toggle').click();
   await page.locator('#pl-review-home-open').click();
   check(width + ' homepage action also works', await page.locator('#pl-review-dialog').evaluate(el => el.open), true);
   await page.locator('#pl-review-evidence').click(); await page.locator('#pl-review-go-lab').click();
   check(width + ' guided path navigates without resetting', await page.evaluate(() => location.hash), '#lab');
   check(width + ' navigation closes modal', await page.locator('#pl-review-dialog').evaluate(el => el.open), false);
   check(width + ' does not auto-start task', await page.getByTestId('learning-workbench').getAttribute('data-state'), 'briefing');
   await launch(page); await page.locator('#pl-open-review').click();
   check(width + ' active search still has no exported results', await page.locator('#pl-review-preview').inputValue(), '');
   await page.keyboard.press('Escape'); await finish(page);
   const source = await page.getByTestId('web-review-preview').inputValue();
   check(width + ' original result still available', source.includes('[F1]'), true);
   await page.getByLabel('2. 用自己的话解释').fill('PRIVATE_E038_FREE_TEXT');
   const storeAtResult = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
   await page.locator('#pl-open-review').click();
   check(width + ' actual evidence is now unlocked', await page.locator('#pl-review-locked').isHidden(), true);
   check(width + ' exact original prompt, not rebuilt facts', await page.locator('#pl-review-preview').inputValue(), source);
   check(width + ' free explanation not exported', (await page.locator('#pl-review-preview').inputValue()).includes('PRIVATE_E038_FREE_TEXT'), false);
   check(width + ' actual result badge', await page.locator('#pl-review-evidence-badge').innerText(), '已有真实证据');
   await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__reviewCopy = text; } } }); });
   await page.locator('#pl-review-copy').click();
   check(width + ' evidence copy byte-equal to source', await page.evaluate(() => window.__reviewCopy), source);
   check(width + ' copied evidence does not modify original save', await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort())), storeAtResult);
   await page.locator('#pl-review-go-original').click();
   await page.waitForFunction(() => document.activeElement === document.querySelector('[data-testid="web-review-preview"]'));
   check(width + ' adjust returns to real original preview', await page.getByTestId('web-review-preview').evaluate(el => document.activeElement === el), true);
   await page.getByRole('radio', { name: /讲清选择规则/ }).check(); await page.getByLabel('复盘回答风格').selectOption('guided');
   const updated = await page.getByTestId('web-review-preview').inputValue();
   await page.locator('#pl-open-review').click();
   check(width + ' original focus/style edits reflected exactly', await page.locator('#pl-review-preview').inputValue(), updated);
   check(width + ' original style really changed', updated.includes('循序引导') && updated.includes('一般原理分开'), true);
   check(width + ' original API stays optional collapsed', await page.getByTestId('api-review-options').getAttribute('open'), null);
   check(width + ' evidence view accessibility', (await new AxeBuilder({ page }).include('#pl-review-dialog').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
   if (width === 1440 || width === 390) { await page.locator('#pl-review-dialog').evaluate(el => { el.scrollTop = 0; }); await page.screenshot({ path: path.join(TEMP, 'evidence-' + width + '.png') }); }
   await page.keyboard.press('Escape');
   await page.getByTestId('open-condition').click(); await page.locator('#pl-open-review').click();
   check(width + ' condition editing withdraws original preview', await page.locator('#pl-review-preview').inputValue(), '');
   check(width + ' condition editing clearly gated', await page.locator('#pl-review-locked').isVisible(), true);
   await page.keyboard.press('Escape'); await page.getByRole('button', { name: '取消，返回复盘', exact: true }).click();
   await page.locator('#pl-open-review').click();
   check(width + ' cancelling condition preserves valid original record', (await page.locator('#pl-review-preview').inputValue()).includes('[F1]'), true);
   await page.keyboard.press('Escape'); await page.getByTestId('mission-L02').click(); await page.locator('#pl-open-review').click();
   check(width + ' mission switch removes previous result', await page.locator('#pl-review-preview').inputValue(), '');
   check(width + ' mission switch returns gate', await page.locator('#pl-review-locked').isVisible(), true);
   check(width + ' no stale copied-result status', (await page.locator('#pl-review-status').innerText()).includes('请先完成'), true);
   await page.keyboard.press('Escape');
   check(width + ' no iframe embedded chat', await page.locator('iframe').count(), 0);
   check(width + ' no automatic external requests', requests, []); check(width + ' no browser errors', errors, []);
   check(width + ' page does not overflow horizontally', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
   await page.evaluate(() => { location.hash = 'intro'; }); await page.locator('#pl-open-review').click();
   check(width + ' header entry also present in original intro station', await page.locator('#pl-review-dialog').evaluate(el => el.open), true);
   // Native modal cycles keyboard focus within itself.
   await page.locator('#pl-review-close').focus(); await page.keyboard.press('Shift+Tab');
   check(width + ' modal traps keyboard focus', await page.locator('#pl-review-dialog').evaluate(el => el.contains(document.activeElement)), true);
   results.push({ width, passed: checks.length - first }); await ctx.close();
  }
  const evidence = { date: '2026-11-15', executor: 'AI', humanLearningValidation: false, physicalDevice: false, browser: browser.version(), offline: true, clipboard: 'synthetic success/denied/absent/pending', externalNavigation: 'manual fixed-URL popup verified with synthetic route; no official login or message sent', target, sha256: sha(), passed: checks.length, results, checks };
  fs.writeFileSync(path.join(ROOT, 'docs/evidence/web-review-entry-20261115.json'), JSON.stringify(evidence, null, 2) + '\n'); console.log(JSON.stringify({ passed: checks.length, results, sha256: evidence.sha256 }, null, 2));
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
