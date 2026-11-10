import { useCallback, useEffect, useRef, useState } from 'react';
import type { Algorithm, LevelDefinition, Position } from '../../contracts/types';
import { LearningSession, type LearningAction, type LearningView } from '../domain/learning/session';
import { GridCanvas } from './GridCanvas';
import { EvidenceInspector } from './EvidenceInspector';
import { ReflectionPanel, ReportHistory } from './ReflectionPanel';
import { explainPrediction } from '../domain/learning/astar-primer';

const names: Record<Algorithm, string> = { bfs: 'BFS', astar: 'A*' };
const stateNames: Record<LearningView['state'], string> = { idle: '待选任务', briefing: '任务简报', editing: '编辑中', prediction: '先作预测', paused: '回放已暂停', running: '正在回放', reflection: '搜索完成 · 待复盘', counterfactual: '条件实验', report: '学习报告' };
const coordinate = (node: Position) => '(' + node.x + ', ' + node.y + ')';

function PredictionPanel({ view, onAction, selected, onSelect }: { view: LearningView; onAction: (action: LearningAction) => void; selected: Position | null; onSelect: (node: Position) => void }) {
  const began = useRef(0);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { began.current = performance.now(); title.current?.focus({ preventScroll: true }); }, []);
  const checkpoint = view.checkpoint!;
  return <section className="prediction-panel" id="prediction-panel" aria-labelledby="prediction-title" data-testid="prediction-panel">
    <p className="eyebrow">PREDICT BEFORE REVEAL</p>
    <h4 id="prediction-title" ref={title} tabIndex={-1}>{checkpoint.prompt}</h4>
    <p>第 {view.metrics.selectionCount + 1} 次有效选择前 · 候选按坐标排列，不代表处理顺序。可点击地图上的候选节点作答，提交前可改选。</p>
    <div className="candidate-list" role="group" aria-label="选择预测节点">{checkpoint.candidates.map(candidate => <button type="button" key={coordinate(candidate.node)} data-testid={'candidate-' + candidate.node.x + '-' + candidate.node.y} aria-pressed={selected?.x === candidate.node.x && selected?.y === candidate.node.y} onClick={() => onSelect(candidate.node)}>
      <strong>{coordinate(candidate.node)}</strong>{view.algorithm === 'astar' ? <span>已走 g {candidate.g} · 估计剩 h {candidate.h} · 合计 f {candidate.f}</span> : <span>离起点 {candidate.g} 步</span>}<small>入队序号 {candidate.entrySequence}（越小越早排队）</small>
    </button>)}</div>
    <details className="term-help"><summary>看不懂这些数字？</summary>{view.algorithm === 'astar'
      ? <p>g = 从起点走到这里已经走了几步；h = 不管墙，横向差 + 纵向差，估计还要几步；f = g + h。A* 先挑 f 最小的；f 一样挑 h 小的；还一样挑入队序号小的（先排队的）。完全没学过？先到页面上方的「A* 零基础入门」走一遍。</p>
      : <p>BFS 像排队：先进入队列（入队序号小）的格子先被处理，不看离终点多远。所以只需比较入队序号。</p>}</details>
    <button type="button" className="action-primary" disabled={!selected} data-testid="submit-prediction" onClick={() => {
      if (!selected) return;
      const seconds = (performance.now() - began.current) / 1000;
      onAction({ type: 'submit_valid_choice', selected, elapsedBucket: seconds < 10 ? 'under_10s' : seconds <= 30 ? '10_to_30s' : 'over_30s' });
    }}>提交预测，揭示一步 <span aria-hidden="true">→</span></button>
    <button type="button" className="action-quiet" disabled={checkpoint.hintLevel === 3} onClick={() => onAction({ type: 'request_hint' })}>规则提示 {checkpoint.hintLevel}/3</button>
    {checkpoint.hint && <p className="hint-copy">{checkpoint.hint}</p>}
    <small>每个预测点只确认一次；重跑会作为新尝试记录，不覆盖首次正确率。</small>
  </section>;
}

export function LearningWorkbench({ mission, session, onProgress }: { mission: LevelDefinition; session: LearningSession; onProgress: () => void }) {
  const [view, setView] = useState(() => session.view());
  const [inspected, setInspected] = useState<string | null>(null);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 4>(() => session.view().speed);
  const [error, setError] = useState('');
  // Drafts are UI-only and scoped to this run/checkpoint; never persisted as answers.
  const [draft, setDraft] = useState<{ key: string; node: Position } | null>(null);
  const predictionKey = view.checkpoint ? view.runId + ':' + view.checkpoint.id : null;
  const selectedPrediction = predictionKey && draft?.key === predictionKey ? draft.node : null;
  const selectPrediction = (node: Position) => {
    if (predictionKey) setDraft({ key: predictionKey, node });
    setInspected(node.x + ',' + node.y);
  };
  const act = useCallback((action: LearningAction) => {
    try { setView(session.dispatch(action, new Date().toISOString())); setError(''); onProgress(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '操作未成功，请重试。'); }
  }, [session, onProgress]);

  useEffect(() => {
    if (view.state !== 'running') return;
    const timer = window.setInterval(() => { if (session.view().state === 'running') act({ type: 'tick' }); }, 550 / view.speed);
    const visibility = () => { if (document.hidden && session.view().state === 'running') act({ type: 'pause' }); };
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [act, session, view.state, view.speed]);
  useEffect(() => () => { if (session.view().state === 'running') session.dispatch({ type: 'pause' }, new Date().toISOString()); }, [session]);

  const prediction = view.lastPrediction;
  return <div className="mission-content" id="mission-content" data-testid="learning-workbench" data-state={view.state}>
    <p className="sr-only" role="status">已选择 {mission.id} {mission.title}。{stateNames[view.state]}。已选中 {view.metrics.selectionCount} 个节点。{view.state === 'prediction' ? '请先提交预测，才能继续。' : ''}{prediction && view.state === 'paused' ? (prediction.correct ? '本次预测符合规则。' : '本次预测与实际选择不同。') : ''}</p>
    <div className="mission-heading"><div><p className="eyebrow">校园调度 / {mission.id}</p><h2 data-testid="mission-title">{mission.title}</h2></div><span className="neutral-badge">{stateNames[view.state]}</span></div>
    <p className="mission-narrative">{mission.narrative}</p>
    {error && <p role="alert" className="interaction-error">{error}</p>}
    <div className="mission-panels">
      <section className="map-panel" aria-labelledby="map-title">
        <div className="panel-heading"><h3 id="map-title">校园任务地图</h3><span>{view.runId ? names[view.algorithm] + ' · 修订 ' + view.gridRevision : '尚未运行'}</span></div>
        <GridCanvas view={view} title={mission.title} inspected={inspected} onInspect={setInspected} selectedPrediction={selectedPrediction} onSelectPrediction={selectPrediction} />
        <div className="map-coordinates"><span>S 起点 <strong>{coordinate(view.input.start)}</strong></span><span>G 终点 <strong>{coordinate(view.input.goal)}</strong></span><span>坐标从 0 开始</span></div>
        <p className="map-note">{view.state === 'briefing' ? '尚未运行；选择算法后先预测，再查看搜索证据。' : '图中仅有已揭示的搜索事实。回溯前缀不代表已抵达终点。'} 地图可键盘操作：方向键查看相邻节点。</p>
        <dl className="run-metrics" aria-label="由已揭示事件汇总的统计"><div><dt>已发现</dt><dd data-testid="discovered-count">{view.metrics.discoveredCount}</dd></div><div><dt>已扩展</dt><dd data-testid="expanded-count">{view.metrics.expandedCount}</dd></div><div><dt>已选中</dt><dd data-testid="selection-count">{view.metrics.selectionCount}</dd></div><div><dt>最短路径步数</dt><dd data-testid="path-length">{view.outcome === null ? '未揭示' : view.outcome === 'unreachable' ? '不可达' : view.metrics.pathLength}</dd></div></dl>
        <div className="playback-controls" role="group" tabIndex={0} aria-label="回放快捷键" aria-describedby="playback-help" onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          if (event.code === 'Space' && (view.state === 'paused' || view.state === 'running')) { event.preventDefault(); act(view.state === 'running' ? {type:'pause'} : {type:'play',speed}); }
          if (event.code === 'ArrowRight' && view.state === 'paused') { event.preventDefault(); act({type:'step'}); }
        }}>
          <button type="button" className="action-secondary" data-testid="play-pause" disabled={view.state !== 'paused' && view.state !== 'running'} onClick={() => act(view.state === 'running' ? {type:'pause'} : {type:'play',speed})}>{view.state === 'running' ? '暂停回放' : '播放回放'}</button>
          <button type="button" className="action-secondary" data-testid="step" disabled={view.state !== 'paused'} onClick={() => act({type:'step'})}>单步 →</button>
          <label className="speed-label">速度<select aria-label="回放速度" value={speed} disabled={view.state !== 'paused'} onChange={event => setSpeed(Number(event.target.value) as typeof speed)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
          <button type="button" className="action-quiet" disabled={view.state === 'briefing' && view.gridRevision === 0} onClick={() => { act({type:'reset_task'}); setInspected(null); }}>重置当前任务</button>
        </div>
        <p id="playback-help" className="control-help">{view.state === 'prediction' ? '先提交本次预测，才能继续回放。' : '聚焦回放快捷键区域：空格播放/暂停，右箭头单步。'} 单步=一次有效选中及邻居处理，不是动画帧。</p>
        {view.path.length > 0 && <details className="evidence-details"><summary>{view.pathFinal ? '已揭示的最终路径' : '到当前节点的回溯前缀'}</summary><p className="path-coordinates">{view.path.map(coordinate).join(' → ')}</p></details>}
        <EvidenceInspector view={view} inspected={inspected} />
      </section>
      <section className="briefing-panel" id="mission-briefing" aria-labelledby="briefing-title">
        <p className="eyebrow">YOUR REASONING</p><h3 id="briefing-title">这一关，要弄懂什么？</h3>
        <ul className="objectives">{mission.learningObjectives.map((objective, index) => <li key={objective}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{objective}</p></li>)}</ul>
        <div className="algorithm-summary"><label htmlFor="algorithm-choice">本关算法</label><select id="algorithm-choice" value={view.algorithm} disabled={view.state !== 'briefing' || view.conditionChange !== null} onChange={event => { try { setView(session.configureAlgorithm(event.target.value as Algorithm)); onProgress(); } catch (cause) { setError(String(cause)); } }}>{mission.algorithms.map(algorithm => <option key={algorithm} value={algorithm}>{names[algorithm]}</option>)}</select><p>{view.algorithm === 'bfs' ? 'FIFO 先入先出；h=0 不参与选择。' : '按 f、h、入队序号选择；h 为曼哈顿距离。'}<br />运行中冻结输入，结果来自本地确定性内核。{view.conditionChange && <>条件实验固定算法，仅改变一项地图条件。</>}</p></div>
        {view.state === 'briefing' && <div className="launch-state"><span className="neutral-badge">预测 → 事件 → 解释</span><p>{view.conditionChange ? '条件已改变，需重新预测。旧运行已保留，但不是本次答案。' : '先读任务，再作判断。提交前不会揭示实际答案。'}</p><button type="button" className="action-primary" onClick={() => act({type:'start_valid_run', runId:'run-' + crypto.randomUUID(), sessionId:view.sessionId ?? 'session-' + crypto.randomUUID()})}>开始预测 <span aria-hidden="true">→</span></button><small>操作后尝试保存到本机；请以上方存档状态为准。无远程 AI 调用。</small></div>}
        {view.checkpoint && <PredictionPanel key={view.runId + ':' + view.checkpoint.id} view={view} onAction={act} selected={selectedPrediction} onSelect={selectPrediction} />}
        {prediction && <section className={'prediction-feedback' + (prediction.correct ? ' is-correct' : '')} aria-labelledby="prediction-feedback-title" data-testid="prediction-feedback"><h4 id="prediction-feedback-title">{prediction.correct ? '这一步，符合规则。' : '不同选择，正好用证据比较。'}</h4><p>你选择 {coordinate(prediction.selected)}；实际选择 {coordinate(prediction.actual)}。</p><p data-testid="prediction-reason">{explainPrediction(view.algorithm, prediction.candidates, prediction.selected, prediction.actual)}</p><small>{prediction.checkpointId} · 提示 {prediction.hintLevel}/3 · {prediction.retryCount === 0 ? '首次作答' : '新的重跑尝试，保留首次结果'}</small></section>}
        {view.state === 'reflection' && <section className="run-summary" data-testid="run-summary"><p className="eyebrow">SEARCH IS NOT THE WHOLE STORY</p><h4>{view.outcome === 'found' ? '路径已找到，解释才刚开始。' : '不可达，也是有效的搜索结论。'}</h4><p>路径步数和搜索范围不是同一指标。已扩展 {view.metrics.expandedCount} 个节点，前沿峰值 {view.metrics.frontierPeak}。</p><p>继续到下方改变一次条件，再引用真实事件写解释。不以完成运行证明已经掌握。</p>{view.skippedCheckpoints.length > 0 && <p>因候选不足跳过 {view.skippedCheckpoints.length} 个预测点，不计入正确率。</p>}</section>}
        <p className="learning-stats" data-testid="first-attempt-stats">本任务已记录 {view.completedRuns.length} 次完整运行。首次预测符合规则 {view.firstAttempts.correct}/{view.firstAttempts.total}；重跑不覆盖首次结果。</p>
      </section>
    </div>
    <ReflectionPanel key={view.runId ?? 'unstarted'} mission={mission} view={view} onAction={act} />
    <ReportHistory reports={view.reports} />
  </div>;
}
