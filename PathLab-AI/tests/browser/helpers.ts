/** Deterministic AI test interactions, not observations from a human learner. */
import { expect, type Page } from '@playwright/test';
import type { Algorithm, LevelDefinition } from '../../contracts/types';
import type { SearchInput } from '../../src/domain/grid';
import { runBfs } from '../../src/domain/algorithms/bfs';
import { runAstar } from '../../src/domain/algorithms/astar';

export const workbench = (page: Page) => page.getByTestId('learning-workbench');
export const engine = (input: SearchInput, algorithm: Algorithm) => (algorithm === 'bfs' ? runBfs : runAstar)(input);
export function changedInput(level: LevelDefinition): SearchInput {
  const input: SearchInput = structuredClone({ grid: level.grid, start: level.start, goal: level.goal });
  const { type, cell: { x, y } } = level.counterfactual;
  if (type === 'move_goal') return { ...input, goal: { x, y } };
  const rows = [...input.grid.rows]; rows[y] = rows[y]!.slice(0, x) + '#' + rows[y]!.slice(x + 1);
  return { ...input, grid: { ...input.grid, rows } };
}
export async function answer(page: Page, input: SearchInput, algorithm: Algorithm, wrong = false) {
  const ordinal = Number(await page.getByTestId('selection-count').innerText());
  const actual = engine(input, algorithm).events.filter(e => e.type === 'node_selected')[ordinal]!.payload.node;
  const choice = wrong ? page.locator('[data-testid^="candidate-"]').filter({ hasNotText: '(' + actual.x + ', ' + actual.y + ')' }).first() : page.getByTestId('candidate-' + actual.x + '-' + actual.y);
  await choice.click(); await page.getByTestId('submit-prediction').click();
}
export async function finish(page: Page, input: SearchInput, algorithm: Algorithm) {
  for (let n = 0; n < 100; n++) {
    const state = await workbench(page).getAttribute('data-state');
    if (state === 'reflection') return;
    if (state === 'prediction') await answer(page, input, algorithm);
    else { expect(state).toBe('paused'); await page.getByTestId('step').click(); }
  }
  throw new Error('Fixed-map browser replay did not terminate');
}
export async function launch(page: Page, level: LevelDefinition, algorithm: Algorithm) {
  await page.goto('/'); await page.getByTestId('mission-' + level.id).click();
  await page.getByLabel('本关算法').selectOption(algorithm);
  await page.getByRole('button', { name: '开始预测' }).click();
}
export async function noOverflow(page: Page) {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
}
