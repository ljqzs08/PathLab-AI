import type { Position } from '../../../contracts/types.ts';
import { comparePriority } from '../algorithms/priorityQueue.ts';

/**
 * v3 learning loop for the A* primer: a pre-test and a parallel post-test, per-rule misconception
 * diagnosis, and a step-by-step "how A* decides" trace. Every answer that involves choosing a cell is
 * computed with the engine's own comparePriority, never hand-written.
 */

export type Concept = 'score' | 'estimate' | 'lowest_f' | 'tie_h' | 'tie_sequence';
/** Why a learner picked a different cell than A*, named after the rule they skipped. */
export type Misconception = 'greedy_h' | 'only_g' | 'f_compare' | 'tie_h' | 'tie_sequence';

interface Ranked { node?: Position; g: number; h: number; f: number; entrySequence: number }

/** chapter = primer chapter to revisit (0 pre-test, 1–5 lessons, 6 post-test and report). */
export const CONCEPTS: Record<Concept, { name: string; chapter: number }> = {
  score: { name: '会算 f = g + h', chapter: 3 },
  estimate: { name: '知道 h 是不看墙的估计', chapter: 3 },
  lowest_f: { name: '先挑 f 最小的格子', chapter: 4 },
  tie_h: { name: 'f 打平时比 h', chapter: 4 },
  tie_sequence: { name: 'f、h 都打平时比加入顺序', chapter: 5 },
};

export const MISCONCEPTIONS: Record<Misconception, { name: string; advice: string; chapter: number }> = {
  greedy_h: { name: '只看 h（谁离终点近就选谁）', advice: '离终点近不等于整趟短：h 小的格子可能已经走了很多步。A* 看的是 f = g + h 两个数加起来。', chapter: 3 },
  only_g: { name: '只看 g（谁走得少就选谁）', advice: '只看已走步数就退化成 BFS，会一圈圈乱试。A* 还要加上 h，偏向朝终点走。', chapter: 3 },
  f_compare: { name: 'f 算错或比错', advice: '先给每个格子把 g 和 h 加起来，再找最小的那个。可以在纸上写下每个 f。', chapter: 3 },
  tie_h: { name: 'f 打平时没有再比 h', advice: 'f 一样时不是随便选：再比 h，h 小的离终点更近，先选它。', chapter: 4 },
  tie_sequence: { name: 'f、h 都打平时没比加入顺序', advice: 'f 和 h 都一样时，选更早加入清单的那个（加入编号更小）。', chapter: 5 },
};

const ordered = <T extends Ranked>(cells: readonly T[]) => [...cells].sort(comparePriority);

/** Names the rule a wrong pick skipped. Returns null when the pick is what A* would choose. */
export function classifyMistake<T extends Ranked>(candidates: readonly T[], picked: T): Misconception | null {
  const winner = ordered(candidates)[0]!;
  if (winner === picked) return null;
  if (picked.f === winner.f) return picked.h === winner.h ? 'tie_sequence' : 'tie_h';
  // picked.f > winner.f, so the pick cannot beat the winner on both g and h: name the one it chased.
  if (picked.h < winner.h) return 'greedy_h';
  if (picked.g < winner.g) return 'only_g';
  return 'f_compare';
}

export type StageRule = 'only' | 'f' | 'h' | 'sequence';
export interface DecisionStage<T> { rule: StageRule; best: number; keep: T[]; out: T[] }

/** How A* narrows the open list to one cell: smallest f, then smallest h, then earliest entry. */
export function decisionStages<T extends Ranked>(open: readonly T[]): DecisionStage<T>[] {
  if (open.length === 0) throw new Error('Open list is empty.');
  if (open.length === 1) return [{ rule: 'only', best: open[0]!.f, keep: [...open], out: [] }];
  const stages: DecisionStage<T>[] = [];
  let pool = [...open];
  for (const [rule, value] of [['f', (c: T) => c.f], ['h', (c: T) => c.h], ['sequence', (c: T) => c.entrySequence]] as const) {
    const best = Math.min(...pool.map(value));
    const keep = pool.filter(cell => value(cell) === best);
    stages.push({ rule, best, keep, out: pool.filter(cell => value(cell) !== best) });
    pool = keep;
    if (pool.length === 1) break;
  }
  return stages;
}

