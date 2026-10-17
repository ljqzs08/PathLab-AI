/** AI-executed browser checks; imported text is synthetic and is not human evidence. */
import { test, expect, type Page, type Download } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixtures from '../../fixtures/levels.json' with { type: 'json' };
import type { LevelDefinition } from '../../contracts/types';
import { PROGRESS_KEY } from '../../src/domain/learning/progress-store';
import { appUrl, launch, answer, finish, noOverflow, workbench } from './helpers';
const levels = fixtures as LevelDefinition[];
const raw = (page: Page) => page.evaluate(key => localStorage.getItem(key)!, PROGRESS_KEY);
const openTools = (page: Page) => page.getByTestId('progress-panel').locator('summary').click();
async function upload(page: Page, text: string, name = 'test.json') { await page.getByLabel('选择 JSON 存档').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) }); }
async function downloaded(download: Download): Promise<string> { const stream = await download.createReadStream(); if (!stream) throw new Error('missing download'); const chunks: Buffer[] = []; for await (const part of stream) chunks.push(Buffer.from(part)); return Buffer.concat(chunks).toString('utf8'); }
for (const level of levels) for (const algorithm of level.algorithms) {
  test(level.id + ' ' + algorithm + ' refresh preserves the unanswered gate, hint and first result without a future answer', async ({ page }) => {
    await launch(page, level, algorithm); await page.getByRole('button', { name: '规则提示 0/3' }).click();
    const selected = await page.getByTestId('selection-count').innerText(), candidates = await page.locator('[data-testid^="candidate-"]').allTextContents();
    await expect(page.getByTestId('save-status')).toContainText('已自动保存'); const saved = JSON.parse(await raw(page));
    expect(saved.sessions.find((s: {levelId: string}) => s.levelId === level.id)).not.toHaveProperty('trace');
    await page.reload(); await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
    await expect(page.getByLabel('本关算法')).toHaveValue(algorithm); await expect(page.getByTestId('selection-count')).toHaveText(selected);
    expect(await page.locator('[data-testid^="candidate-"]').allTextContents()).toEqual(candidates);
    await expect(page.getByRole('button', { name: '规则提示 1/3' })).toBeVisible(); await expect(page.getByTestId('prediction-feedback')).toHaveCount(0);
    await expect(page.getByTestId('submit-prediction')).toBeDisabled(); await expect(page.getByTestId('step')).toBeDisabled();
    await answer(page, level, algorithm, true); await expect(page.getByTestId('first-attempt-stats')).toContainText('0/1');
    await page.reload(); await expect(page.getByTestId('first-attempt-stats')).toContainText('0/1'); await noOverflow(page);
  });
}

test('running checkpoint restores paused at the same revealed prefix, including playback speed', async ({ page }) => {
  await launch(page, levels[0]!, 'bfs'); await answer(page, levels[0]!, 'bfs');
  const selected = await page.getByTestId('selection-count').innerText(), saved = JSON.parse(await raw(page));
  saved.sessions[0].commands.push({ kind: 'action', action: { type: 'play', speed: 2 }, at: new Date().toISOString() });
  await page.evaluate(({key, value}) => localStorage.setItem(key, value), {key:PROGRESS_KEY, value:JSON.stringify(saved)});
  await page.reload(); await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
  await expect(page.getByLabel('回放速度')).toHaveValue('2'); await page.waitForTimeout(1100);
  await expect(page.getByTestId('selection-count')).toHaveText(selected); await expect(workbench(page)).toHaveAttribute('data-state', 'paused');
});

test('report history survives reset/refresh and JSON export can be previewed then deliberately reimported', async ({ page }) => {
  await launch(page, levels[0]!, 'bfs'); await finish(page, levels[0]!, 'bfs');
  await page.locator('input[data-fact-type="run_finished"]').check(); await page.getByLabel('2. 用自己的话解释').fill('合成恢复检查：报告解释保存为纯文本。');
  await page.getByTestId('generate-report').click(); await page.getByRole('button', {name:'重置当前任务'}).click(); await page.reload();
  await page.getByTestId('report-history').locator('summary').click(); await expect(page.getByTestId('historical-explanation')).toHaveText('合成恢复检查：报告解释保存为纯文本。');
  await openTools(page); const downloadEvent=page.waitForEvent('download'); await page.getByTestId('export-progress').click(); const exported=await downloaded(await downloadEvent);
  expect(JSON.parse(exported).schemaVersion).toBe(1); await page.getByTestId('mission-L02').click(); await upload(page, exported);
  await expect(page.getByTestId('progress-preview')).toContainText('校验通过，尚未导入'); await expect(page.getByTestId('mission-title')).toHaveText(levels[1]!.title);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]); await noOverflow(page);
  await page.getByTestId('confirm-progress').click(); await expect(page.getByTestId('mission-title')).toHaveText(levels[0]!.title);
  await page.reload(); await page.getByTestId('report-history').locator('summary').click(); await expect(page.getByTestId('historical-explanation')).toHaveText('合成恢复检查：报告解释保存为纯文本。');
});

