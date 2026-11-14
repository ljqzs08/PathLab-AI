/** AI browser checks for the v4 click-through stations; not human or physical-device acceptance. */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { appUrl, at, noOverflow } from './helpers';
import { runAstar } from '../../src/domain/algorithms/astar';
import { DRAW_LEVELS, QUICK_ROUNDS, quickAnswer } from '../../src/domain/game';

const axe = async (page: Page, station: string) => {
  const result = await new AxeBuilder({ page }).include('#view-' + station).include('.station-nav').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
};
const next = (page: Page, station: string) => page.locator('#view-' + station).getByTestId('station-next').click();

test('home explains A* first, lists eight clickable stations and only the current station is shown', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.getByTestId('naiwa').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A* 是什么');
  await expect(page.locator('.intro-description')).toContainText('g（已经走了几步）');
  await expect(page.locator('.route-card')).toHaveCount(8);
  await expect(page.getByTestId('learning-workbench')).toHaveCount(0);
  await page.getByTestId('route-video').click();
  await expect(page).toHaveURL(/#video$/);
  await expect(page.getByTestId('view-home')).toBeHidden();
  await expect(page.getByTestId('nav-video')).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page.getByTestId('view-home')).toBeVisible();
  await axe(page, 'home'); await noOverflow(page);
});

test('life station: navigation phrases map to g/h/f and the guide walks with A*', async ({ page }) => {
  await page.goto(at('life'));
  for (const [phrase, letter] of [['已行驶', 'g'], ['预计剩余', 'h'], ['全程约', 'f']] as const) {
    await page.getByRole('group', { name: new RegExp(phrase) }).getByRole('button', { name: letter, exact: true }).click();
  }
  await expect(page.getByTestId('nav-match')).toContainText('g 管过去，h 看未来');
  await page.locator('[data-testid="town-grid"] [data-tile="1,1"]').click();
  await expect(page.getByTestId('walker')).toContainText('那是房子');
  await page.locator('[data-testid="town-grid"] [data-tile="11,7"]').click();
  await expect(page.getByTestId('walker').locator('.stat-row')).toContainText('18 步');
  await expect(page.locator('[data-tile="11,7"] img')).toHaveCount(1);
  await axe(page, 'life'); await noOverflow(page);
});

test('pictures station gates each infographic behind a check question and zooms images', async ({ page }) => {
  await page.goto(at('pictures'));
  await expect(page.getByTestId('slide-next')).toBeDisabled();
  await page.getByRole('button', { name: /放大查看/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '关闭' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: '起点和终点', exact: true }).click();
  await expect(page.getByTestId('slide-io')).toContainText('正确答案是“最终的路线”');
  await page.getByTestId('slide-next').click();
  await page.getByRole('button', { name: '左（f=7）' }).click();
  await page.getByTestId('slide-next').click();
  await expect(page.getByTestId('slide-formula')).toContainText('容易看错');
  await page.getByRole('button', { name: '5', exact: true }).click();
  await expect(page.getByTestId('slide-formula')).toContainText('h = 5');
  await axe(page, 'pictures'); await noOverflow(page);
});

test('video station plays the embedded lesson and the learner fills the same table', async ({ page }) => {
  await page.goto(at('video'));
  const video = page.getByTestId('lesson-video');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(1);
  expect(Math.round(await video.evaluate(element => (element as HTMLVideoElement).duration))).toBe(196);
  await page.getByRole('button', { name: /最终路径 S→B→D→T/ }).click();
  await expect.poll(() => video.evaluate(element => Math.floor((element as HTMLVideoElement).currentTime))).toBeGreaterThanOrEqual(144);
  await video.evaluate(element => (element as HTMLVideoElement).pause());
  const lab = page.getByTestId('graph-lab');
  const values: Record<string, [number, number]> = { A: [1, 11], B: [4, 6], C: [5, 10], D: [6, 7], T: [9, 9] };
  await lab.getByRole('button', { name: /^S（/ }).click();
  for (const pick of ['B', 'D', 'T', null]) {
    while (await lab.getByTestId('graph-fill').count()) {
      const form = lab.getByTestId('graph-fill');
      const id = (await form.locator('label').first().innerText()).trim()[0]!;
      await form.getByLabel(id + ' 的 g =').fill(String(values[id]![0]));
      await form.getByLabel(id + ' 的 f =').fill(String(id === 'B' ? 99 : values[id]![1]));
      await form.getByRole('button', { name: '检查' }).click();
      if (id === 'B') await expect(lab.getByTestId('graph-feedback')).toContainText('正确答案：B 的 g = 0（S 的 g）+ 4');
    }
    if (pick) await lab.getByRole('button', { name: new RegExp('^' + pick + '（') }).click();
  }
  await expect(lab.getByTestId('graph-done')).toContainText('S → B → D → T，总长度 9');
  await expect(lab.getByTestId('graph-done')).toContainText('8 / 9');
  await axe(page, 'video'); await noOverflow(page);
});

