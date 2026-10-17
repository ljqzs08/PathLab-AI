import type { Algorithm, LevelDefinition } from '../../../contracts/types.ts';
import { LearningSession, type LearningAction, type SessionCheckpoint, type SessionCommand } from './session.ts';

export const MAX_PROGRESS_BYTES = 1024 * 1024;
export const MAX_PROGRESS_COMMANDS = 4096;
const MAX_RUNS_PER_MISSION = 32;
export interface RestoredProgress { selectedId: string; sessions: Map<string, LearningSession>; savedAt: string }
interface ProgressFile {
  schemaVersion: 1; algorithmVersion: '1.0.0'; catalogSignature: string; savedAt: string;
  selectedId: string; sessions: SessionCheckpoint[];
}
export class ProgressError extends Error {
  constructor(message: string) { super(message); this.name = 'ProgressError'; }
}
const fail = (message = '存档结构或操作记录无效，原有进度未被替换。'): never => { throw new ProgressError(message); };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, required: string[], optional: string[] = []): void {
  if (required.some(k => !Object.hasOwn(value, k)) || Object.keys(value).some(k => !required.includes(k) && !optional.includes(k))) fail();
}
function text(value: unknown, max: number, empty = false): asserts value is string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.length)) fail();
}
function timestamp(value: unknown): asserts value is string {
  text(value, 30);
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) fail();
}
function algorithm(value: unknown): asserts value is Algorithm { if (value !== 'bfs' && value !== 'astar') fail(); }
function position(value: unknown): void {
  const node = object(value); keys(node, ['x', 'y']);
  for (const n of [node.x, node.y]) if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 24) fail();
}
function action(value: unknown): LearningAction {
  const a = object(value);
  switch (a.type) {
    case 'start_valid_run': keys(a, ['type', 'runId', 'sessionId']); text(a.runId, 90); text(a.sessionId, 100); break;
    case 'submit_valid_choice': keys(a, ['type', 'selected', 'elapsedBucket']); position(a.selected); if (!['under_10s', '10_to_30s', 'over_30s'].includes(a.elapsedBucket as string)) fail(); break;
    case 'play': keys(a, ['type', 'speed']); if (![0.5, 1, 2, 4].includes(a.speed as number)) fail(); break;
    case 'pause': keys(a, ['type'], ['reason']); if (a.reason !== undefined && a.reason !== 'user' && a.reason !== 'restore') fail(); break;
    case 'apply_valid_change': {
      keys(a, ['type', 'change']); const change = object(a.change); keys(change, ['type', 'cell']);
      if (change.type !== 'block_cell' && change.type !== 'move_goal') fail(); position(change.cell); break;
    }
    case 'complete_reflection':
      keys(a, ['type', 'explanation', 'evidenceEventIds']); text(a.explanation, 500, true);
      if (!Array.isArray(a.evidenceEventIds) || a.evidenceEventIds.length > 12) return fail();
      for (const id of a.evidenceEventIds) text(id, 128); break;
    case 'request_hint': case 'step': case 'tick': case 'reset_task': case 'experiment': case 'cancel': keys(a, ['type']); break;
    default: fail();
  }
  return a as unknown as LearningAction;
}
function command(value: unknown): SessionCommand {
  const c = object(value);
  if (c.kind === 'configure') { keys(c, ['kind', 'algorithm']); algorithm(c.algorithm); return { kind: 'configure', algorithm: c.algorithm }; }
  if (c.kind !== 'action') return fail();
  keys(c, ['kind', 'action', 'at']); timestamp(c.at);
  return { kind: 'action', action: action(c.action), at: c.at };
}
const signature = (levels: readonly LevelDefinition[]) => JSON.stringify(levels);
function budget(sessions: readonly SessionCheckpoint[]): void {
  if (sessions.reduce((sum, s) => sum + s.commands.length, 0) > MAX_PROGRESS_COMMANDS
    || sessions.some(s => s.commands.filter(c => c.kind === 'action' && c.action.type === 'start_valid_run').length > MAX_RUNS_PER_MISSION)) {
    fail('存档超过操作或运行数量上限；内存进度仍可使用，旧存档不会被覆盖。');
  }
}
export function createProgress(levels: readonly LevelDefinition[], sessions: ReadonlyMap<string, LearningSession>, selectedId: string, at: string): string {
  timestamp(at);
  if (sessions.size !== levels.length || !levels.some(l => l.id === selectedId)) fail();
  const snapshots = levels.map(l => { const s = sessions.get(l.id); if (!s) return fail(); return s.checkpoint(); });
  budget(snapshots);
  const data: ProgressFile = { schemaVersion: 1, algorithmVersion: '1.0.0', catalogSignature: signature(levels), savedAt: at, selectedId, sessions: snapshots };
  const output = JSON.stringify(data);
  if (new TextEncoder().encode(output).byteLength > MAX_PROGRESS_BYTES) fail('存档超过 1 MiB 上限；旧存档未被覆盖。');
  return output;
}