export interface TestCandidate extends Ranked { label: string }
interface ItemBase { id: string; concept: Concept; prompt: string }
export interface PickItem extends ItemBase { kind: 'pick'; candidates: readonly TestCandidate[] }
export interface ChoiceItem extends ItemBase { kind: 'choice'; options: readonly string[]; answer: number; explanation: string }
export type TestItem = PickItem | ChoiceItem;

const cand = (label: string, g: number, h: number, entrySequence: number): TestCandidate => ({ label, g, h, f: g + h, entrySequence });
const pickPrompt = '待选清单里有三个格子（只给 g 和 h，f 要你自己算）。A* 下一个选谁？';

/** Two parallel forms: same five concepts, different numbers. Neither form shows f, so learners must add g + h. */
export const PRE_TEST: readonly TestItem[] = [
  { id: 'pre-score', kind: 'choice', concept: 'score', prompt: '某个格子已经走了 g=4 步，估计还剩 h=5 步。它的 f 是多少？', options: ['20', '9', '1', '5'], answer: 1, explanation: 'f = g + h = 4 + 5 = 9。' },
  { id: 'pre-lowest', kind: 'pick', concept: 'lowest_f', prompt: pickPrompt, candidates: [cand('A', 3, 4, 1), cand('B', 6, 2, 2), cand('C', 2, 7, 3)] },
  { id: 'pre-tie-h', kind: 'pick', concept: 'tie_h', prompt: pickPrompt, candidates: [cand('A', 4, 4, 1), cand('B', 6, 2, 2), cand('C', 3, 6, 3)] },
  { id: 'pre-tie-seq', kind: 'pick', concept: 'tie_sequence', prompt: pickPrompt + '（编号是加入清单的先后，#1 最早。）', candidates: [cand('A', 4, 5, 2), cand('B', 5, 3, 3), cand('C', 5, 3, 1)] },
  { id: 'pre-estimate', kind: 'choice', concept: 'estimate', prompt: '某个格子的 h=3，但它和终点之间隔着一堵墙。从它走到终点，真实需要几步？', options: ['正好 3 步', '一定少于 3 步', '至少 3 步，可能更多'], answer: 2, explanation: 'h 按横竖格数直接数，不考虑墙；遇到墙要绕路，真实步数只会 ≥ h。' },
];

export const POST_TEST: readonly TestItem[] = [
  { id: 'post-score', kind: 'choice', concept: 'score', prompt: '某个格子已经走了 g=6 步，估计还剩 h=2 步。它的 f 是多少？', options: ['12', '4', '8', '3'], answer: 2, explanation: 'f = g + h = 6 + 2 = 8，表示“经过这个格子，整趟大约 8 步”。' },
  { id: 'post-lowest', kind: 'pick', concept: 'lowest_f', prompt: pickPrompt, candidates: [cand('A', 7, 1, 1), cand('B', 2, 8, 2), cand('C', 4, 3, 3)] },
  { id: 'post-tie-h', kind: 'pick', concept: 'tie_h', prompt: pickPrompt, candidates: [cand('A', 6, 3, 1), cand('B', 5, 4, 2), cand('C', 2, 8, 3)] },
  { id: 'post-tie-seq', kind: 'pick', concept: 'tie_sequence', prompt: pickPrompt + '（编号是加入清单的先后，#1 最早。）', candidates: [cand('A', 3, 6, 3), cand('B', 6, 2, 1), cand('C', 6, 2, 2)] },
  { id: 'post-estimate', kind: 'choice', concept: 'estimate', prompt: 'A* 用 h 估计剩余步数时，会不会把墙考虑进去？', options: ['会，h 已经把绕墙算好了', '不会，h 按横竖格数直接数，真实步数只会 ≥ h', '只考虑一半的墙'], answer: 1, explanation: 'h = 横向差 + 纵向差，假装没有墙。所以它是“乐观的估计”，真实剩余只会更多或相等。' },
];

