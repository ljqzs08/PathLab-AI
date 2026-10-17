'use client';

import { useState, type CSSProperties } from 'react';
import type { Algorithm, LevelDefinition } from '../../contracts/types';
import { missions } from '../data/missions';

const algorithmNames: Record<Algorithm, string> = { bfs: 'BFS', astar: 'A*' };

function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M10 29V11h20v18H20V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="29" r="3.5" fill="currentColor" />
      <circle cx="20" cy="20" r="3.5" fill="#ffb783" />
    </svg>
  );
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function StaticMap({ mission }: { mission: LevelDefinition }) {
  const { grid, start, goal } = mission;
  return (
    <figure className="map-figure">
      <div className="map-surface">
        <span className="map-axis" aria-hidden="true">N ↑ · 校园路网</span>
        <div
          className="map-grid"
          role="img"
          aria-label={
            mission.title + '的静态地图，' + grid.width + '列' + grid.height + '行。起点坐标（' + start.x + '，' + start.y + '），终点坐标（' + goal.x + '，' + goal.y + '）。坐标从零开始；未计算路径。'
          }
          style={{ '--grid-columns': grid.width } as CSSProperties}
          data-testid="map-grid"
          data-level-id={mission.id}
        >
          {grid.rows.flatMap((row, y) => [...row].map((cell, x) => {
            const isStart = x === start.x && y === start.y;
            const isGoal = x === goal.x && y === goal.y;
            const kind = isStart ? 'start' : isGoal ? 'goal' : cell === '#' ? 'wall' : 'road';
            return (
              <span className={'map-cell map-cell--' + kind} key={x + ',' + y} aria-hidden="true" data-cell={x + ',' + y} data-kind={kind}>
                {isStart ? 'S' : isGoal ? 'G' : cell === '#' ? <span className="wall-mark" /> : <span className="road-dot" />}
              </span>
            );
          }))}
        </div>
        <span className="map-origin" aria-hidden="true">固定地图 / {grid.width} × {grid.height}</span>
      </div>
      <figcaption>
        <span><i className="legend-swatch legend-swatch--start" aria-hidden="true" />S 起点</span>
        <span><i className="legend-swatch legend-swatch--goal" aria-hidden="true" />G 终点</span>
        <span><i className="legend-swatch legend-swatch--wall" aria-hidden="true" />障碍</span>
        <span><i className="legend-swatch legend-swatch--road" aria-hidden="true" />可通行</span>
      </figcaption>
    </figure>
  );
}

