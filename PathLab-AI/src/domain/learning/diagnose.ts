import type { Feedback, FeedbackRequest, SearchEvent } from '../../../contracts/types.ts';
import type { CompletedRun } from './session.ts';

export interface LocalFeedbackResult { request: FeedbackRequest; feedback: Feedback }
const coordinate = (p: { x: number; y: number }): string => '(' + p.x + ',' + p.y + ')';

/** Exact supplied-event resolution, shared by local reporting and future adapters. */
export function assertFeedbackReferences(request: FeedbackRequest, feedback: Feedback): void {
  if (!request.answerRevealed || feedback.hintLevel > request.requestedHintLevel
    || request.facts.correctCount > request.facts.predictionCount) throw new Error('反馈不能越过揭示或提示边界。');
  const events = request.facts.events;
  if (new Set(events.map(e => e.eventId)).size !== events.length) throw new Error('事实事件标识重复。');
  if (feedback.insufficientEvidence && feedback.primaryErrorType !== null) throw new Error('证据不足时不能贴错误标签。');
  if (!feedback.insufficientEvidence && feedback.evidence.length === 0) throw new Error('判断必须有可解析证据。');
  if (feedback.primaryErrorType !== null && !request.facts.candidateErrorTypes.includes(feedback.primaryErrorType)) throw new Error('标签未由本地证据建立。');
  for (const evidence of feedback.evidence) {
    const match = /^\/facts\/events\/(0|[1-9]\d*)\/description$/.exec(evidence.factPath);
    if (!match || events[Number(match[1])]?.eventId !== evidence.eventId) throw new Error('反馈引用与提供的事件不一致。');
  }
}

function describe(event: SearchEvent): FeedbackRequest['facts']['events'][number] | null {
  switch (event.type) {
    case 'prediction_submitted': return { eventId: event.eventId, type: event.type, description: '预测点 ' + event.payload.checkpointId + '：选择 ' + coordinate(event.payload.selected) + '，实际选中 ' + coordinate(event.payload.actual) + '；本次' + (event.payload.correct ? '符合' : '不符合') + '选择规则。提示层级 ' + event.payload.hintLevel + '；重试次数 ' + event.payload.retryCount + '。' };
    case 'run_finished': return { eventId: event.eventId, type: event.type, description: '本次搜索' + (event.payload.status === 'found' ? '找到路径，最短步数 ' + event.payload.metrics.pathLength : '不可达，步数为空') + '；有效选择 ' + event.payload.metrics.selectionCount + '，扩展节点 ' + event.payload.metrics.expandedCount + '。步数和扩展数不是耗时。' };
    case 'counterfactual_applied': return { eventId: event.eventId, type: event.type, description: '相对已完成运行 ' + event.payload.previousRunId + '，' + (event.payload.change.type === 'block_cell' ? '封锁格子 ' : '移动终点到 ') + coordinate(event.payload.change.cell) + '；地图修订 ' + event.payload.previousGridRevision + ' → ' + event.payload.newGridRevision + '，需要重新运行。' };
    default: return null; // Never copy reflection free text into a fact or hypothetical remote request.
  }
}

/** Deterministic observed behavior only. A single A* error does not establish its cause. */
export function buildLocalFeedback(run: CompletedRun): LocalFeedbackResult {
  if (!run.events.some(e => e.type === 'run_finished') || run.events.some(e => e.runId !== run.runId || e.gridRevision !== run.gridRevision || e.algorithm !== run.algorithm)) throw new Error('诊断只接受同一已完成运行的事实。');
  const events = run.events.flatMap(event => { const fact = describe(event); return fact ? [fact] : []; });
  const wrong = run.events.filter(e => e.type === 'prediction_submitted' && !e.payload.correct);
  const observedFifoMismatch = run.algorithm === 'bfs' && wrong.length > 0;
  const request: FeedbackRequest = {
    schemaVersion: 1, levelId: run.events[0]!.levelId, algorithm: run.algorithm, runId: run.runId,
    gridRevision: run.gridRevision, requestedHintLevel: 4, answerRevealed: true,
    facts: { predictionCount: run.predictions.length, correctCount: run.predictions.filter(p => p.correct).length,
      candidateErrorTypes: observedFifoMismatch ? ['misunderstand_queue_order'] : [], events },
  };
  const evidenceIds = observedFifoMismatch ? wrong.map(e => e.eventId) : events.filter(e => e.type === 'run_finished').map(e => e.eventId);
  const feedback: Feedback = {
    schemaVersion: 1, mode: 'local', primaryErrorType: observedFifoMismatch ? 'misunderstand_queue_order' : null,
    summary: observedFifoMismatch ? '观察到 ' + wrong.length + ' 次选择不符合当时 FIFO 队列顺序。这里只描述本次行为，不能据此推断你不懂算法或判断原因。'
      : run.predictions.length === 0 ? '本次运行没有可提交的多候选预测点。保留真实搜索结果，不编造预测或能力判断。'
      : wrong.length > 0 ? '观察到 ' + wrong.length + ' 次 A* 预测与实际选择不同。现有选择不能证明是只看终点距离、忽略路径代价或其他原因；证据不足。'
      : '本次 ' + run.predictions.length + ' 个预测符合选择规则；这不证明已经掌握，仍需条件实验和证据解释。',
    evidence: evidenceIds.slice(0, 12).map(eventId => ({ eventId, factPath: '/facts/events/' + events.findIndex(e => e.eventId === eventId) + '/description' })),
    hintLevel: 4, insufficientEvidence: !observedFifoMismatch,
    nextQuestion: run.algorithm === 'bfs' ? '请用入队序号说明下一次为什么先处理这个节点。改变条件后，路径步数和扩展数会一起增加吗？' : '请依次比较 f、h、入队序号。改变条件后，旧路径是否仍合法，新的搜索证据是什么？',
    recommendation: '比较同算法、单一条件变化的两次实际结果。把路径步数与搜索扩展数分开；引用已揭示事件再写解释。本地规则不会评判自由文本解释是否正确。',
  };
  assertFeedbackReferences(request, feedback);
  return { request, feedback };
}
