/** Limited offline smoke check of an extracted submission packet; not product acceptance. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
function inside(value) {
  const full = path.resolve(value);
  assert(full.toLowerCase().startsWith(ROOT.toLowerCase() + path.sep));
  assert(full.toUpperCase().startsWith('D:\\'));
  return full;
}
const HTML = inside(process.argv[2] || '');
assert.equal(path.basename(HTML), 'PathLab AI.html');
const TEMP = inside(path.join(ROOT, '.cache', 'submission-smoke-20261025'));
fs.mkdirSync(TEMP, { recursive: true });
process.env.TEMP = process.env.TMP = TEMP;
process.env.PLAYWRIGHT_BROWSERS_PATH = inside(path.join(ROOT, '.cache', 'playwright'));
const { chromium } = require(path.join(ROOT, 'PathLab-AI/node_modules/@playwright/test'));
const DEST = inside(path.join(ROOT, 'docs/evidence/submission-packet-browser-smoke-20261025.json'));
async function finish(page) {
  for (let n = 0; n < 180; n++) {
    const state = await page.getByTestId('learning-workbench').getAttribute('data-state');
    if (state === 'reflection') return;
    if (state === 'prediction') {
      await page.locator('[data-testid^="candidate-"]').first().click();
      await page.getByTestId('submit-prediction').click();
    } else if (state === 'paused') await page.getByTestId('step').click();
    else throw Error('Unexpected learning state ' + state);
  }
  throw Error('L01 did not reach reflection');
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 720 }, { width: 768, height: 1024 }]) {
      const context = await browser.newContext({ viewport, locale: 'zh-CN', reducedMotion: 'reduce' });
      try {
        const page = await context.newPage();
        const errors = [], external = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('request', r => { if (/^https?:/i.test(r.url())) external.push(r.url()); });
        await page.goto(pathToFileURL(HTML).href, { waitUntil: 'load' });
        await page.getByTestId('learning-workbench').waitFor();
        await page.getByRole('button', { name: '开始预测', exact: true }).click();
        await finish(page);
        const result = {
          viewport,
          finalState: await page.getByTestId('learning-workbench').getAttribute('data-state'),
          pathLength: (await page.getByTestId('path-length').innerText()).trim(),
          expandedCount: (await page.getByTestId('expanded-count').innerText()).trim(),
          horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          pageErrors: errors, externalRequests: external
        };
        assert.equal(result.finalState, 'reflection');
        assert.equal(result.pathLength, '6');
        assert.equal(result.expandedCount, '22');
        assert.equal(result.horizontalOverflow, false);
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        results.push(result);
      } finally { await context.close(); }
    }
    const landing = path.join(ROOT, 'delivery/PathLab-AI-参赛整理-20261025/00-提交说明.html');
    const navigation = [];
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'zh-CN' });
      try {
        const page = await context.newPage();
        await page.goto(pathToFileURL(landing).href, { waitUntil: 'load' });
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('script').count(), 0);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(overflow, false);
        const screenshot = inside(path.join(TEMP, `landing-${width}.png`));
        await page.screenshot({ path: screenshot, fullPage: true });
        navigation.push({ width, horizontalOverflow: overflow, links: await page.locator('a').count(), screenshot });
      } finally { await context.close(); }
    }
    const report = {
      checkedAt: new Date().toISOString(), executor: 'AI via Playwright / headless Microsoft Edge',
      source: HTML, sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(HTML)).digest('hex'),
      scope: 'Four simulated viewports, L01 first-candidate prediction to reflection; two local navigation layouts',
      cases: results, navigation, passed: true,
      humanOrPhysicalDeviceAcceptance: false, fullProductRegressionRerun: false,
      externalDeepSeekUsed: false, publicationOrSubmission: false,
      temporaryScreenshotPolicy: 'Inspect only, then delete; official archived evidence images are retained'
    };
    fs.writeFileSync(DEST, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });