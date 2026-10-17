import { useEffect, useRef, useState } from 'react';
import type { LevelDefinition } from '../../contracts/types';
import { MAX_PROGRESS_BYTES, ProgressError, restoreProgress } from '../domain/learning/progress';
import type { ProgressState, ProgressStore } from '../domain/learning/progress-store';

function download(raw: string, name: string): void {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
export function ProgressPanel({ store, progress, missions }: { store: ProgressStore; progress: ProgressState; missions: readonly LevelDefinition[] }) {
  const [pending, setPending] = useState<{ raw: string; summary: string } | null>(null);
  const [confirmation, setConfirmation] = useState<'reload' | 'replace' | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const token = useRef(0), heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (pending || confirmation) heading.current?.focus(); }, [pending, confirmation]);
  const attempt = (action: () => void) => { try { action(); setError(''); } catch (cause) { setError(cause instanceof ProgressError ? cause.message : '操作未完成；请保留原始 JSON 并重试。'); } };
  return <section className="progress-panel" aria-labelledby="progress-title" data-testid="progress-panel">
    <div className="progress-heading"><div><p className="eyebrow">YOUR PROGRESS, ON THIS DEVICE</p><h2 id="progress-title">让推理，不因刷新中断。</h2></div><span className="neutral-badge">{progress.saveState === 'saved' ? '本机已保存' : progress.saveState === 'memory' ? '仅内存 · 请备份' : progress.saveState === 'loading' ? '读取中' : '本机存档'}</span></div>
    <p role="status" data-testid="save-status">{progress.notice}</p>
    <details className="progress-tools"><summary>备份、恢复与数据边界</summary>
      <p>存档与报告解释只保存到此浏览器；保存、导出和恢复不上传云端、不调用模型。只有你主动确认的 DeepSeek 复盘会发送所预览的最小事实，绝不包含自由文本解释。未提交的候选选择、实验选项和解释草稿不保存；恢复不会自动播放。浏览器清理数据会删除存档，请另存 JSON。</p>
      <div className="progress-actions">
        <button type="button" className="action-secondary" disabled={!progress.ready} data-testid="export-progress" onClick={() => attempt(() => download(store.export(new Date().toISOString()), 'pathlab-progress-v1.json'))}>导出当前进度 JSON</button>
        <label className="progress-file">选择 JSON 存档<input aria-label="选择 JSON 存档" type="file" accept=".json,application/json" disabled={!progress.ready || reading} onChange={async event => {
          const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (!file) return;
          const current = ++token.current; setPending(null); setConfirmation(null); setError(''); setReading(true);
          try {
            if (file.size > MAX_PROGRESS_BYTES) throw new ProgressError('文件超过 1 MiB 上限，未读取或替换现有进度。');
            const raw = await file.text(), restored = restoreProgress(raw, missions, new Date().toISOString());
            const views = [...restored.sessions.values()].map(s => s.view());
            const summary = '保存时间 ' + restored.savedAt + '；当前任务 ' + restored.selectedId + '；完整运行 ' + views.reduce((n,v) => n + v.completedRuns.length, 0) + ' 次；报告 ' + views.reduce((n,v) => n + v.reports.length, 0) + ' 份。';
            if (current === token.current) setPending({ raw, summary });
          } catch (cause) { if (current === token.current) setError(cause instanceof ProgressError ? cause.message : '文件读取失败，现有进度未被替换。'); }
          finally { if (current === token.current) setReading(false); }
        }} /></label>
      </div>
      {reading && <p role="status">正在本机校验，尚未替换进度。</p>}
      {progress.protected && <div className="progress-recovery"><p>浏览器旧档受保护。可先备份两份数据，再决定取舍；不会自动合并或覆盖。</p><div className="progress-actions">
        <button type="button" className="action-quiet" onClick={() => attempt(() => { const raw = store.rawBackup(); if (raw === null) throw new ProgressError('没有可读取的浏览器原始存档。'); download(raw, 'pathlab-original-backup.json'); })}>下载浏览器原始存档</button>
        <button type="button" className="action-quiet" onClick={() => { setConfirmation('reload'); setPending(null); }}>重新读取浏览器存档</button>
        <button type="button" className="action-quiet" onClick={() => { setConfirmation('replace'); setPending(null); }}>用当前进度覆盖存档</button>
      </div></div>}
      {(pending || confirmation) && <div className="progress-preview" data-testid="progress-preview">
        <h3 ref={heading} tabIndex={-1}>{pending ? '校验通过，尚未导入' : '请确认这次替换'}</h3>
        <p>{pending ? pending.summary : confirmation === 'reload' ? '重新读取会替换当前内存进度；未备份的内存操作将丢失。' : '覆盖会替换此浏览器的旧存档；未导出的旧版本将无法恢复。'}</p>
        {pending && <p>导入会替换当前内存进度。{progress.protected ? '浏览器旧档仍受保护，不会自动覆盖。' : '确认后会尝试保存到本机。'}建议先导出当前进度。</p>}
        <div className="progress-actions"><button type="button" className="action-primary" data-testid="confirm-progress" onClick={() => attempt(() => {
          if (pending) store.import(pending.raw, new Date().toISOString());
          else if (confirmation === 'reload') store.reload(new Date().toISOString());
          else if (confirmation === 'replace') store.replaceStorage(new Date().toISOString());
          setPending(null); setConfirmation(null);
        })}>{pending ? '确认导入，替换当前进度' : confirmation === 'reload' ? '确认读取，替换内存进度' : '确认覆盖浏览器旧存档'}</button><button type="button" className="action-quiet" onClick={() => { setPending(null); setConfirmation(null); }}>取消，保留现状</button></div>
      </div>}
      {error && <p role="alert" className="progress-error" data-testid="progress-error">{error}</p>}
    </details>
  </section>;
}
