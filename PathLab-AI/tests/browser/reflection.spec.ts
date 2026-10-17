/** AI-executed browser verification; text here is synthetic, never human study data. */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixtures from '../../fixtures/levels.json' with { type: 'json' };
import type { LevelDefinition } from '../../contracts/types';
import { launch, finish, changedInput, engine, noOverflow, workbench } from './helpers';

const levels = fixtures as LevelDefinition[];
for (const level of levels) for (const algorithm of level.algorithms) {
  test(level.id + ' ' + algorithm + ' changes one real condition, gates a new run and cites exact before/after results', async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await launch(page, level, algorithm); await finish(page, level, algorithm);
    await expect(page.getByTestId('local-feedback')).toContainText('规则模板 · 未调用模型');
    await expect(page.getByTestId('condition-comparison')).toHaveCount(0);
    await expect(page.getByTestId('generate-report')).toBeDisabled();
    await page.getByTestId('open-condition').click();
    await expect(workbench(page)).toHaveAttribute('data-state', 'counterfactual');
    await page.getByTestId('apply-condition').click();
    await expect(workbench(page)).toHaveAttribute('data-state', 'briefing');
    await expect(page.getByLabel('本关算法')).toBeDisabled();
    await expect(page.getByTestId('first-attempt-stats')).toContainText('1 次完整运行');
    const input = changedInput(level), cell = level.counterfactual.cell;
    await expect(page.getByTestId('map-grid').locator('[data-cell="' + cell.x + ',' + cell.y + '"]')).toHaveAttribute('data-kind', level.counterfactual.type === 'block_cell' ? 'wall' : 'goal');
    await expect(page.getByTestId('path-length')).toHaveText('未揭示');
    await expect(page.locator('[data-event-type="run_finished"]')).toHaveCount(0);
    await page.getByRole('button', { name: '开始预测' }).click();
    await expect(workbench(page)).toHaveAttribute('data-state', 'prediction');
    await expect(page.getByTestId('step')).toBeDisabled();
    await expect(page.getByTestId('path-length')).toHaveText('未揭示');
    await finish(page, input, algorithm);
    const before = engine(level, algorithm), after = engine(input, algorithm);
    for (const [id, value] of [['comparison-before-path',before.metrics.pathLength],['comparison-after-path',after.metrics.pathLength],['comparison-before-expanded',before.metrics.expandedCount],['comparison-after-expanded',after.metrics.expandedCount]] as const) await expect(page.getByTestId(id)).toHaveText(String(value));
    await expect(page.getByTestId('first-attempt-stats')).toContainText('2 次完整运行');
    await expect(page.getByTestId('first-attempt-stats')).toContainText('4/4');
    const explanation = '合成测试解释：仅修改一个条件，路径步数与扩展节点数分别核对，不把扩展数当作耗时。';
    await page.locator('input[data-fact-type="counterfactual_applied"]').check();
    await page.locator('input[data-fact-type="run_finished"]').check();
    await page.getByLabel('2. 用自己的话解释').fill(explanation);
    await page.getByTestId('generate-report').click();
    await expect(workbench(page)).toHaveAttribute('data-state','report');
    await expect(page.getByTestId('reflection-report')).toContainText('复盘记录齐备');
    await expect(page.getByTestId('report-explanation')).toHaveText(explanation);
    await expect(page.getByTestId('reflection-report')).toContainText('不代表已掌握');
    await page.getByTestId('open-condition').click();
    await expect(page.getByTestId('apply-condition')).toBeDisabled();
    await page.getByRole('button',{name:'取消，返回复盘'}).click();
    await expect(workbench(page)).toHaveAttribute('data-state','reflection');
    await page.getByText('查看已生成的本次报告快照',{exact:true}).click();
    await expect(page.getByTestId('report-explanation')).toHaveText(explanation);
    await page.getByRole('button',{name:'重置当前任务'}).click();
    await expect(page.getByTestId('map-grid').locator('[data-cell="' + cell.x + ',' + cell.y + '"]')).toHaveAttribute('data-kind', level.grid.rows[cell.y]![cell.x] === '#' ? 'wall' : 'road');
    await expect(page.getByTestId('first-attempt-stats')).toContainText('4/4');
    const history = page.getByTestId('report-history');
    await history.locator('summary').click();
    await expect(history.getByTestId('historical-explanation')).toHaveText(explanation);
    await expect(history.getByTestId('historical-report')).toContainText('复盘记录齐备');
    await noOverflow(page); expect(errors).toEqual([]);
  });
}

