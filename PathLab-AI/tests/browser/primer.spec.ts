import { appUrl } from './helpers';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { buildPrimerTrace, PRIMER_QUIZ } from '../../src/domain/learning/astar-primer';

const trace = buildPrimerTrace();
const axe = async (page: Page) => expect((await new AxeBuilder({ page }).include('#astar-primer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
const noOverflow = async (page: Page) => {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
};

test('a first-time learner can finish the A* primer: compute g/h/f, predict every step and pass the quiz', async ({ page }) => {
  await page.goto(appUrl);
  const primer = page.getByTestId('astar-primer');
  await page.getByRole('link', { name: /第一次学/ }).click();
  await expect(primer.getByRole('heading', { level: 3 })).toHaveText('1. 要解决什么');
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
    if (index === 3) {
      await expect(primer.getByTestId('primer-step-explanation')).toContainText('注意 f 变大了');
      await axe(page);
    }
    if (!step.isGoal) await primer.getByTestId('primer-next-step').click();
  }
  await expect(primer.getByText('挑中的就是终点 G，搜索结束！')).toBeVisible();
  await expect(primer.locator('.primer-cell.is-path')).toHaveCount(trace.path.length);
  await expect(primer.getByText('预测对 7 / 8')).toBeVisible();

  await primer.getByTestId('primer-next-chapter').click();
  for (const question of PRIMER_QUIZ.filter(item => item.stage === 'final')) {
    await primer.getByTestId('primer-' + question.id).getByLabel(question.options[question.answer]!).check();
  }
  await expect(primer.getByTestId('primer-result')).toContainText('小测得分 5 / 5');
  await axe(page); await noOverflow(page);
  await primer.getByRole('button', { name: /去 L03/ }).click();
  await expect(page.getByTestId('mission-L03')).toHaveAttribute('aria-pressed', 'true');
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
