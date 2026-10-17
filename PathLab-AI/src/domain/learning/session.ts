import type { Algorithm, Candidate, Counterfactual, DeterministicEvent, EventPayloadMap, LearningState, LevelDefinition, Metrics, SearchEvent } from '../../../contracts/types.ts';
import { runBfs } from '../algorithms/bfs.ts';
import { runAstar } from '../algorithms/astar.ts';
import { assertSearchInput, isWalkable } from '../grid.ts';
import { buildLocalFeedback, type LocalFeedbackResult } from './diagnose.ts';
import { compareRuns, createReflectionReport, type ReflectionReport, type RunComparison } from './report.ts';
import type { SearchInput } from '../grid.ts';

type Speed = 0.5 | 1 | 2 | 4;
type Prediction = EventPayloadMap['prediction_submitted'];
type EnvelopeInput = { [K in keyof EventPayloadMap]: { type: K; payload: EventPayloadMap[K] } }[keyof EventPayloadMap];
export type LearningAction =
  | { type: 'start_valid_run'; runId: string; sessionId: string }
  | { type: 'submit_valid_choice'; selected: Candidate['node']; elapsedBucket: Prediction['elapsedBucket'] }
  | { type: 'request_hint' } | { type: 'step' } | { type: 'tick' }
  | { type: 'play'; speed: Speed } | { type: 'pause'; reason?: 'user' | 'restore' } | { type: 'reset_task' }
  | { type: 'experiment' } | { type: 'cancel' } | { type: 'apply_valid_change'; change: Counterfactual }
  | { type: 'complete_reflection'; explanation: string; evidenceEventIds: string[] };
export type SessionCommand = { kind: 'configure'; algorithm: Algorithm } | { kind: 'action'; action: LearningAction; at: string };
export interface SessionCheckpoint { levelId: string; initialAlgorithm: Algorithm; commands: SessionCommand[] }
export interface CompletedRun {
  runId: string; gridRevision: number; algorithm: Algorithm; input: SearchInput;
  outcome: 'found' | 'unreachable'; metrics: Metrics; predictions: Prediction[]; events: SearchEvent[];
}
export interface LearningView {
  state: LearningState; levelId: string; algorithm: Algorithm; runId: string | null; sessionId: string | null; gridRevision: number;
  input: SearchInput; events: SearchEvent[]; frontier: EventPayloadMap['frontier_snapshot']['nodes'];
  nodes: EventPayloadMap['node_discovered'][]; expanded: Candidate['node'][];
  current: EventPayloadMap['node_selected'] | null; path: Candidate['node'][]; pathFinal: boolean;
  metrics: Metrics; outcome: 'found' | 'unreachable' | null;
  checkpoint: { id: string; prompt: string; candidates: Candidate[]; hintLevel: 0 | 1 | 2 | 3; hint: string | null } | null;
  lastPrediction: Prediction | null; predictions: Prediction[]; skippedCheckpoints: string[];
  firstAttempts: { total: number; correct: number }; completedRuns: CompletedRun[]; speed: Speed;
  conditionChange: EventPayloadMap['counterfactual_applied'] | null; comparison: RunComparison | null;
  diagnosis: LocalFeedbackResult | null; report: ReflectionReport | null; reports: ReflectionReport[];
}
export class SessionError extends Error {
  constructor(message: string) { super(message); this.name = 'SessionError'; }
}
const key = (node: Candidate['node']): string => node.x + ',' + node.y;
const copy = <T>(value: T): T => structuredClone(value);
const hints: Record<Algorithm, readonly string[]> = {
  bfs: ['BFS 按层搜索，而不是直接冲向终点。', '比较候选的入队序号。队列遵循先入先出。', '先读队列证据，再比较最早入队的候选。g 表示从起点已走的步数；h=0 不表示离终点为零。'],
  astar: ['A* 同时考虑已走代价与到终点的估计代价。', '先比较 f=g+h；h 是四方向单位网格的曼哈顿距离。', '若 f 相同，比较 h；若 h 也相同，比较入队序号。按这个顺序逐项比较，不只看离终点远近。'],
};

/** Owns the private precomputed trace. UI receives only a copied, revealed projection. */
export class LearningSession {
  #level: LevelDefinition;
  #algorithm: Algorithm;
  #initialAlgorithm: Algorithm;
  #commands: SessionCommand[] = [];
  #input: SearchInput;
  #state: LearningState = 'briefing';
  #trace: DeterministicEvent[] = [];
  #cursor = 0;
  #events: SearchEvent[] = [];
  #runId: string | null = null;
  #sessionId = '';
  #gridRevision = 0;
  #checkpointIndex = 0;
  #checkpoint: LearningView['checkpoint'] = null;
  #predictions: Prediction[] = [];
  #skipped: string[] = [];
  #completed: CompletedRun[] = [];
  #first = new Map<string, boolean>();
  #attempts = new Map<string, number>();
  #usedIds = new Set<string>();
  #speed: Speed = 1;
  #change: EventPayloadMap['counterfactual_applied'] | null = null;
  #revisions = new Map<string, number>();
  #report: ReflectionReport | null = null;
  #reports: ReflectionReport[] = [];