export function PathLabShell() {
  const [selectedId, setSelectedId] = useState('L01');
  const mission = missions.find((item) => item.id === selectedId) ?? missions[0];
  if (!mission) return <main><h1>暂无关卡数据</h1></main>;

  return (
    <>
      <a className="skip-link" href="#mission-workspace">跳到任务工作台</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PathLab AI 首页">
          <span className="brand-mark"><BrandMark /></span>
          <span className="brand-wordmark">PathLab<span className="brand-ai">AI</span><small>路径学习实验室</small></span>
        </a>
        <nav className="header-nav" aria-label="页面导航">
          <a href="#mission-workspace">任务工作台</a>
          <a href="#development-status">开发边界</a>
        </nav>
        <span className="mode-badge"><span className="status-dot" aria-hidden="true" />本地模式<span className="mode-detail"> · 无需密钥</span></span>
      </header>

      <main id="top" className="page-shell">
        <section className="intro" aria-labelledby="intro-title">
          <div className="intro-copy">
            <p className="eyebrow"><span aria-hidden="true">◇</span> THINK FIRST. TRACE NEXT.</p>
            <h1 id="intro-title">别急着找终点。<br /><span>先解释下一步。</span></h1>
            <p className="intro-description">成为校园配送调度员，把“会背算法”变成“能解释选择”。<br className="desktop-break" />从一个固定任务开始，逐步建立可验证的推理。</p>
            <a className="primary-link" href="#mission-workspace">选择一项任务 <Arrow /></a>
          </div>
          <div className="learning-loop" aria-label="规划中的学习闭环，尚未接入">
            <div className="loop-caption"><span>THE LEARNING LOOP</span><span>学习闭环 · 规划中</span></div>
            <ol>
              <li><span className="loop-number">01</span><div><strong>先作预测</strong><p>下一次，算法会选择哪个节点？</p></div><span className="loop-symbol" aria-hidden="true">?</span></li>
              <li><span className="loop-number">02</span><div><strong>用证据解释</strong><p>查看队列、代价与真实事件。</p></div><span className="loop-symbol" aria-hidden="true">≡</span></li>
              <li><span className="loop-number">03</span><div><strong>改变条件，再思考</strong><p>一条路封锁后，推理有何不同？</p></div><span className="loop-symbol" aria-hidden="true">↗</span></li>
            </ol>
            <p className="loop-note">当前可阅读简报与地图；预测、搜索和复盘将在后续阶段接入。</p>
          </div>
        </section>

        <section id="mission-workspace" tabIndex={-1} className="workspace" aria-label="任务工作台">
          <aside className="mission-sidebar" aria-labelledby="mission-list-title">
            <div className="section-label"><h2 id="mission-list-title">任务档案</h2><span>4 个固定关卡</span></div>
            <div className="mission-list">
              {missions.map((item, index) => (
                <button key={item.id} type="button" className="mission-card" aria-pressed={item.id === mission.id} aria-controls="mission-content" onClick={() => setSelectedId(item.id)} data-testid={'mission-' + item.id}>
                  <span className="mission-card-meta"><span>MISSION {String(index + 1).padStart(2, '0')}</span><span aria-hidden="true">{item.id === mission.id ? '↗' : '→'}</span></span>
                  <strong>{item.title}</strong>
                  <span className="mission-card-description">{item.learningObjectives[0]}</span>
                  <span className="mission-card-bottom"><span>{item.algorithms.map((algorithm) => algorithmNames[algorithm]).join(' / ')}</span><span>{item.id === mission.id ? '正在查看' : '查看简报'}</span></span>
                </button>
              ))}
            </div>
            <p className="sidebar-note">地图固定，推理可复现。<br />当前选择仅在本次页面中保留。</p>
          </aside>

          <div className="mission-content" id="mission-content">
            <p className="sr-only" role="status">已选择 {mission.id} {mission.title}。静态预览，尚未运行搜索。</p>
            <div className="mission-heading">
              <div><p className="eyebrow">校园调度 / {mission.id}</p><h2 data-testid="mission-title">{mission.title}</h2></div>
              <span className="neutral-badge">简报可读 · 尚未运行</span>
            </div>
            <p className="mission-narrative">{mission.narrative}</p>
            <div className="mission-panels">
              <section className="map-panel" aria-labelledby="map-title">
                <div className="panel-heading"><h3 id="map-title">校园任务地图</h3><span>静态预览</span></div>
                <StaticMap mission={mission} />
                <div className="map-coordinates"><span>S 起点 <strong>({mission.start.x}, {mission.start.y})</strong></span><span>G 终点 <strong>({mission.goal.x}, {mission.goal.y})</strong></span><span>坐标从 0 开始</span></div>
                <p className="map-note">仅展示原始关卡；没有计算路径、扩展节点或预测答案。</p>
              </section>
              <section className="briefing-panel" id="mission-briefing" aria-labelledby="briefing-title">
                <p className="eyebrow">YOUR BRIEFING</p>
                <h3 id="briefing-title">这一关，要弄懂什么？</h3>
                <ul className="objectives">{mission.learningObjectives.map((objective, index) => <li key={objective}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{objective}</p></li>)}</ul>
                <div className="algorithm-summary"><span>计划支持</span><strong>{mission.algorithms.map((algorithm) => algorithmNames[algorithm]).join(' / ')}</strong><p>{mission.algorithms.includes('bfs') ? 'BFS 按队列顺序选择节点。' : 'A* 按 f、h、入队序号选择节点。'}<br />本阶段尚未接入算法内核。</p></div>
                <div className="launch-state"><span className="neutral-badge">应用阶段 1</span><p>先建立可靠的工作台，<br />再接入可验证的搜索。</p><button type="button" disabled aria-describedby="launch-help">开始预测 <span aria-hidden="true">→</span></button><small id="launch-help">后续阶段开放；当前不会产生学习记录。</small></div>
              </section>
            </div>
          </div>
        </section>

        <section id="development-status" className="development-status" aria-labelledby="development-title">
          <div><p className="eyebrow">BUILD IN THE OPEN</p><h2 id="development-title">完成到哪里，就展示到哪里。</h2><p>默认本地运行，不需要账号、API Key 或远程服务。</p></div>
          <ul>
            <li><span className="status-label status-label--ready">已就绪</span><span>应用骨架 / 四关简报 / 静态地图</span></li>
            <li><span className="status-label">待接入</span><span>确定性搜索 / 预测回放 / 本地诊断</span></li>
            <li><span className="status-label">未连接</span><span>远程 AI / 进度保存 / JSON 导入导出</span></li>
          </ul>
        </section>
      </main>
      <footer className="site-footer"><span>PathLab AI <span aria-hidden="true">/</span> 让每一步，都有理由。</span><span>阶段 1 · 本地应用骨架</span></footer>
    </>
  );
}