export const answerIndex = (item: TestItem) => item.kind === 'choice' ? item.answer : item.candidates.indexOf(ordered(item.candidates)[0]!);
export const optionLabels = (item: TestItem) => item.kind === 'choice' ? [...item.options] : item.candidates.map(c => c.label + '：已走 g=' + c.g + '，估计剩 h=' + c.h + '，加入 #' + c.entrySequence);

export function explainItem(item: TestItem): string {
  if (item.kind === 'choice') return item.explanation;
  const winner = ordered(item.candidates)[0]!;
  const fs = item.candidates.map(c => c.label + ' 的 f=' + c.g + '+' + c.h + '=' + c.f).join('，');
  const stages = decisionStages(item.candidates);
  const last = stages.at(-1)!.rule;
  const why = last === 'f' ? winner.label + ' 的 f 最小' : last === 'h' ? 'f 打平，再比 h：' + winner.label + ' 的 h=' + winner.h + ' 最小' : 'f、h 都打平，比加入顺序：' + winner.label + ' 是 #' + winner.entrySequence + '，最早加入';
  return fs + '。' + why + '，所以选 ' + winner.label + '。';
}

export interface ItemResult { id: string; concept: Concept; correct: boolean; misconception: Misconception | null }
export function gradeItem(item: TestItem, picked: number): ItemResult {
  const correct = picked === answerIndex(item);
  const misconception = item.kind === 'pick' && !correct ? classifyMistake(item.candidates, item.candidates[picked]!) : null;
  return { id: item.id, concept: item.concept, correct, misconception };
}

export type ConceptStatus = 'kept' | 'learned' | 'review' | 'slipped' | 'untested';
export interface MasteryReport {
  pre: number | null;
  post: number;
  total: number;
  concepts: { concept: Concept; name: string; chapter: number; pre: boolean | null; post: boolean; status: ConceptStatus }[];
  walk: { correct: number; total: number };
  misconceptions: { type: Misconception; count: number; name: string; advice: string; chapter: number }[];
  seconds: number | null;
}

/** Combines pre-test, walk-through predictions and post-test into one honest self-check. */
export function buildReport(pre: readonly ItemResult[] | null, post: readonly ItemResult[], walk: readonly (Misconception | null)[], seconds: number | null): MasteryReport {
  const counts = new Map<Misconception, number>();
  for (const type of [...walk, ...post.map(item => item.misconception)]) if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  const concepts = (Object.keys(CONCEPTS) as Concept[]).map(concept => {
    const before = pre?.find(item => item.concept === concept)?.correct ?? null;
    const after = post.find(item => item.concept === concept)?.correct ?? false;
    const status: ConceptStatus = before === null ? (after ? 'kept' : 'review') : before && after ? 'kept' : after ? 'learned' : before ? 'slipped' : 'review';
    return { concept, ...CONCEPTS[concept], pre: before, post: after, status };
  });
  return {
    pre: pre ? pre.filter(item => item.correct).length : null,
    post: post.filter(item => item.correct).length,
    total: post.length,
    concepts,
    walk: { correct: walk.filter(item => item === null).length, total: walk.length },
    misconceptions: [...counts].map(([type, count]) => ({ type, count, ...MISCONCEPTIONS[type] })).sort((a, b) => b.count - a.count),
    seconds,
  };
}

export function reportText(report: MasteryReport): string {
  const mark = (value: boolean | null) => value === null ? '—' : value ? '✓' : '✗';
  return [
    'PathLab AI · A* 入门自测记录（本机生成，不代表长期掌握）',
    '学前测 ' + (report.pre === null ? '未做' : report.pre + '/' + report.total) + ' → 学后测 ' + report.post + '/' + report.total,
    '逐轮预测 ' + report.walk.correct + '/' + report.walk.total + (report.seconds === null ? '' : '；用时 ' + Math.floor(report.seconds / 60) + ' 分 ' + (report.seconds % 60) + ' 秒'),
    ...report.concepts.map(item => '· ' + item.name + '：学前 ' + mark(item.pre) + ' 学后 ' + mark(item.post)),
    report.misconceptions.length ? '误区：' + report.misconceptions.map(item => item.name + ' ×' + item.count).join('；') : '误区：未发现',
  ].join('\n');
}