test('changed briefing can reset without starting a forced extra run', async ({ page }) => {
  const level=levels[0]!; await launch(page,level,'bfs');await finish(page,level,'bfs');
  await page.getByTestId('open-condition').click();await page.getByTestId('apply-condition').click();
  await expect(page.getByRole('button',{name:'重置当前任务'})).toBeEnabled();
  await page.getByRole('button',{name:'重置当前任务'}).click();
  await expect(page.getByLabel('本关算法')).toBeEnabled();
  await expect(page.getByTestId('first-attempt-stats')).toContainText('1 次完整运行');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('2/2');
});

test('partial report is honest, free text is inert, drafts survive experiment cancel and reports survive task switching', async ({ page }) => {
  const level=levels[1]!;await launch(page,level,'astar');await finish(page,level,'astar');
  const text='<script>window.reflectionScriptExecuted=true</script> 合成解释';
  const textarea=page.getByLabel('2. 用自己的话解释');
  await textarea.fill(text);await textarea.press('End');await textarea.press('Space');await textarea.press('ArrowLeft');
  await expect(textarea).toHaveValue(text+' ');await expect(workbench(page)).toHaveAttribute('data-state','reflection');
  await page.locator('input[data-fact-type="run_finished"]').check();
  await page.getByTestId('open-condition').click();await page.getByTestId('condition-panel').press('Escape');
  await expect(textarea).toHaveValue(text+' ');await expect(page.locator('input[data-fact-type="run_finished"]')).toBeChecked();
  await page.getByTestId('generate-report').click();
  await expect(page.getByTestId('reflection-report')).toContainText('部分记录 · 复盘未齐备');
  await expect(page.getByTestId('report-explanation')).toHaveText(text);
  expect(await page.evaluate(()=> 'reflectionScriptExecuted' in window)).toBe(false);
  await expect(page.getByTestId('local-feedback')).not.toContainText(text);
  await page.getByTestId('mission-L01').click();await page.getByTestId('mission-L02').click();
  await expect(workbench(page)).toHaveAttribute('data-state','report');await expect(page.getByTestId('report-explanation')).toHaveText(text);
  await page.reload();await expect(workbench(page)).toHaveAttribute('data-state','briefing');
  await expect(page.getByTestId('first-attempt-stats')).toContainText('0/0');
});

test('reflection condition and report pass automated WCAG checks without remote traffic or storage writes', async ({ page }) => {
  const external:string[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const origin=new URL(route.request().url()).origin;if(origin==='http://127.0.0.1:3210')return route.continue();external.push(origin);return route.abort();});
  await page.addInitScript(()=>{Storage.prototype.setItem=function(key){throw new Error('Unexpected storage write: '+key);};});
  const check=async()=>{const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);await noOverflow(page);};
  const level=levels[2]!;await launch(page,level,'astar');await finish(page,level,'astar');await check();
  await page.getByTestId('open-condition').click();await check();await page.getByTestId('apply-condition').click();
  await page.getByRole('button',{name:'开始预测'}).click();await finish(page,changedInput(level),'astar');await check();
  await page.getByTestId('partial-report').click();await check();
  await expect(page.getByTestId('reflection-report')).toContainText('部分记录');
  await expect(page.getByTestId('reflection-report')).toContainText('尚无证据解释');
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});expect(external).toEqual([]);expect(errors).toEqual([]);
});


test('new reflection states keep keyboard focus within the viewport', async ({ page }) => {
  const level = levels[0]!;
  const visibleFocus = async () => {
    await expect(page.locator('#reflection-title')).toBeFocused();
    await expect.poll(() => page.locator('#reflection-title').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    })).toBe(true);
  };
  await launch(page, level, 'bfs'); await finish(page, level, 'bfs'); await visibleFocus();
  await page.getByTestId('open-condition').click(); await visibleFocus();
  await page.getByTestId('condition-panel').press('Escape'); await visibleFocus();
  await page.getByTestId('partial-report').click(); await visibleFocus();
  await noOverflow(page);
});
