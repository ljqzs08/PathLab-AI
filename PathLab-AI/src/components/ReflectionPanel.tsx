import { RemoteFeedback } from './RemoteFeedback';
import { useEffect, useRef, useState } from 'react';
import type { LevelDefinition } from '../../contracts/types';
import type { LearningAction, LearningView } from '../domain/learning/session';
import type { LocalFeedbackResult } from '../domain/learning/diagnose';
import type { ReflectionReport, RunComparison } from '../domain/learning/report';

const changeName = (change: LevelDefinition['counterfactual']) => (change.type === 'block_cell' ? '封锁格子 ' : '移动终点到 ') + '(' + change.cell.x + ', ' + change.cell.y + ')';
const number = (n: number | null) => n === null ? '不可达 / 无数值' : n;
const signed = (n: number | null) => n === null ? '不计算差值' : n > 0 ? '+' + n : String(n);

function Comparison({ comparison }: { comparison: RunComparison }) {
  return <section className="comparison-card" aria-labelledby="comparison-title" data-testid="condition-comparison">
    <p className="eyebrow">ONE CHANGE. TWO REAL RUNS.</p><h4 id="comparison-title">只改条件，比较真实结果。</h4>
    <p>{changeName(comparison.change)}。算法保持一致；差值为“本次 − 上次”，不是耗时差异。</p>
    <div className="table-scroll"><table aria-label="同算法条件修改前后结果"><thead><tr><th scope="col">指标</th><th scope="col">上次</th><th scope="col">本次</th><th scope="col">差值</th></tr></thead><tbody>
      <tr><th scope="row">最短路径步数</th><td data-testid="comparison-before-path">{number(comparison.previous.metrics.pathLength)}</td><td data-testid="comparison-after-path">{number(comparison.current.metrics.pathLength)}</td><td>{signed(comparison.delta.pathLength)}</td></tr>
      <tr><th scope="row">扩展节点数</th><td data-testid="comparison-before-expanded">{comparison.previous.metrics.expandedCount}</td><td data-testid="comparison-after-expanded">{comparison.current.metrics.expandedCount}</td><td>{signed(comparison.delta.expandedCount)}</td></tr>
    </tbody></table></div>
    <details className="evidence-details"><summary>核对两次运行的终止证据</summary><dl className="comparison-sources"><div><dt>上次 · 修订 {comparison.previous.gridRevision}</dt><dd>{comparison.previous.evidenceEventId}</dd></div><div><dt>本次 · 修订 {comparison.current.gridRevision}</dt><dd>{comparison.current.evidenceEventId}</dd></div><div><dt>条件变更</dt><dd>{comparison.changeEventId}</dd></div></dl></details>
  </section>;
}

function LocalFeedback({ result }: { result: LocalFeedbackResult }) {
  return <section className="local-feedback" aria-labelledby="local-feedback-title" data-testid="local-feedback">
    <div className="panel-heading"><h4 id="local-feedback-title">本地证据反馈</h4><span className="neutral-badge">规则模板 · 未调用模型</span></div>
    <p>{result.feedback.summary}</p><p className="diagnosis-boundary">{result.feedback.primaryErrorType ? '行为记录：本次 FIFO 选择不一致；不是能力或心理标签。' : '原因标签：未判定 / 证据不足。'}</p>
    <p>{result.feedback.nextQuestion}</p>
    <details className="evidence-details"><summary>反馈引用的真实事件</summary><ol className="feedback-evidence">{result.feedback.evidence.map(evidence => <li key={evidence.eventId} data-event-id={evidence.eventId}><p>{result.request.facts.events.find(e => e.eventId === evidence.eventId)!.description}</p><small>{evidence.eventId} · {evidence.factPath}</small></li>)}</ol></details>
  </section>;
}

function ReportSnapshot({ report, historical = false }: { report: ReflectionReport; historical?: boolean }) {
  const checks: [boolean, string][] = [[report.completion.predictionsAttempted, '已提交真实预测'], [report.completion.conditionRunCompleted, '已完成条件修改后的新运行'], [report.completion.evidenceExplanationProvided, '已引用事实并填写解释'], [report.completion.comparisonEvidenceProvided, '已引用条件变更与本次终止证据']];
  return <section className="report-snapshot" data-testid={historical ? 'historical-report' : 'reflection-report'}>
    <span className="neutral-badge">{report.completion.recordComplete ? '复盘记录齐备' : '部分记录 · 复盘未齐备'}</span>
    <h4>保留你的解释，也保留判断边界。</h4>
    <ul className="report-checks">{checks.map(([done,label]) => <li key={label}><span aria-hidden="true">{done ? '✓' : '○'}</span>{done ? label : label.replace(/^已/, '尚未')}</li>)}</ul>
    <p>“记录齐备”仅表示预测、条件运行与引用解释都有记录，不代表已掌握，也不代表自由文本解释已被验证正确。</p>
    {report.explanation ? <><h5>你的解释（本地纯文本）</h5><blockquote data-testid={historical ? 'historical-explanation' : 'report-explanation'}>{report.explanation}</blockquote><p className="report-citations">引用：{report.evidenceEventIds.join(' · ')}</p></> : <p>尚无证据解释；没有补写或替你作答。</p>}
    <small>报告随进度尝试保存到本机，请以上方存档状态为准；不上传云端或模型。</small>
  </section>;
}

