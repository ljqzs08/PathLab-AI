'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Algorithm } from '../../contracts/types';
import { missions } from '../data/missions';
import { ProgressStore } from '../domain/learning/progress-store';
import { ProgressPanel } from './ProgressPanel';
import { LearningWorkbench } from './LearningWorkbench';
import { Playground } from './Playground';
import { AstarPrimer } from './AstarPrimer';
import { Naiwa } from './Naiwa';
import { IntroView } from './journey/IntroView';
import { GlossaryButton } from './journey/Glossary';
import { NaiwaPet } from './journey/NaiwaPet';
import { LifeView } from './journey/LifeView';
import { PicturesView } from './journey/PicturesView';
import { VideoView } from './journey/VideoView';
import { GameView } from './journey/GameView';

const algorithmNames: Record<Algorithm, string> = { bfs: 'BFS', astar: 'A*' };

const STATIONS = [
  { id: 'home', nav: '出发', title: '首页', blurb: '', minutes: 0 },
  { id: 'intro', nav: '认识 A*', title: '认识 A*：从零开始，一步一步', blurb: 'A* 是什么、要解决什么问题、g/h/f 三个字母什么意思、它怎么挑路，一页只讲一件事。', minutes: 8 },
  { id: 'life', nav: '生活里的 A*', title: '生活里的 A*：导航和游戏都在用', blurb: '用刚学会的 g/h/f 看懂手机导航，再在小镇里点哪走哪，找找 A* 藏在哪。', minutes: 5 },
  { id: 'pictures', nav: '图解 A*', title: '四张图看懂 A*', blurb: '输入输出、基本原理、核心公式、应用场景，一张图讲一件事，看完答一题。', minutes: 6 },
  { id: 'video', nav: '视频课', title: '3 分钟视频 + 亲手算一遍', blurb: '看一段带例题的讲解视频，再把视频里的表格自己填出来。', minutes: 8 },
  { id: 'primer', nav: '互动入门课', title: '互动入门课：先测、再学、再测', blurb: '7 章互动课，逐轮预测 A* 的选择，最后生成前后测掌握度报告。', minutes: 10 },
  { id: 'game', nav: '闯关游戏', title: '奶娃送奶大冒险', blurb: '画最短路、f 值快问快答、当迷宫设计师，在游戏里练熟 A*。', minutes: 10 },
  { id: 'lab', nav: '任务工作台', title: '任务工作台：四个真实关卡', blurb: '校园配送四关，先预测再看证据，支持条件实验、复盘报告与本机存档。', minutes: 15 },
  { id: 'playground', nav: '自由实验', title: '自由实验室', blurb: '自己画地图，比较笨办法（BFS）与 A* 谁试的格子更少。', minutes: 5 },
] as const;
type StationId = typeof STATIONS[number]['id'];
const ALIASES: Record<string, StationId> = { top: 'home', 'astar-primer': 'primer', 'mission-workspace': 'lab', 'free-playground': 'playground' };
const stationOf = (hash: string): StationId | null => {
  const id = decodeURIComponent(hash.replace(/^#\/?/, ''));
  if (id === '') return 'home';
  return STATIONS.some(item => item.id === id) ? id as StationId : ALIASES[id] ?? null;
};

const HOME_LINES = [
  <>嗨！我是<b>奶娃</b>，你的 A* 学习小向导。</>,
  <><b>A*</b>（读作“A 星”）是一种帮电脑<b>找最短路线</b>的方法。你给它一张地图、起点和终点，它就算出最短的路。</>,
  <>不用任何编程基础。点“从零开始”，我先一页一页讲清楚 A* 是什么、<b>g、h、f</b> 是什么意思，再带你去玩。</>,
];

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
  const [store] = useState(() => new ProgressStore(missions));
  const progress = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const { selectedId, sessions } = progress;
  useEffect(() => {
    let storage: Storage | null = null;
    try { storage = window.localStorage; } catch { /* Storage can be disabled; core learning stays in memory. */ }
    store.load(storage, new Date().toISOString());
  }, [store]);
  const saveProgress = useCallback(() => store.changed(new Date().toISOString()), [store]);
  const [view, setView] = useState<StationId>('home');
  const [visited, setVisited] = useState<ReadonlySet<StationId>>(() => new Set<StationId>(['home']));
  const moved = useRef(false);
  useEffect(() => {
    const sync = (event?: HashChangeEvent) => {
      const next = stationOf(window.location.hash);
      if (!next) return;
      // Opening a deep link keeps the browser's default focus; only in-app moves pull focus to the new station.
      moved.current = event !== undefined;
      setView(next);
      setVisited(current => (current.has(next) ? current : new Set([...current, next])));
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    window.scrollTo(0, 0);
    document.getElementById('view-' + view)?.focus({ preventScroll: true });
    const tab = document.querySelector<HTMLElement>('.station-nav a[aria-current="page"]');
    tab?.parentElement?.parentElement?.scrollTo({ left: tab.offsetLeft - 12 });
  }, [view]);
  const go = useCallback((id: StationId) => {
    if (stationOf(window.location.hash) === id) { window.scrollTo(0, 0); return; }
    window.location.hash = id;
  }, []);
  const mission = missions.find((item) => item.id === selectedId) ?? missions[0];
  if (!mission) return <main><h1>暂无关卡数据</h1></main>;

  const index = STATIONS.findIndex(item => item.id === view);
  const station = (id: StationId, body: ReactNode) => {
    if (!visited.has(id)) return null;
    const order = STATIONS.findIndex(item => item.id === id);
    const meta = STATIONS[order]!;
    const previous = STATIONS[order - 1], next = STATIONS[order + 1];
    return <section key={id} id={'view-' + id} className={'station station--' + id} hidden={view !== id} tabIndex={-1} aria-label={meta.title} data-testid={'view-' + id}>
      {id !== 'home' && <header className="station-head">
        <p className="eyebrow">第 {order} 站 / {STATIONS.length - 1}{meta.minutes ? ' · 约 ' + meta.minutes + ' 分钟' : ''}</p>
        <h1>{meta.title}</h1>
        <p>{meta.blurb}</p>
      </header>}
      {body}
      {id !== 'home' && <nav className="station-pager" aria-label="上一站和下一站">
        {previous ? <button type="button" className="action-quiet" onClick={() => go(previous.id)}>← {previous.id === 'home' ? '回到首页' : '上一站：' + previous.nav}</button> : <span />}
        {next ? <button type="button" className="action-primary" onClick={() => go(next.id)} data-testid="station-next">下一站：{next.nav} →</button> : <button type="button" className="action-quiet" onClick={() => go('home')}>回到首页</button>}
      </nav>}
    </section>;
  };

  return (
    <>
      <a className="skip-link" href={'#view-' + view} onClick={event => { event.preventDefault(); document.getElementById('view-' + view)?.focus(); }}>跳到本页内容</a>
      <header className="site-header">
        <a className="brand" href="#home">
          <span className="brand-mark"><BrandMark /></span>
          <span className="brand-wordmark">PathLab<span className="brand-ai">AI</span><small>路径学习实验室</small></span>
        </a>
        <span className="mode-badge"><span className="status-dot" aria-hidden="true" />本地模式<span className="mode-detail"> · 无需密钥</span></span>
      </header>
      <nav className="station-nav" aria-label="学习站点">
        <ol>
          {STATIONS.map((item, order) => <li key={item.id}>
            <a href={'#' + item.id} aria-current={view === item.id ? 'page' : undefined} data-testid={'nav-' + item.id}>
              <span className="station-dot" aria-hidden="true">{order === 0 ? '⌂' : visited.has(item.id) && view !== item.id ? '✓' : order}</span>{item.nav}
            </a>
          </li>)}
        </ol>
        <GlossaryButton />
        <p className="station-progress" aria-live="polite">已到过 {[...visited].filter(id => id !== 'home').length} / {STATIONS.length - 1} 站{index > 0 ? ' · 当前第 ' + index + ' 站' : ''}</p>
      </nav>

      <main id="top" className="page-shell">
        {station('home', <>
        <section className="intro intro--journey" aria-labelledby="intro-title">
          <div className="intro-copy">
            <p className="eyebrow"><span aria-hidden="true">◇</span> 零基础 · 不需要编程知识 · 跟着奶娃一步一步来</p>
            <h1 id="intro-title">A* 是什么？<br /><span>一种帮电脑找最短路线的方法。</span></h1>
            <p className="intro-description">手机导航给你规划路线、游戏里角色自己绕开墙走过去、仓库机器人在货架间穿行，背后常常都是 A*。<br className="desktop-break" />它的秘诀是给地图上每个格子打一个分：<b>g</b>（已经走了几步）+ <b>h</b>（估计还要几步）= <b>f</b>（总分），然后总是先试总分最小的格子。<br className="desktop-break" />看不懂也没关系，第 1 站会一页一页讲清楚。</p>
            <div className="intro-actions">
              <button type="button" className="primary-link" onClick={() => go('intro')} data-testid="start-journey">第一次学？从零开始认识 A* <Arrow /></button>
              <button type="button" className="secondary-link" onClick={() => go('lab')}>已经会了，直接去任务工作台</button>
            </div>
          </div>
          <Naiwa lines={HOME_LINES} size="lg" />
        </section>
        <section className="route" aria-labelledby="route-title">
          <div className="section-label"><h2 id="route-title">学习路线：{STATIONS.length - 1} 站，点哪站去哪站</h2><span>建议按顺序走，约 1 小时</span></div>
          <ol className="route-list">
            {STATIONS.slice(1).map((item, order) => <li key={item.id}>
              <button type="button" className="route-card" onClick={() => go(item.id)} data-testid={'route-' + item.id}>
                <span className="route-number">{visited.has(item.id) ? '✓' : order + 1}</span>
                <strong>{item.nav}</strong>
                <span>{item.blurb}</span>
                <small>约 {item.minutes} 分钟{visited.has(item.id) ? ' · 已到过' : ''}</small>
              </button>
            </li>)}
          </ol>
        </section>
        <section className="home-extra" aria-label="学习方法">
          <div className="learning-loop" aria-label="学习闭环：预测、回放、条件实验与证据报告已接入">
            <div className="loop-caption"><span>THE LEARNING LOOP</span><span>本地学习闭环 · 已接入</span></div>
            <ol>
              <li><span className="loop-number">01</span><div><strong>先作预测</strong><p>下一次，算法会选择哪个节点？</p></div><span className="loop-symbol" aria-hidden="true">?</span></li>
              <li><span className="loop-number">02</span><div><strong>用证据解释</strong><p>查看队列、代价与真实事件。</p></div><span className="loop-symbol" aria-hidden="true">≡</span></li>
              <li><span className="loop-number">03</span><div><strong>改变条件，再思考</strong><p>一条路封锁后，推理有何不同？</p></div><span className="loop-symbol" aria-hidden="true">↗</span></li>
            </ol>
            <p className="loop-note">先预测，再逐步揭示搜索证据。条件实验与证据复盘已接入，但完成记录不等于已经掌握。</p>
          </div>
        </section>
        </>)}

        {station('intro', <IntroView onFinish={() => go('life')} />)}
        {station('life', <LifeView />)}
        {station('pictures', <PicturesView />)}
        {station('video', <VideoView />)}
        {station('primer', <AstarPrimer onTryMission={id => {
          if (progress.ready) store.select(id, new Date().toISOString());
          go('lab');
        }} />)}
        {station('game', <GameView onGoLab={() => go('lab')} />)}

        {station('lab', <>
        <ProgressPanel store={store} progress={progress} missions={missions} />

        <section id="mission-workspace" tabIndex={-1} className="workspace" aria-label="任务工作台">
          <aside className="mission-sidebar" aria-labelledby="mission-list-title">
            <div className="section-label"><h2 id="mission-list-title">任务档案</h2><span>4 个固定关卡</span></div>
            <div className="mission-list">
              {missions.map((item, index) => (
                <button key={item.id} type="button" className="mission-card" aria-pressed={item.id === mission.id} aria-controls="mission-content" disabled={!progress.ready} onClick={() => store.select(item.id, new Date().toISOString())} data-testid={'mission-' + item.id}>
                  <span className="mission-card-meta"><span>MISSION {String(index + 1).padStart(2, '0')}</span><span aria-hidden="true">{item.id === mission.id ? '↗' : '→'}</span></span>
                  <strong>{item.title}</strong>
                  <span className="mission-card-description">{item.learningObjectives[0]}</span>
                  <span className="mission-card-bottom"><span>{item.algorithms.map((algorithm) => algorithmNames[algorithm]).join(' / ')}</span><span>{item.id === mission.id ? '正在查看' : '查看简报'}</span></span>
                </button>
              ))}
            </div>
            <p className="sidebar-note">地图固定，推理可复现。<br />进度仅存在本机，请留意存档状态并导出备份。</p>
          </aside>

          {progress.ready ? <LearningWorkbench key={mission.id + ":" + progress.generation} mission={mission} session={sessions.get(mission.id)!} onProgress={saveProgress} /> : <p role="status">正在检查本机进度…</p>}
        </section>
        </>)}

        {station('playground', <Playground />)}

        {view === 'home' && <section id="development-status" className="development-status" aria-labelledby="development-title">
          <div><p className="eyebrow">BUILD IN THE OPEN</p><h2 id="development-title">完成到哪里，就展示到哪里。</h2><p>默认本地运行，不需要账号、API Key 或远程服务。</p></div>
          <ul>
            <li><span className="status-label status-label--ready">已就绪</span><span>点击式 8 站学习路线（第 1 站一步一步认识 A* 与 g/h/f）/ 奶娃向导 / 名词小词典 / 图解与视频课 / 跟视频算例题 / 三关闯关游戏</span></li>
            <li><span className="status-label status-label--ready">已就绪</span><span>A* 零基础入门：学前测 → 5 章（先猜后看、思考过程逐条浮现）→ 学后测与掌握度报告</span></li>
            <li><span className="status-label status-label--ready">已就绪</span><span>四关简报 / BFS 与 A* / 预测门控 / Canvas 回放</span></li>
            <li><span className="status-label status-label--ready">已就绪</span><span>条件实验 / 证据报告 / 本地规则反馈 / 本机存档 / JSON 备份</span></li>
            <li><span className="status-label status-label--ready">已就绪</span><span>自由地图编辑 / 撤销 / 双算法预测对比 / 搜索回放</span></li>
            <li><span className="status-label status-label--ready">辅助复盘</span><span>DeepSeek 网页辅助：本机整理、手动复制提问；站内 API 复盘仍为可选</span></li>
          </ul>
        </section>}
      </main>
      <footer className="site-footer"><span>PathLab AI <span aria-hidden="true">/</span> 让每一步，都有理由。</span><span>v4 · 点击式学习站 · 奶娃向导 · 闯关游戏</span></footer>
      <NaiwaPet station={view} />
    </>
  );
}
