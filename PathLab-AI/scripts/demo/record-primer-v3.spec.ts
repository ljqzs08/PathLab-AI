/**
 * Scripted product demo, not a learner observation: an AI-driven browser walks the v3 primer
 * (pre-test, thinking stream, post-test, mastery report) with on-screen captions for the video.
 */
import { test, type Locator, type Page } from '@playwright/test';
import { buildPrimerTrace } from '../../src/domain/learning/astar-primer';
import { POST_TEST, PRE_TEST, answerIndex, optionLabels, type TestItem } from '../../src/domain/learning/mastery';

const trace = buildPrimerTrace();
const wait = (page: Page, ms: number) => page.waitForTimeout(ms);

async function caption(page: Page, text: string, card = false) {
  await page.evaluate(([value, full]) => {
    let box = document.getElementById('demo-caption');
    if (!box) {
      box = document.createElement('div');
      box.id = 'demo-caption';
      document.body.append(box);
    }
    box.textContent = value;
    box.style.cssText = full
      ? 'position:fixed;inset:0;z-index:99;display:grid;place-items:center;padding:0 12vw;background:#0b141c;color:#fff;font:600 46px/1.6 "Noto Sans CJK SC",sans-serif;text-align:center;white-space:pre-line;pointer-events:none'
      : 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99;max-width:80vw;padding:12px 26px;border-radius:12px;background:rgba(8,16,22,.88);border:1px solid #85e3cd;color:#fff;font:500 26px/1.5 "Noto Sans CJK SC",sans-serif;white-space:pre-line;pointer-events:none';
    box.hidden = value === '';
  }, [text, card] as const);
}
const focus = (target: Locator) => target.evaluate(node => node.scrollIntoView({ behavior: 'smooth', block: 'center' }));
async function answer(page: Page, item: TestItem, correct: boolean) {
  const labels = optionLabels(item);
  const row = page.getByTestId('primer-item-' + item.id);
  await focus(row); await wait(page, 400);
  await row.getByLabel(labels[correct ? answerIndex(item) : (answerIndex(item) + 1) % labels.length]!, { exact: true }).check();
  await wait(page, 600);
}

test('record v3 primer demo', async ({ page }) => {
  await page.goto(process.env.PATHLAB_TEST_URL!);
  await page.addStyleTag({ content: 'html{scroll-behavior:smooth}' });
  await caption(page, 'v3 更新\n先测一遍 → 学 → 再测一遍\n让“学会了没有”看得见', true);
  await wait(page, 3000);
  await caption(page, '');
  const primer = page.getByTestId('astar-primer');
  await page.getByRole('link', { name: /第一次学/ }).click();
  await wait(page, 900);
  await caption(page, '第 1 章 学前测：5 题，考 5 个知识点；不会就猜，不公布答案');
  for (const item of PRE_TEST) await answer(page, item, item.concept === 'score' || item.concept === 'estimate');
  await focus(primer.getByTestId('primer-finish-pre')); await wait(page, 400);
  await primer.getByTestId('primer-finish-pre').click();
  await caption(page, '前测 2 / 5：作为对比基线，先不讲答案'); await wait(page, 1800);
  await primer.getByTestId('primer-start-learning').click();
  await focus(primer.locator('.primer-chapters'));
  await caption(page, '第 2–5 章：要解决什么 → BFS 水波 → 给格子打分 → 挑选规则'); await wait(page, 1500);
  await primer.getByTestId('primer-next-chapter').click();
  await primer.getByRole('button', { name: '播放水波' }).click(); await wait(page, 2800);
  for (let n = 0; n < 3; n++) { await primer.getByTestId('primer-next-chapter').click(); await wait(page, 900); }
  await focus(primer.locator('.primer-body'));
  await caption(page, '第 6 章：先猜 A* 挑哪个格子，再看它的思考过程逐条浮现'); await wait(page, 1800);

  for (const [index, step] of trace.steps.entries()) {
    if (step.reason !== 'only') {
      const target = index === 3 ? step.open.find(cell => cell.node.x !== step.selected.node.x || cell.node.y !== step.selected.node.y)! : step.selected;
      if (index === 3) await caption(page, '这一轮故意猜错，看看系统怎么诊断');
      await wait(page, 400);
      await primer.locator('button[data-primer-cell="' + target.node.x + ',' + target.node.y + '"]').click(); await wait(page, 400);
      await primer.getByTestId('primer-reveal').click();
    }
    if (index === 1) await caption(page, '比 f → f 打平比 h → 都平比加入先后；被淘汰的格子在地图上同步变灰');
    await focus(primer.getByTestId('primer-thinking')); await wait(page, index === 3 ? 3000 : 1900);
    if (index === 3) {
      await caption(page, '猜错被归类为误区「f 打平时没有再比 h」，并给出回看哪一章');
      await focus(primer.getByTestId('primer-walk-misconception')); await wait(page, 2800);
    }
    if (index === 4) await caption(page, '');
    if (step.isGoal) { await caption(page, '挑中终点，路线倒推完成'); await focus(primer.locator('.primer-map')); await wait(page, 1800); break; }
    await primer.getByTestId('primer-next-step').click();
    await focus(primer.locator('.primer-progress')); await wait(page, 400);
  }

  await primer.getByTestId('primer-next-chapter').click();
  await focus(primer.locator('.primer-compare').first());
  await caption(page, '第 7 章：BFS 处理 29 格，A* 只处理 8 格；然后做学后测（同样 5 个知识点、换了数字）'); await wait(page, 2100);
  for (const item of POST_TEST) await answer(page, item, item.concept !== 'tie_sequence');
  await caption(page, '学后测逐题讲解，答错时直接给出 f = g + h 的计算'); await wait(page, 1200);
  await focus(primer.getByTestId('primer-finish-post')); await wait(page, 400);
  await primer.getByTestId('primer-finish-post').click();
  const report = primer.getByTestId('primer-report');
  await report.evaluate(node => node.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  await caption(page, '掌握度报告：学前 2/5 → 学后 4/5，逐知识点对比，薄弱项一键回看'); await wait(page, 3100);
  await focus(report.locator('.primer-misconceptions'));
  await caption(page, '误区来自逐轮预测和学后测，按跳过的规则归类'); await wait(page, 2400);
  await report.getByText('导出这份记录').click();
  await focus(report.getByTestId('primer-report-text'));
  await caption(page, '可导出文字记录：真人新手测试可直接留存客观数据'); await wait(page, 2800);
  await caption(page, 'PathLab AI v3\n所有答案由站内真实 A* 优先规则算出\n报告只在本机生成，不上传', true);
  await wait(page, 2700);
});
