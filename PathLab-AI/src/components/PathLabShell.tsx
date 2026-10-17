'use client';

import { useState } from 'react';
import type { Algorithm } from '../../contracts/types';
import { missions } from '../data/missions';
import { LearningSession } from '../domain/learning/session';
import { LearningWorkbench } from './LearningWorkbench';

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

export function PathLabShell() {
  const [selectedId, setSelectedId] = useState('L01');
  const [sessions] = useState(() => new Map(missions.map(item => [item.id, new LearningSession(item, item.algorithms[0]!)])));
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
          <div className="learning-loop" aria-label="学习闭环：预测、回放、条件实验与证据报告已接入">
            <div className="loop-caption"><span>THE LEARNING LOOP</span><span>本地学习闭环 · 已接入</span></div>
            <ol>
              <li><span className="loop-number">01</span><div><strong>先作预测</strong><p>下一次，算法会选择哪个节点？</p></div><span className="loop-symbol" aria-hidden="true">?</span></li>
              <li><span className="loop-number">02</span><div><strong>用证据解释</strong><p>查看队列、代价与真实事件。</p></div><span className="loop-symbol" aria-hidden="true">≡</span></li>
              <li><span className="loop-number">03</span><div><strong>改变条件，再思考</strong><p>一条路封锁后，推理有何不同？</p></div><span className="loop-symbol" aria-hidden="true">↗</span></li>
            </ol>
            <p className="loop-note">先预测，再逐步揭示搜索证据。条件实验与复盘正在接入，不提前宣称学习完成。</p>
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
            <p className="sidebar-note">地图固定，推理可复现。<br />记录在当前页面内保留，刷新会丢失。</p>
          </aside>

          <LearningWorkbench key={mission.id} mission={mission} session={sessions.get(mission.id)!} />
        </section>

        <section id="development-status" className="development-status" aria-labelledby="development-title">
          <div><p className="eyebrow">BUILD IN THE OPEN</p><h2 id="development-title">完成到哪里，就展示到哪里。</h2><p>默认本地运行，不需要账号、API Key 或远程服务。</p></div>
          <ul>
            <li><span className="status-label status-label--ready">已就绪</span><span>四关简报 / BFS 与 A* / 预测门控 / Canvas 回放</span></li>
            <li><span className="status-label status-label--ready">已就绪</span><span>条件实验 / 证据报告 / 本地规则反馈</span></li>
            <li><span className="status-label">未连接</span><span>远程 AI / 进度保存 / JSON 导入导出</span></li>
          </ul>
        </section>
      </main>
      <footer className="site-footer"><span>PathLab AI <span aria-hidden="true">/</span> 让每一步，都有理由。</span><span>阶段 5 · 条件实验与证据复盘</span></footer>
    </>
  );
}
