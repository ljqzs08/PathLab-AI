import type { LevelDefinition } from '../../../contracts/types.ts';
import { LearningSession } from './session.ts';
import { createProgress, restoreProgress, ProgressError } from './progress.ts';

export const PROGRESS_KEY = 'pathlab.progress.v1';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export interface ProgressState {
  ready: boolean; selectedId: string; sessions: Map<string, LearningSession>; generation: number;
  saveState: 'loading' | 'ready' | 'saved' | 'memory'; protected: boolean; notice: string;
}
/** One workbench's browser-storage boundary, not a source of algorithm answers. */
export class ProgressStore {
  #levels: readonly LevelDefinition[];
  #state: ProgressState;
  #listeners = new Set<() => void>();
  #storage: StoragePort | null = null;
  #expectedRaw: string | null = null;
  #loaded = false;
  constructor(levels: readonly LevelDefinition[]) {
    this.#levels = levels;
    this.#state = { ready: false, selectedId: levels[0]!.id, sessions: this.#fresh(), generation: 0, saveState: 'loading', protected: false, notice: '正在检查本机存档；检查完成前不会写入。' };
  }
  #fresh(): Map<string, LearningSession> { return new Map(this.#levels.map(l => [l.id, new LearningSession(l, l.algorithms[0]!)])); }
  getSnapshot = (): ProgressState => this.#state;
  subscribe = (listener: () => void): (() => void) => { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; };
  #update(change: Partial<ProgressState>): void { this.#state = { ...this.#state, ...change }; for (const listener of this.#listeners) listener(); }
  load(storage: StoragePort | null, at: string): void {
    if (this.#loaded) return;
    this.#loaded = true; this.#storage = storage;
    try {
      if (!storage) throw new Error('storage unavailable');
      const raw = storage.getItem(PROGRESS_KEY); this.#expectedRaw = raw;
      if (raw === null) { this.#update({ ready: true, saveState: 'ready', notice: '本机存档就绪；操作后自动保存。' }); return; }
      const restored = restoreProgress(raw, this.#levels, at);
      this.#update({ ready: true, sessions: restored.sessions, selectedId: restored.selectedId, generation: this.#state.generation + 1,
        saveState: 'ready', notice: '已恢复本机进度；播放保持暂停，未提交预测仍需作答。' });
    } catch (cause) {
      this.#update({ ready: true, saveState: 'memory', protected: true,
        notice: cause instanceof ProgressError ? cause.message + ' 当前可在内存继续，自动保存已暂停。' : '浏览器存储不可用；可在内存继续并导出 JSON，刷新会丢失未备份进度。' });
    }
  }
  select(id: string, at: string): void {
    if (!this.#levels.some(l => l.id === id)) throw new ProgressError('任务不存在。');
    if (!this.#state.ready) return;
    const previous = this.#state.sessions.get(this.#state.selectedId)!;
    if (previous.view().state === 'running') previous.dispatch({ type: 'pause' }, at);
    this.#update({ selectedId: id }); this.changed(at);
  }
  changed(at: string): void { this.#persist(at, false); }
  #persist(at: string, replace: boolean): void {
    if (!this.#state.ready || !this.#storage || (this.#state.protected && !replace)) return;
    try {
      const raw = this.export(at), current = this.#storage.getItem(PROGRESS_KEY);
      if (!replace && current !== this.#expectedRaw) {
        this.#update({ protected: true, saveState: 'memory', notice: '检测到其他页面修改了本机存档；自动保存已暂停，未覆盖任何版本。请先备份，再选择读取或覆盖。' }); return;
      }
      this.#storage.setItem(PROGRESS_KEY, raw); this.#expectedRaw = raw;
      this.#update({ protected: false, saveState: 'saved', notice: '已自动保存到此浏览器；建议另行导出 JSON 备份。' });
    } catch (cause) {
      this.#update({ saveState: 'memory', notice: cause instanceof ProgressError ? cause.message : '本机保存失败（可能配额已满或被禁用）；进度仍在内存，旧存档未被覆盖。请导出 JSON。' });
    }
  }
  export(at: string): string { return createProgress(this.#levels, this.#state.sessions, this.#state.selectedId, at); }
  import(raw: string, at: string): void {
    const restored = restoreProgress(raw, this.#levels, at);
    this.#update({ sessions: restored.sessions, selectedId: restored.selectedId, generation: this.#state.generation + 1 });
    this.changed(at);
  }
  rawBackup(): string | null { try { return this.#storage?.getItem(PROGRESS_KEY) ?? this.#expectedRaw; } catch { return this.#expectedRaw; } }
  reload(at: string): void {
    if (!this.#storage) throw new ProgressError('浏览器存储不可用。');
    const raw = this.#storage.getItem(PROGRESS_KEY);
    const restored = raw === null ? { sessions: this.#fresh(), selectedId: this.#levels[0]!.id } : restoreProgress(raw, this.#levels, at);
    this.#expectedRaw = raw;
    this.#update({ sessions: restored.sessions, selectedId: restored.selectedId, generation: this.#state.generation + 1, protected: false, saveState: 'ready', notice: '已重新读取本机存档；不会自动播放。' });
  }
  /** UI must ask for explicit confirmation before calling either destructive replacement action. */
  replaceStorage(at: string): void { this.#persist(at, true); }
}