export function ReflectionPanel({ mission, view, onAction }: { mission: LevelDefinition; view: LearningView; onAction: (action: LearningAction) => void }) {
  const [explanation, setExplanation] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (['reflection', 'counterfactual', 'report'].includes(view.state)) heading.current?.focus(); }, [view.state]);
  if (!['reflection', 'counterfactual', 'report'].includes(view.state) || !view.diagnosis) return null;
  const facts = view.diagnosis.request.facts.events;
  const change = mission.counterfactual, cell = change.cell;
  const alreadyApplied = change.type === 'block_cell' ? view.input.grid.rows[cell.y]?.[cell.x] !== '.' : view.input.goal.x === cell.x && view.input.goal.y === cell.y;
  if (view.state === 'counterfactual') return <section className="reflection-panel condition-panel" aria-labelledby="reflection-title" data-testid="condition-panel" onKeyDown={e => { if(e.key==='Escape') { e.preventDefault(); onAction({type:'cancel'}); } }}>
    <p className="eyebrow">CHANGE THE CONDITION, NOT THE EVIDENCE</p><h3 id="reflection-title" ref={heading} tabIndex={-1}>先提出预期，再重新验证。</h3>
    <p>本关预设条件：<strong>{changeName(change)}</strong>。保留刚才的运行与报告，改变后回到简报；你仍需重新预测，旧结果不会充当新答案。</p>
    <p>这是同算法的单一条件实验。现在先想：路径步数与扩展数会怎样变化？下一次运行之后再用实际证据核对。</p>
    <div className="reflection-actions"><button type="button" className="action-primary" data-testid="apply-condition" disabled={alreadyApplied} onClick={() => onAction({type:'apply_valid_change',change})}>应用条件，准备新运行</button><button type="button" className="action-quiet" onClick={() => onAction({type:'cancel'})}>取消，返回复盘</button></div>
    {alreadyApplied && <p className="control-help">当前地图已经应用这一预设条件，不能伪造无变化实验。可取消查看结果，或使用“重置本任务”回原图；历史记录会保留。</p>}
  </section>;
  const result = view.state === 'report' && view.report ? view.report : view.diagnosis;
  return <section className="reflection-panel" aria-labelledby="reflection-title" data-testid="reflection-panel">
    <div className="reflection-heading"><div><p className="eyebrow">EXPLAIN WITH EVIDENCE</p><h3 id="reflection-title" ref={heading} tabIndex={-1}>{view.state === 'report' ? '这次推理，留下了什么证据？' : '搜索结束，不等于理解结束。'}</h3></div><button type="button" className="action-secondary" data-testid="open-condition" onClick={() => onAction({type:'experiment'})}>{view.state === 'report' ? '再做条件实验' : '改变一次条件'}</button></div>
    <div className="reflection-columns"><LocalFeedback result={result} />{view.comparison ? <Comparison comparison={view.comparison} /> : <section className="comparison-card"><p className="eyebrow">THE NEXT QUESTION</p><h4>还缺一次条件实验。</h4><p>仅完成当前搜索，还不能比较变化。选择“改变一次条件”，保留本次结果，并用新运行检验预期；不需要预测全对。</p></section>}</div>
    <RemoteFeedback key={result.request.runId + ':' + result.request.gridRevision} result={result} />
    {view.state === 'reflection' ? <form className="reflection-form" onSubmit={e => {e.preventDefault();onAction({type:'complete_reflection',explanation,evidenceEventIds:selected});}}>
      <fieldset><legend>1. 引用本次已揭示的事实</legend><p id="evidence-help">选择支持你解释的事件。条件复盘至少应引用条件变更和本次终止结果；上次结果可从对照表核对。</p><div className="reflection-facts">{facts.map(fact => <label key={fact.eventId}><input type="checkbox" checked={selected.includes(fact.eventId)} data-fact-type={fact.type} data-event-id={fact.eventId} aria-describedby="evidence-help" onChange={e => setSelected(e.target.checked ? [...selected,fact.eventId] : selected.filter(id=>id!==fact.eventId))} /><span>{fact.description}<small>{fact.eventId}</small></span></label>)}</div></fieldset>
      <label className="explanation-label" htmlFor="reflection-explanation">2. 用自己的话解释</label><textarea id="reflection-explanation" rows={5} maxLength={500} value={explanation} onChange={e=>setExplanation(e.target.value)} aria-describedby="reflection-help" placeholder="改变了哪个条件？两次实际结果有什么差别？你的证据是什么？" />
      <p id="reflection-help">{explanation.length}/500 字 · 只保留本地纯文本，不自动判定解释正确，也不发送给模型。{!view.comparison ? ' 尚未完成条件实验，生成的报告会明确标为部分记录。' : ''}</p>
      <div className="reflection-actions"><button type="submit" className="action-primary" data-testid="generate-report" disabled={!explanation.trim() || selected.length===0}>生成证据报告</button><button type="button" className="action-quiet" data-testid="partial-report" onClick={()=>onAction({type:'complete_reflection',explanation:'',evidenceEventIds:[]})}>仅生成无解释的部分记录</button></div>
      {view.report && <details className="saved-report"><summary>查看已生成的本次报告快照</summary><ReportSnapshot report={view.report} /></details>}
    </form> : view.report && <ReportSnapshot report={view.report} />}
  </section>;
}

export function ReportHistory({ reports }: { reports: ReflectionReport[] }) {
  if (reports.length === 0) return null;
  return <details className="saved-report report-history" data-testid="report-history"><summary>报告历史（{reports.length}）</summary><p>按生成顺序保留；重置当前任务不会删除这里的快照。存档成功后可在刷新后恢复；建议导出 JSON 备份。</p>{reports.map((report,index)=><div key={index}><p className="eyebrow">报告 {index+1} · {report.algorithm === 'bfs' ? 'BFS' : 'A*'} · 修订 {report.gridRevision}</p><ReportSnapshot report={report} historical /></div>)}</details>;
}
