/** Local-only E027 gallery/navigation checks. No product regression or uploads. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL, fileURLToPath } = require('node:url');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
assert.equal(path.parse(root).root.toUpperCase(), 'D:' + path.sep);
process.env.TEMP = process.env.TMP = path.join(root, '.cache', 'tmp');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(root, '.cache', 'playwright');
const { chromium } = require(path.join(root, 'PathLab-AI/node_modules/@playwright/test'));
const delivery = path.join(root, 'delivery/PathLab-AI-参赛整理-20261025');
const unpacked = path.join(delivery, '04-完整材料解压版');
const folder = path.join(unpacked, '05-Prompt证据/历史照片补充');
const gallery = path.join(folder, '00-照片索引.html');
const photos = JSON.parse(fs.readFileSync(path.join(folder, '照片清单.json'), 'utf8'));
const output = path.join(root, 'docs/evidence/submission-prompt-photos-browser-20261025.json');
const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');
const previews = [];
const result = { executor: 'AI / headless installed Edge', actualBrowserVersion: null,
  simulatedViewports: [], photoCount: photos.count, galleryLocalLinksChecked: 0,
  originalImageHashesChecked: 0, navigation: [], pageErrors: [], externalRequests: [],
  savedCheckImages: 0, screenshotBuffersOnly: process.argv.includes('--screenshots'),
  productRegressionRerun: false, humanOrPhysicalDeviceAcceptance: false, publicationPerformed: false };
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    result.actualBrowserVersion = browser.version();
    const context = await browser.newContext();
    context.on('request', request => {
      if (/^https?:/i.test(request.url())) result.externalRequests.push(request.url());
    });
    const page = await context.newPage();
    page.on('pageerror', error => result.pageErrors.push(String(error)));
    for (const r of photos.photos) {
      assert.equal(sha(fs.readFileSync(path.join(root, r.source))), r.sha256);
      assert.equal(sha(fs.readFileSync(path.join(folder, r.filename))), r.sha256);
      result.originalImageHashesChecked++;
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1100 : 844 });
      await page.goto(pathToFileURL(gallery).href);
      await page.waitForFunction(() => document.images.length === 10 && [...document.images].every(im => im.complete && im.naturalWidth > 0));
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        images: [...document.images].map(im => ({ filename: decodeURIComponent(im.getAttribute('src')), width: im.naturalWidth, height: im.naturalHeight })),
        links: [...document.querySelectorAll('a[href]')].map(a => a.href),
        scripts: document.scripts.length,
      }));
      assert.equal(state.overflow, false);
      assert.equal(state.scripts, 0);
      assert.deepEqual(state.images, photos.photos.map(r => ({ filename: r.filename, width: r.width, height: r.height })));
      for (const href of state.links) {
        const url = new URL(href);
        assert.equal(url.protocol, 'file:');
        assert.ok(fs.statSync(fileURLToPath(url)).isFile(), href);
        if (url.hash) assert.equal(await page.locator(url.hash).count(), 1);
      }
      result.galleryLocalLinksChecked += state.links.length;
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('a').first().evaluate(el => document.activeElement === el), true);
      await page.getByRole('navigation').getByRole('link', { name: '01', exact: true }).click();
      assert.equal(new URL(page.url()).hash, '#photo-01');
      result.simulatedViewports.push({ width, allTenImagesDecoded: true, naturalSizesMatchOriginal: true,
        noHorizontalOverflow: true, keyboardFirstLink: true, indexAnchorWorks: true });
      if (process.argv.includes('--screenshots')) {
        if (width === 1440) await page.evaluate(() => scrollTo(0, 0));
        const image = await page.screenshot({ type: 'png' });
        previews.push({ name: `gallery-${width}`, base64: image.toString('base64') });
      }
      for (const entry of [path.join(delivery, '00-提交说明.html'), path.join(unpacked, '00-评审入口.html')]) {
        await page.goto(pathToFileURL(entry).href);
        const link = page.getByRole('link').filter({ hasText: 'Prompt 历史照片 · 10 张' });
        assert.equal(await link.count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await link.click();
        assert.equal(fileURLToPath(new URL(page.url())), gallery);
        await page.waitForFunction(() => [...document.images].every(im => im.complete && im.naturalWidth > 0));
        result.navigation.push({ entry: path.relative(delivery, entry), width, photoCardCount: 1, navigatesToLocalGallery: true });
      }
    }
    // The first full-size link really opens the original JPEG in a separate local tab.
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: '查看原尺寸照片', exact: true }).first().click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.equal(fileURLToPath(new URL(popup.url())), path.join(folder, photos.photos[0].filename));
    await popup.close();
    result.originalSizeLinkOpened = true;
    assert.deepEqual(result.pageErrors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
    fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', 'utf8');
    console.log(JSON.stringify({ result, previews }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