test('game station: three levels unlock in order and the certificate links to the workbench', async ({ page }) => {
  await page.goto(at('game'));
  await expect(page.getByTestId('level-quiz')).toBeDisabled();
  for (const level of DRAW_LEVELS) {
    for (const node of runAstar(level.input).path.slice(1)) await page.locator('[data-testid="draw-grid"] [data-tile="' + node.x + ',' + node.y + '"]').click();
    await expect(page.getByTestId('draw-result')).toContainText('最短 ' + runAstar(level.input).metrics.pathLength + ' 步');
    await expect(page.getByTestId('draw-result').locator('.stars')).toHaveText('★★★');
    await page.getByTestId('draw-next').click();
  }
  for (const [index, round] of QUICK_ROUNDS.entries()) {
    await page.getByTestId('quiz').locator('.choice').nth(index === 0 ? (quickAnswer(round) + 1) % 3 : quickAnswer(round)).click();
    await page.getByTestId('quiz-next').click();
  }
  await expect(page.getByTestId('quiz-result').locator('.stars')).toHaveText('★★☆');
  await page.getByTestId('level-design').click();
  await expect(page.getByTestId('designer-submit')).toBeDisabled();
  for (const [x, y] of [[6, 2], [6, 3], [6, 4], [5, 2], [5, 4], [7, 3]]) await page.locator('[data-testid="designer-grid"] [data-tile="' + x + ',' + y + '"]').click();
  await expect(page.getByTestId('designer-walls')).toHaveText('6 / 6');
  await page.locator('[data-testid="designer-grid"] [data-tile="1,1"]').click();
  await expect(page.getByTestId('designer')).toContainText('墙用完啦');
  await expect(page.getByTestId('designer-expanded')).toHaveText('22 格');
  await axe(page, 'game'); await noOverflow(page);
  await page.getByTestId('designer-submit').click();
  await page.getByTestId('level-badge').click();
  await expect(page.getByTestId('certificate')).toContainText('13 / 15 ★');
  await page.getByRole('button', { name: /去任务工作台/ }).click();
  await expect(page).toHaveURL(/#lab$/);
  await expect(page.getByTestId('learning-workbench')).toBeVisible();
});

test('pager walks every station in order and keeps earlier progress when returning', async ({ page }) => {
  await page.goto(at('pictures'));
  await page.getByRole('button', { name: '最终的路线' }).click();
  for (const [from, to] of [['pictures', 'video'], ['video', 'primer'], ['primer', 'game'], ['game', 'lab'], ['lab', 'playground']] as const) {
    await next(page, from);
    await expect(page).toHaveURL(new RegExp('#' + to + '$'));
    await expect(page.locator('#view-' + to)).toBeFocused();
  }
  await page.getByTestId('nav-pictures').click();
  await expect(page.getByTestId('slide-io')).toContainText('答对了');
  await expect(page.locator('.station-progress')).toContainText('已到过 6 / 8 站');
});

test('intro station teaches A* one page at a time and defines g, h and f before using them', async ({ page }) => {
  await page.goto(appUrl);
  await page.getByTestId('start-journey').click();
  await expect(page).toHaveURL(/#intro$/);
  await expect(page.getByTestId('intro-step-1')).toContainText('算出一条最短的路线');
  await page.getByTestId('intro-next').click();
  await expect(page.getByTestId('intro-next')).toBeDisabled();
  await page.locator('[data-testid="intro-grid"] [data-tile="3,2"]').click();
  await expect(page.getByTestId('intro-step-2')).toContainText('这是墙');
  await page.locator('[data-testid="intro-grid"] [data-tile="0,2"]').click();
  await page.locator('[data-testid="intro-grid"] [data-tile="6,2"]').click();
  await page.getByTestId('intro-next').click();
  await page.getByRole('button', { name: '8 步', exact: true }).click();
  await expect(page.getByTestId('intro-step-3')).toContainText('一格一格地试');
  await page.getByTestId('intro-next').click();
  await page.getByTestId('intro-wave').click();
  await expect(page.getByTestId('intro-step-4')).toContainText('试了 30 个格子');
  await page.getByTestId('intro-next').click();
  await expect(page.getByTestId('intro-step-5')).not.toContainText('g =');
  await page.getByRole('button', { name: '1 步', exact: true }).click();
  await page.getByRole('button', { name: '5 步', exact: true }).click();
  await page.getByTestId('intro-next').click();
  await expect(page.getByTestId('intro-step-6')).toContainText('已经走了几步');
  await page.getByTestId('intro-f').fill('7');
  await page.getByRole('button', { name: '检查' }).click();
  await expect(page.getByTestId('intro-step-6')).toContainText('还不对');
  await page.getByTestId('intro-f').fill('8');
  await page.getByRole('button', { name: '检查' }).click();
  await expect(page.getByTestId('intro-step-6')).toContainText('f = 1 + 7 = 8');
  await page.getByTestId('intro-next').click();
  await page.locator('[data-testid="intro-grid"] [data-tile="1,2"]').click();
  await expect(page.getByTestId('intro-step-7')).toContainText('答对了');
  await page.getByTestId('intro-next').click();
  await page.getByTestId('intro-walk').click();
  await expect(page.getByTestId('intro-step-8')).toContainText('只试了 8 个格子');
  await page.getByTestId('intro-next').click();
  await axe(page, 'intro'); await noOverflow(page);
  await page.getByTestId('glossary-open').click();
  await expect(page.getByRole('dialog', { name: '名词小词典' })).toContainText('估计还要几步');
  await page.getByRole('button', { name: '知道了' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByTestId('intro-finish').click();
  await expect(page).toHaveURL(/#life$/);
});

test('the Naiwa desktop-pet helper gives station-specific hints, can be dragged and opens the glossary', async ({ page }) => {
  await page.goto(at('intro'));
  const pet = page.getByTestId('naiwa-pet-button');
  await expect(pet).toHaveAttribute('aria-expanded', 'false');
  await pet.click();
  const bubble = page.getByTestId('naiwa-pet-bubble');
  await expect(bubble).toContainText('“下一页”按钮才会亮');
  await page.getByTestId('naiwa-pet-more').click();
  await expect(bubble).toContainText('S 是绿色格子');
  await page.getByTestId('nav-game').click();
  await expect(bubble).toContainText('画路线');
  await bubble.getByRole('button', { name: '查名词小词典' }).click();
  await expect(page.getByRole('dialog', { name: '名词小词典' })).toBeVisible();
  await page.getByRole('button', { name: '知道了' }).click();
  await page.getByRole('button', { name: '收起提示', exact: true }).click();
  await expect(bubble).toHaveCount(0);
  const before = (await pet.boundingBox())!;
  await page.mouse.move(before.x + 30, before.y + 30);
  await page.mouse.down();
  await page.mouse.move(before.x - 60, before.y - 80, { steps: 6 });
  await page.mouse.up();
  const after = (await pet.boundingBox())!;
  expect(before.x - after.x).toBeGreaterThan(50);
  expect(before.y - after.y).toBeGreaterThan(50);
  await expect(pet).toHaveAttribute('aria-expanded', 'false');
  await axe(page, 'game');
});