/** Validate everything first, then replay through the same gates. Never assign imported metrics or private state. */
export function restoreProgress(raw: string, levels: readonly LevelDefinition[], at: string): RestoredProgress {
  timestamp(at);
  if (typeof raw !== 'string' || raw.length > MAX_PROGRESS_BYTES || new TextEncoder().encode(raw).byteLength > MAX_PROGRESS_BYTES) fail('存档超过 1 MiB 上限。');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return fail('存档不是有效 JSON；原始数据已保留。'); }
  const data = object(parsed);
  keys(data, ['schemaVersion', 'algorithmVersion', 'catalogSignature', 'savedAt', 'selectedId', 'sessions']);
  if (data.schemaVersion !== 1 || data.algorithmVersion !== '1.0.0') fail('存档或算法版本不兼容；不会自动升级或覆盖。');
  if (data.catalogSignature !== signature(levels)) fail('存档关卡版本与当前任务不兼容；原始数据已保留。');
  timestamp(data.savedAt);
  if (!levels.some(l => l.id === data.selectedId) || !Array.isArray(data.sessions) || data.sessions.length !== levels.length) fail();
  const checkpoints: SessionCheckpoint[] = [], seen = new Set<string>();
  for (const entry of data.sessions as unknown[]) {
    const s = object(entry); keys(s, ['levelId', 'initialAlgorithm', 'commands']); text(s.levelId, 20); algorithm(s.initialAlgorithm);
    const level = levels.find(l => l.id === s.levelId);
    if (!level || seen.has(s.levelId) || !level.algorithms.includes(s.initialAlgorithm) || !Array.isArray(s.commands) || s.commands.length > MAX_PROGRESS_COMMANDS) fail();
    seen.add(s.levelId); checkpoints.push({ levelId: s.levelId, initialAlgorithm: s.initialAlgorithm, commands: (s.commands as unknown[]).map(command) });
  }
  budget(checkpoints);
  const sessions = new Map<string, LearningSession>();
  try {
    for (const checkpoint of checkpoints) {
      const s = new LearningSession(levels.find(l => l.id === checkpoint.levelId)!, checkpoint.initialAlgorithm);
      for (const c of checkpoint.commands) {
        if (c.kind === 'configure') s.configureAlgorithm(c.algorithm); else s.dispatch(c.action, c.at);
      }
      // Recovery is not playback. Temporary experiment choices and unsaved explanation drafts are not persisted.
      if (s.view().state === 'running') s.dispatch({ type: 'pause', reason: 'restore' }, at);
      if (s.view().state === 'counterfactual') s.dispatch({ type: 'cancel' }, at);
      sessions.set(checkpoint.levelId, s);
    }
  } catch { return fail('存档操作无法通过当前预测门控或证据校验；原有进度未被替换。'); }
  return { selectedId: data.selectedId as string, sessions, savedAt: data.savedAt };
}
