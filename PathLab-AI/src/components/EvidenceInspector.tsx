import type { SearchEvent } from '../../contracts/types';
import type { LearningView } from '../domain/learning/session';

const labels: Record<SearchEvent['type'], string> = {
  mission_started: '开始运行', prediction_requested: '等待预测', prediction_submitted: '提交预测',
  node_discovered: '发现节点', node_relaxed: '更新更短代价', node_selected: '选中节点', node_expanded: '扩展邻居', node_skipped: '跳过节点', frontier_snapshot: '有效前沿快照',
  path_updated: '回溯路径', run_paused: '暂停', run_resumed: '播放', run_finished: '运行结束', counterfactual_applied: '应用条件变更', diagnosis_generated: '生成本地反馈', reflection_completed: '完成证据解释',
};
function detail(event: SearchEvent): string {
  if ('node' in event.payload) return '(' + event.payload.node.x + ', ' + event.payload.node.y + ')' + ('reason' in event.payload ? ' · ' + event.payload.reason : '');
  if (event.type === 'prediction_submitted') return event.payload.correct ? '本次预测符合选择规则' : '本次预测与实际选择不同';
  if (event.type === 'prediction_requested') return event.payload.candidates.length + ' 个可见候选';
  if (event.type === 'frontier_snapshot') return event.payload.nodes.length + ' 个有效节点';
  if (event.type === 'path_updated') return event.payload.final ? '最终路径已揭示' : '到当前节点的前缀，不是最终路径';
  if (event.type === 'run_finished') return event.payload.status === 'found' ? '找到路径，' + event.payload.metrics.pathLength + ' 步' : '没有可达路径';
  return '';
}

export function EvidenceInspector({ view, inspected }: { view: LearningView; inspected: string | null }) {
  const node = view.nodes.find(n => n.node.x + ',' + n.node.y === inspected);
  return (
    <div className="evidence-area">
      <section className="node-inspector" aria-labelledby="node-title" data-testid="node-inspector">
        <h4 id="node-title">节点检查器 <span>{inspected ? '(' + inspected + ')' : '点击或键盘选择地图节点'}</span></h4>
        {node ? <dl className="node-values"><div><dt>g 已走步数</dt><dd>{node.g}</dd></div><div><dt>{view.algorithm === 'bfs' ? 'h 不参与 BFS' : 'h 曼哈顿估计'}</dt><dd>{node.h}</dd></div><div><dt>f = g + h</dt><dd>{node.f}</dd></div><div><dt>入队序号</dt><dd>{node.entrySequence}</dd></div><div><dt>parent</dt><dd>{node.parent ? '(' + node.parent.x + ', ' + node.parent.y + ')' : '起点，无父节点'}</dd></div></dl> : <p>该节点尚无已揭示的代价或父节点。不会显示未来搜索结果。</p>}
      </section>
      <details className="evidence-details">
        <summary>有效前沿 <span>{view.frontier.length} 个节点 · 按实际处理顺序</span></summary>
        <p>{view.algorithm === 'bfs' ? '队列先入先出。BFS 的 h=0 不表示离终点为零。' : '依次比较 f、h、入队序号。这里只展示当前有效条目，不含过期堆项。'}</p>
        <div className="table-scroll"><table aria-label="已揭示的有效前沿"><thead><tr><th scope="col">顺序</th><th scope="col">坐标</th><th scope="col">g</th><th scope="col">h</th><th scope="col">f</th><th scope="col">序号</th></tr></thead><tbody>{view.frontier.map((c, i) => <tr key={c.entrySequence}><td>{i + 1}</td><td>({c.node.x}, {c.node.y})</td><td>{c.g}</td><td>{c.h}</td><td>{c.f}</td><td>{c.entrySequence}</td></tr>)}</tbody></table></div>
        {!view.frontier.length && <p>当前没有已揭示的待处理节点。</p>}
      </details>
      <details className="evidence-details">
        <summary>事件时间线 <span>{view.events.length} 条已揭示事件</span></summary>
        <p>按真实追加顺序；列表只含已发生的事实，不预览未来。保留最近 30 条供阅读。</p>
        <ol className="event-timeline" aria-label="已揭示事件" data-testid="event-timeline">{view.events.slice(-30).map(event => <li key={event.eventId} data-event-type={event.type}><span className="event-step">{event.step}</span><div><strong>{labels[event.type]}</strong><span>{detail(event)}</span><small>{event.eventId}</small></div></li>)}</ol>
      </details>
    </div>
  );
}