test('invalid/oversized/versioned/forged imports leave current memory and browser save unchanged', async ({page}) => {
  await launch(page,levels[0]!,'bfs'); await openTools(page); const before=await raw(page), version=JSON.parse(before), forged=JSON.parse(before);
  version.schemaVersion=999; forged.sessions[0].commands.push({kind:'action',at:new Date().toISOString(),action:{type:'step'}});
  for (const bad of ['{broken', ' '.repeat(1024*1024+1), JSON.stringify(version), JSON.stringify(forged), '<script>window.__pathlabBad=true</script>']) {
    await upload(page,bad); await expect(page.getByTestId('progress-error')).toBeVisible(); await expect(page.getByTestId('progress-preview')).toHaveCount(0);
    expect(await raw(page)).toBe(before); await expect(workbench(page)).toHaveAttribute('data-state','prediction');
  }
  expect(await page.evaluate(()=>Object.hasOwn(window,'__pathlabBad'))).toBe(false); await noOverflow(page);
});

test('corrupt browser save is retained and can be backed up before explicit replacement; cancellation changes nothing', async ({page}) => {
  await page.addInitScript(key=>{localStorage.setItem(key,'{original-corrupt');localStorage.setItem('unrelated','keep');},PROGRESS_KEY);
  await page.goto(appUrl); await expect(page.getByTestId('save-status')).toContainText('原始数据已保留');
  await page.getByTestId('mission-L02').click(); expect(await raw(page)).toBe('{original-corrupt'); await openTools(page);
  const downloadEvent=page.waitForEvent('download'); await page.getByRole('button',{name:'下载浏览器原始存档'}).click(); expect(await downloaded(await downloadEvent)).toBe('{original-corrupt');
  await page.getByRole('button',{name:'用当前进度覆盖存档'}).click(); await page.getByRole('button',{name:'取消，保留现状'}).click(); expect(await raw(page)).toBe('{original-corrupt');
  await page.getByRole('button',{name:'用当前进度覆盖存档'}).click(); await page.getByTestId('confirm-progress').click();
  expect(JSON.parse(await raw(page)).selectedId).toBe('L02'); expect(await page.evaluate(()=>localStorage.getItem('unrelated'))).toBe('keep');
  await expect(page.getByTestId('save-status')).toContainText('已自动保存'); await noOverflow(page);
});

test('disabled storage remains usable in memory and gives a backup warning instead of success', async ({page}) => {
  await page.addInitScript(key=>{const original=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===key)throw new DOMException('blocked','SecurityError');return original.call(this,k);};},PROGRESS_KEY);
  await launch(page,levels[0]!,'bfs'); await expect(workbench(page)).toHaveAttribute('data-state','prediction'); await expect(page.getByTestId('save-status')).toContainText('存储不可用');
  await page.getByRole('button',{name:'规则提示 0/3'}).click(); await expect(page.getByRole('button',{name:'规则提示 1/3'})).toBeVisible();
});

test('quota failure retains core interactions and the old browser value', async ({page}) => {
  await page.addInitScript(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('full','QuotaExceededError');return original.call(this,k,v);};},PROGRESS_KEY);
  await launch(page,levels[0]!,'bfs'); await expect(page.getByTestId('save-status')).toContainText('保存失败'); await expect(workbench(page)).toHaveAttribute('data-state','prediction');
  expect(await raw(page)).toBeNull(); await answer(page,levels[0]!,'bfs'); await expect(page.getByTestId('prediction-feedback')).toBeVisible();
});

test('a second tab cannot be silently overwritten and reloading its version requires confirmation', async ({page,context}) => {
  await page.goto(appUrl); await page.getByTestId('mission-L02').click(); const second=await context.newPage(); await second.goto(appUrl); await second.getByTestId('mission-L03').click();
  const other=await raw(second); await page.getByTestId('mission-L04').click(); await expect(page.getByTestId('save-status')).toContainText('其他页面修改'); expect(await raw(page)).toBe(other);
  await openTools(page); await page.getByRole('button',{name:'重新读取浏览器存档'}).click(); await expect(page.getByTestId('mission-title')).toHaveText(levels[3]!.title);
  await page.getByTestId('confirm-progress').click(); await expect(page.getByTestId('mission-title')).toHaveText(levels[2]!.title); expect(await raw(page)).toBe(other); await second.close();
});
