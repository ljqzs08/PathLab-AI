import { appUrl } from './helpers';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { buildPrimerTrace } from '../../src/domain/learning/astar-primer';
import { POST_TEST, PRE_TEST, answerIndex, decisionStages, optionLabels, type TestItem } from '../../src/domain/learning/mastery';

const trace = buildPrimerTrace();
const axe = async (page: Page) => expect((await new AxeBuilder({ page }).include('#astar-primer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
const pick = async (page: Page, item: TestItem, correct: boolean) => {
  const labels = optionLabels(item);
  const index = correct ? answerIndex(item) : (answerIndex(item) + 1) % labels.length;
  await page.getByTestId('primer-item-' + item.id).getByLabel(labels[index]!, { exact: true }).check();
};
const noOverflow = async (page: Page) => {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
};

test('a first-time learner takes the pre-test, learns, watches A* think, and gets a pre/post mastery report', async ({ page }) => {
  await page.goto(appUrl);
  const primer = page.getByTestId('astar-primer');
  await page.getByRole('link', { name: /第一次学/ }).click();
  await expect(primer.getByRole('heading', { level: 3 })).toHaveText('1. 学前测');
  // Pre-test: only the score and estimate items right, no answers revealed.
  for (const item of PRE_TEST) await pick(page, item, item.concept === 'score' || item.concept === 'estimate');
  await expect(primer.locator('.primer-test .primer-explain')).toHaveCount(0);
  await axe(page); await noOverflow(page);
  await primer.getByTestId('primer-finish-pre').click();
  await expect(primer.getByText('前测已交卷')).toContainText('2 / 5');
  await primer.getByTestId('primer-start-learning').click();
  await expect(primer.getByRole('heading', { level: 3 })).toHaveText('2. 要解决什么');
  await primer.getByRole('button', { name: '8 步' }).click();
  await expect(primer.getByText('对！')).toBeVisible();
  await axe(page); await noOverflow(page);

  await primer.getByTestId('primer-next-chapter').click();
  await primer.getByRole('button', { name: '播放水波' }).click();
  await expect(primer.getByText('BFS 一共处理了 ' + trace.bfs.expandedCount + ' 个格子')).toBeVisible();
  await expect(primer.locator('.primer-cell.is-wave')).toHaveCount(trace.bfs.selectionCount);
  await axe(page);

  await primer.getByTestId('primer-next-chapter').click();
  const answer = async (label: RegExp, value: string) => { await primer.getByLabel(label).fill(value); await primer.getByRole('button', { name: '检查' }).last().click(); };
  await answer(/① g/, '4');
  await expect(primer.getByText('还不对')).toBeVisible();
  await answer(/① g/, '3');
  await answer(/② h/, '5');
  await answer(/③ f/, '8');
  await expect(primer.getByText('为什么 h 只是“估计”？')).toBeVisible();
  await expect(primer.locator('[data-primer-cell="2,1"]')).toHaveAccessibleName(/g=3 h=5 f=8/);
  await axe(page);

  await primer.getByTestId('primer-next-chapter').click();
  await primer.getByTestId('primer-q-lowest').getByLabel('C，因为它 f 最小').check();
  await expect(primer.getByTestId('primer-q-lowest')).toContainText('答对了');
  await primer.getByTestId('primer-next-chapter').click();

  for (const [index, step] of trace.steps.entries()) {
    if (step.reason !== 'only') {
      const wrong = step.open.find(cell => cell.node.x !== step.selected.node.x || cell.node.y !== step.selected.node.y)!;
      const target = index === 3 ? wrong : step.selected;
      await primer.locator('button[data-primer-cell="' + target.node.x + ',' + target.node.y + '"]').click();
      await primer.getByTestId('primer-reveal').click();
    }
    await expect(primer.getByTestId('primer-step-explanation')).toContainText('A* 挑中 (' + step.selected.node.x + ',' + step.selected.node.y + ')');
    const stages = decisionStages(step.open);
    await expect(primer.getByTestId('primer-thinking').locator('.primer-stream-row')).toHaveCount(stages.length);
    await expect(primer.locator('.primer-cell.is-dropped')).toHaveCount(stages.flatMap(stage => stage.out).length - (index === 3 ? 1 : 0));
    if (index === 3) {
      await expect(primer.getByTestId('primer-step-explanation')).toContainText('注意 f 变大了');
      await expect(primer.getByTestId('primer-walk-misconception')).toContainText('f 打平时没有再比 h');
      await expect(primer.getByTestId('primer-thinking')).toContainText('第 3 关：f、h 都打平，比加入清单的先后');
      await axe(page);
    }
    if (!step.isGoal) await primer.getByTestId('primer-next-step').click();
  }
  await expect(primer.getByText('挑中的就是终点 G，搜索结束！')).toBeVisible();
  await expect(primer.locator('.primer-cell.is-path')).toHaveCount(trace.path.length);
  await expect(primer.getByText('预测对 7 / 8')).toBeVisible();

  await expect(primer.getByText('已记录 1 次误区')).toBeVisible();

  await primer.getByTestId('primer-next-chapter').click();
  // Post-test: everything right except the f/h/order tie, which then shows up as a misconception.
  for (const item of POST_TEST) await pick(page, item, item.concept !== 'tie_sequence');
  await expect(primer.getByTestId('primer-item-post-tie-seq')).toContainText('答错了');
  await expect(primer.getByTestId('primer-item-post-lowest')).toContainText('C 的 f 最小，所以选 C');
  await primer.getByTestId('primer-finish-post').click();
  const report = primer.getByTestId('primer-report');
  await expect(report).toContainText('学前答对 2 题，学完答对 4 题，净增 2 题');
  await expect(report.getByRole('row', { name: /先挑 f 最小的格子/ })).toContainText('学会了');
  await expect(report.getByRole('row', { name: /f、h 都打平时比加入顺序/ })).toContainText('还要再看');
  await expect(report).toContainText('f 打平时没有再比 h ×1');
  await report.getByText('导出这份记录').click();
  await expect(report.getByTestId('primer-report-text')).toContainText('学前测 2/5 → 学后测 4/5');
  await expect(report.getByTestId('primer-report-text')).toContainText('逐轮预测 7/8');
  await axe(page); await noOverflow(page);
  await primer.getByRole('button', { name: /去 L03/ }).click();
  await expect(page.getByTestId('mission-L03')).toHaveAttribute('aria-pressed', 'true');
});

test('a learner can skip the pre-test; the report then says there is no baseline and links back to weak chapters', async ({ page }) => {
  await page.goto(appUrl);
  const primer = page.getByTestId('astar-primer');
  await primer.getByTestId('primer-skip-pre').click();
  await expect(primer.getByRole('heading', { level: 3 })).toHaveText('2. 要解决什么');
  await primer.getByRole('button', { name: /对比 · 学后测/ }).click();
  for (const item of POST_TEST) await pick(page, item, item.concept !== 'tie_h');
  await primer.getByTestId('primer-finish-post').click();
  const report = primer.getByTestId('primer-report');
  await expect(report).toContainText('你跳过了学前测');
  await expect(report.getByRole('row', { name: /f 打平时比 h/ })).toContainText('还要再看');
  await report.getByRole('row', { name: /f 打平时比 h/ }).getByRole('button', { name: '回看第 5 章' }).click();
  await expect(primer.getByRole('heading', { level: 3 })).toHaveText('5. 挑选规则');
  await axe(page); await noOverflow(page);
});

test('mission predictions explain the real choice with numbers instead of a generic hint', async ({ page }) => {
  await page.goto(appUrl);
  await page.getByTestId('mission-L03').click();
  await page.getByRole('button', { name: '开始预测' }).click();
  await expect(page.getByText('看不懂这些数字？')).toBeVisible();
  await expect(page.getByTestId('prediction-panel')).toContainText('已走 g');
  await page.locator('[data-testid^="candidate-"]').first().click();
  await page.getByTestId('submit-prediction').click();
  await expect(page.getByTestId('prediction-reason')).toContainText(/f|对：/);
});
