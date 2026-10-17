import type { FeedbackRequest } from '../../../contracts/types.ts';
import type { RunComparison } from './report.ts';

export const webReviewChoices = [
  { id: 'prediction', title: '看懂预测偏差', description: '从实际选择出发，找到下一次该观察什么。' },
  { id: 'algorithm', title: '讲清选择规则', description: '用本次证据解释 BFS 或 A*，不虚构对比。' },
  { id: 'experiment', title: '拆解条件实验', description: '比较同算法、单一条件变化前后的真实结果。' },
] as const;
export type WebReviewFocus = typeof webReviewChoices[number]['id'];
export type WebReviewDetail = 'brief' | 'guided';
const length = (value: number | null) => value === null ? '不可达 / 无步数' : `${value} 步`;

/** Only a matching completed comparison may be exported. No stale-run facts. */
export function hasWebComparison(request: FeedbackRequest, comparison: RunComparison | null): comparison is RunComparison {
  return !!comparison && comparison.current.runId === request.runId
    && comparison.current.gridRevision === request.gridRevision
    && comparison.previous.gridRevision < comparison.current.gridRevision
    && request.facts.events.some(e => e.type === 'run_finished' && e.eventId === comparison.current.evidenceEventId)
    && request.facts.events.some(e => e.type === 'counterfactual_applied' && e.eventId === comparison.changeEventId);
}

/** Local, deterministic prompt preparation. No network, storage or free-text explanation. */
export function buildWebReviewPrompt(request: FeedbackRequest, options: { focus: WebReviewFocus; detail: WebReviewDetail }, comparison: RunComparison | null = null): string {
  if (!request.answerRevealed || !request.facts.events.some(e => e.type === 'run_finished')) throw new Error('只能整理本次已完成并揭示的搜索事实。');
  const paired = hasWebComparison(request, comparison);
  const facts = request.facts.events.filter(e => e.type === 'prediction_submitted' || e.type === 'run_finished');
  const focus = {
    prediction: '围绕预测与实际选择的差异，说明下一次应观察的候选信息；如果全部符合规则或没有预测，不要编造错误。',
    algorithm: '解释当前算法的选择规则，将已记录的事实和一般原理分开。不把单次运行说成 BFS 与 A* 的实测比较。',
    experiment: '比较同一算法在单一条件变化前后的路径步数与扩展节点数；没有完整对照就明确证据不足，不编造差值。',
  }[options.focus];
  const lines = [
    '你是一位算法学习教练。请根据下列已揭示事实帮助我复盘，而不是替我评分。',
    '【本次问题】', focus,
    options.detail === 'brief' ? '回答方式：简明复盘，约 200–350 字；依次给出观察、解释和一个练习问题。' : '回答方式：循序引导，约 400–600 字；先提一个思考问题，再分开解释已知事实、可能原因和下一步练习。',
    '【判断边界】',
    `引用 ${paired ? '[F编号] 或 [C1]' : '[F编号]'} 支持事实判断；没有提供完整地图、队列快照或另一算法的运行结果，不得补写它们。`,
    '预测偏差不能直接证明错误原因，更不能作为能力或心理标签。路径步数和扩展节点数不是耗时；不要声称速度或学习成效。',
    '一般算法知识请标为“原理说明”；新练习请标为“建议”，不要伪装成本次发生过的事件。不确定时明确说明。',
    '【本次事实】',
    `关卡：${request.levelId}；算法：${request.algorithm === 'bfs' ? 'BFS（FIFO 队列）' : 'A*（f = g + h）'}；地图修订：${request.gridRevision}。`,
    `已提交预测 ${request.facts.predictionCount} 次，其中 ${request.facts.correctCount} 次符合当时选择规则。这不是掌握程度评分。`,
    ...facts.map((fact, index) => `[F${index + 1}] ${fact.description}`),
    '【同算法条件对照】',
  ];
  if (paired) {
    const { change, previous, current } = comparison;
    lines.push(`[C1] 仅${change.type === 'block_cell' ? '封锁格子' : '移动终点到'} (${change.cell.x},${change.cell.y})，算法保持一致。`,
      `上次（修订 ${previous.gridRevision}）：最短路径 ${length(previous.metrics.pathLength)}；扩展节点 ${previous.metrics.expandedCount}。`,
      `本次（修订 ${current.gridRevision}）：最短路径 ${length(current.metrics.pathLength)}；扩展节点 ${current.metrics.expandedCount}。`);
  } else lines.push('缺少完整的前后对照，不能判断条件变化的效果；请建议我先完成一次单因素实验。');
  lines.push('【来源说明】', '以上由 PathLab AI 在本机从确定性搜索记录整理。没有包含我的自由文本解释、完整存档、账号或密钥。你的回答需由我返回网站逐项核对，不自动进入评分或学习报告。');
  return lines.join('\n');
}