  constructor(level: LevelDefinition, algorithm: Algorithm) {
    assertSearchInput(level);
    if (!level.algorithms.includes(algorithm)) throw new SessionError('本关不支持该算法。');
    this.#level = copy(level);
    this.#algorithm = algorithm;
    this.#initialAlgorithm = algorithm;
    this.#input = copy({ grid: level.grid, start: level.start, goal: level.goal });
    this.#revisions.set(JSON.stringify(this.#input), 0);
  }

  configureAlgorithm(algorithm: Algorithm): LearningView {
    this.#require('briefing');
    if (this.#change && algorithm !== this.#algorithm) throw new SessionError('单一条件实验需保持同一算法；重置后可重新选择。');
    if (!this.#level.algorithms.includes(algorithm)) throw new SessionError('本关不支持该算法。');
    this.#algorithm = algorithm;
    this.#commands.push({ kind: 'configure', algorithm });
    return this.view();
  }

  dispatch(action: LearningAction, at: string): LearningView {
    if (!Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) throw new SessionError('事件时间必须为 UTC ISO 字符串。');
    switch (action.type) {
      case 'start_valid_run': {
        this.#require('briefing');
        if (typeof action.runId !== 'string' || typeof action.sessionId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,89}$/.test(action.runId) || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(action.sessionId) || this.#usedIds.has(action.runId)) throw new SessionError('运行标识必须合法、长度受限且不重复。');
        const result = (this.#algorithm === 'bfs' ? runBfs : runAstar)(this.#input);
        this.#trace = result.events;
        this.#runId = action.runId; this.#sessionId = action.sessionId;
        this.#usedIds.add(action.runId);
        this.#state = 'paused';
        this.#append({ type: 'mission_started', payload: { gridRevision: this.#gridRevision } }, at);
        if (this.#change) this.#append({ type: 'counterfactual_applied', payload: this.#change }, at);
        this.#revealPrelude(at);
        // Initialization may reveal several batches only until a genuine first checkpoint exists.
        while (this.#state === 'paused' && !this.#gate(at)) this.#revealBatch(at);
        break;
      }
      case 'submit_valid_choice': {
        this.#require('prediction');
        const checkpoint = this.#checkpoint!;
        if (!checkpoint.candidates.some(c => key(c.node) === key(action.selected))) throw new SessionError('必须选择当前可见候选。');
        if (!['under_10s', '10_to_30s', 'over_30s'].includes(action.elapsedBucket)) throw new SessionError('无效耗时区间。');
        const event = this.#trace[this.#cursor];
        if (event?.type !== 'node_selected') throw new SessionError('预测点与轨迹不一致。');
        const attemptKey = this.#algorithm + ':' + this.#gridRevision + ':' + checkpoint.id;
        const retryCount = this.#attempts.get(attemptKey) ?? 0;
        const prediction: Prediction = {
          checkpointId: checkpoint.id, selected: copy(action.selected), actual: copy(event.payload.node), candidates: copy(checkpoint.candidates),
          correct: key(action.selected) === key(event.payload.node), hintLevel: checkpoint.hintLevel, elapsedBucket: action.elapsedBucket, retryCount,
        };
        if (!this.#first.has(attemptKey)) this.#first.set(attemptKey, prediction.correct);
        this.#attempts.set(attemptKey, retryCount + 1);
        this.#predictions.push(prediction);
        this.#append({ type: 'prediction_submitted', payload: copy(prediction) }, at);
        this.#checkpoint = null; this.#checkpointIndex++; this.#state = 'paused';
        this.#revealBatch(at); this.#gate(at);
        break;
      }
      case 'request_hint': {
        this.#require('prediction');
        const checkpoint = this.#checkpoint!;
        if (checkpoint.hintLevel === 3) throw new SessionError('提交前最多使用三层规则提示。');
        checkpoint.hintLevel = (checkpoint.hintLevel + 1) as 1 | 2 | 3;
        checkpoint.hint = hints[this.#algorithm][checkpoint.hintLevel - 1]!;
        break;
      }
      case 'play':
        this.#require('paused');
        if (![0.5, 1, 2, 4].includes(action.speed)) throw new SessionError('无效播放速度。');
        this.#speed = action.speed; this.#state = 'running';
        this.#append({ type: 'run_resumed', payload: { speed: action.speed } }, at);
        break;
      case 'pause':
        this.#require('running');
        if (action.reason !== undefined && action.reason !== 'user' && action.reason !== 'restore') throw new SessionError('无效暂停原因。');
        this.#state = 'paused';
        this.#append({ type: 'run_paused', payload: { reason: action.reason ?? 'user' } }, at);
        break;
      case 'step':
      case 'tick':
        this.#require(action.type === 'step' ? 'paused' : 'running');
        if (!this.#gate(at)) { this.#revealBatch(at); this.#gate(at); }
        break;
      case 'experiment':
        if (this.#state !== 'reflection' && this.#state !== 'report') throw new SessionError('完成当前搜索后才能改变条件。');
        this.#state = 'counterfactual';
        break;
      case 'cancel':
        this.#require('counterfactual'); this.#state = 'reflection';
        break;
      case 'apply_valid_change': {
        this.#require('counterfactual');
        const change = action.change;
        if (!change || Object.keys(change).some(k => k !== 'type' && k !== 'cell') || !['block_cell', 'move_goal'].includes(change.type) || !change.cell || Object.keys(change.cell).some(k => k !== 'x' && k !== 'y') || !isWalkable(this.#input.grid, change.cell)) throw new SessionError('条件目标必须为地图内可通行的整数坐标。');
        if (change.type === 'block_cell' && (key(change.cell) === key(this.#input.start) || key(change.cell) === key(this.#input.goal))) throw new SessionError('不能封锁起点或终点。');
        if (change.type === 'move_goal' && key(change.cell) === key(this.#input.goal)) throw new SessionError('新终点必须不同于当前终点。');
        const base = this.#completed.find(r => r.runId === this.#runId)!;
        const input = copy(this.#input);
        if (change.type === 'move_goal') Object.assign(input, { goal: copy(change.cell) });
        else {
          const rows = [...input.grid.rows], { x, y } = change.cell;
          rows[y] = rows[y]!.slice(0, x) + '#' + rows[y]!.slice(x + 1);
          Object.assign(input, { grid: { ...input.grid, rows } });
        }
        assertSearchInput(input);
        // Identical maps share revision identity, including revisiting the fixture after reset.
        const identity = JSON.stringify(input), revision = this.#revisions.get(identity) ?? this.#revisions.size;
        this.#revisions.set(identity, revision);
        this.#change = { previousRunId: base.runId, previousGridRevision: base.gridRevision, newGridRevision: revision, change: copy(change) };
        this.#input = input; this.#gridRevision = revision;
        this.#clearActive(); this.#state = 'briefing';
        break;
      }
      case 'complete_reflection': {
        this.#require('reflection');
        const index = this.#completed.findIndex(r => r.runId === this.#runId), run = this.#completed[index]!;
        let report: ReflectionReport;
        try { report = createReflectionReport(run, this.#completed, action.explanation, action.evidenceEventIds); }
        catch (cause) { throw new SessionError(cause instanceof Error ? cause.message : '复盘证据无效。'); }
        this.#append({ type: 'diagnosis_generated', payload: { feedbackId: this.#runId + ':feedback', mode: 'local', evidenceEventIds: report.feedback.evidence.map(e => e.eventId) } }, at);
        if (report.explanation) this.#append({ type: 'reflection_completed', payload: { explanation: report.explanation, evidenceEventIds: report.evidenceEventIds } }, at);
        this.#completed[index] = { ...run, events: copy(this.#events) };
        this.#report = report; this.#reports.push(copy(report)); this.#state = 'report';
        break;
      }
      case 'reset_task':
        this.#input = copy({ grid: this.#level.grid, start: this.#level.start, goal: this.#level.goal });
        this.#gridRevision = 0; this.#change = null;
        this.#clearActive(); this.#state = 'briefing';
        break;
      default: throw new SessionError('未列出的操作被拒绝。');
    }
    this.#commands.push({ kind: 'action', action: copy(action), at });
    return this.view();
  }

  /** Only successful, already-issued commands; no private trace or computed answers. */
  checkpoint(): SessionCheckpoint {
    return copy({ levelId: this.#level.id, initialAlgorithm: this.#initialAlgorithm, commands: this.#commands });
  }

  #clearActive(): void {
    this.#trace = []; this.#cursor = 0; this.#events = []; this.#runId = null;
    this.#checkpoint = null; this.#checkpointIndex = 0; this.#predictions = []; this.#skipped = []; this.#report = null;
  }

  #require(state: LearningState): void {
    if (this.#state !== state) throw new SessionError('当前状态不允许此操作：' + this.#state + '。');
  }

  #append(event: EnvelopeInput, at: string, step = Math.max(0, this.#cursor - 1)): void {
    this.#events.push({
      schemaVersion: 1, eventId: this.#runId + ':' + this.#events.length, sessionId: this.#sessionId,
      runId: this.#runId!, levelId: this.#level.id as SearchEvent['levelId'], gridRevision: this.#gridRevision,
      algorithm: this.#algorithm, algorithmVersion: '1.0.0', step, ...copy(event), createdAt: at,
    } as SearchEvent);
  }

  #revealEvent(at: string): void {
    const event = this.#trace[this.#cursor++]!;
    this.#append(event, at, event.step);
    if (event.type === 'run_finished') {
      this.#state = 'reflection';
      this.#skipped = this.#level.checkpoints.slice(this.#checkpointIndex).map(c => c.id);
      this.#checkpoint = null;
      this.#completed.push({
        runId: this.#runId!, gridRevision: this.#gridRevision, algorithm: this.#algorithm, input: copy(this.#input),
        outcome: event.payload.status, metrics: copy(event.payload.metrics), predictions: copy(this.#predictions), events: copy(this.#events),
      });
    }
  }

  #revealPrelude(at: string): void {
    while (this.#cursor < this.#trace.length && this.#trace[this.#cursor]!.type !== 'node_selected') this.#revealEvent(at);
  }

  #revealBatch(at: string): void {
    if (this.#cursor >= this.#trace.length) return;
    this.#revealEvent(at); // One effective selected node; never one animation frame.
    this.#revealPrelude(at);
  }

  #gate(at: string): boolean {
    if (this.#state === 'reflection') return true;
    const requested = this.#level.checkpoints[this.#checkpointIndex];
    if (!requested) return false;
    const visible = this.view();
    if (visible.metrics.selectionCount + 1 < requested.beforeSelectionOrdinal || visible.frontier.length < requested.minCandidates) return false;
    // The effective frontier already contains all evidence; do not annotate the private next selected node.
    const candidates = visible.frontier.slice(0, 4).map(c => ({ ...c, distanceFromStart: c.g }))
      .sort((a, b) => a.node.y - b.node.y || a.node.x - b.node.x);
    this.#checkpoint = { id: requested.id, prompt: requested.prompt, candidates, hintLevel: 0, hint: null };
    this.#state = 'prediction';
    this.#append({ type: 'run_paused', payload: { reason: 'checkpoint' } }, at);
    this.#append({ type: 'prediction_requested', payload: { checkpointId: requested.id, candidates } }, at);
    return true;
  }

  view(): LearningView {
    const nodes = new Map<string, EventPayloadMap['node_discovered']>();
    let frontier: LearningView['frontier'] = [], current: LearningView['current'] = null;
    let path: LearningView['path'] = [], pathFinal = false, outcome: LearningView['outcome'] = null;
    const expanded: Candidate['node'][] = [];
    const metrics: Metrics = { discoveredCount: 0, expandedCount: 0, selectionCount: 0, frontierPeak: 0, pathLength: null };
    for (const event of this.#events) {
      switch (event.type) {
        case 'node_discovered': nodes.set(key(event.payload.node), event.payload); metrics.discoveredCount++; break;
        case 'node_relaxed': nodes.set(key(event.payload.node), event.payload); break;
        case 'frontier_snapshot': frontier = event.payload.nodes; metrics.frontierPeak = Math.max(metrics.frontierPeak, frontier.length); break;
        case 'node_selected': current = event.payload; metrics.selectionCount++; break;
        case 'node_expanded': expanded.push(event.payload.node); metrics.expandedCount++; break;
        case 'path_updated': path = event.payload.nodes; pathFinal = event.payload.final; break;
        case 'run_finished': outcome = event.payload.status; metrics.pathLength = event.payload.metrics.pathLength; break;
      }
    }
    const completed = this.#completed.find(r => r.runId === this.#runId);
    return copy({
      state: this.#state, levelId: this.#level.id, algorithm: this.#algorithm, runId: this.#runId, sessionId: this.#sessionId || null, gridRevision: this.#gridRevision,
      input: this.#input, events: this.#events, frontier, nodes: [...nodes.values()], expanded, current, path, pathFinal,
      metrics, outcome, checkpoint: this.#checkpoint, lastPrediction: this.#predictions.at(-1) ?? null,
      predictions: this.#predictions, skippedCheckpoints: this.#skipped,
      firstAttempts: { total: this.#first.size, correct: [...this.#first.values()].filter(Boolean).length }, completedRuns: this.#completed, speed: this.#speed,
      conditionChange: this.#change, comparison: completed ? compareRuns(completed, this.#completed) : null,
      diagnosis: completed ? buildLocalFeedback(completed) : null, report: this.#report, reports: this.#reports,
    });
  }
}
