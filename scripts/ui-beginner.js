/* E037: vanilla-JS additive lesson. No network, dependency, grade or original-save writes. */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('pl-coach-data').textContent);
  const same = (a, b) => Boolean(a && b && a.x === b.x && a.y === b.y);
  const coord = n => '第 ' + (n.y + 1) + ' 行第 ' + (n.x + 1) + ' 列';
  const key = n => n.x + ',' + n.y;
  const names = ['看懂地图', '算一次分', '猜下一格', '看搜索过程', '换题自测'];
  const STORE = 'pathlab-coach-e037';
  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, value) { try { localStorage.setItem(k, value); return true; } catch { return false; } },
    remove(k) { try { localStorage.removeItem(k); return true; } catch { return false; } },
  };
  let state = { stage: 0, done: [], neighbor: null, fValue: '', fCorrect: false, pick: null, replay: 0, answers: {}, quizChecked: false, firstScore: null, quizAttempts: 0, remember: false };
  try {
    const saved = JSON.parse(storage.get(STORE));
    // Persist only completed exercises and the last section; never infer mastery from visits.
    if (saved && saved.schema === 1 && Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage < 5 && Array.isArray(saved.done) && saved.done.every(i => Number.isInteger(i) && i >= 0 && i <= 3)) {
      state.stage = saved.stage; state.done = [...new Set(saved.done)]; state.remember = true;
      state.fCorrect = state.done.includes(1); state.fValue = state.fCorrect ? '6' : '';
    }
  } catch { /* Malformed or unavailable storage is non-fatal. */ }
  let host, anchor, lesson, dialog, opener, timer = null, toastTimer, toolbar;
  const candidateFrame = data.frames[1];
  const candidates = [...candidateFrame.frontier].sort((a,b) => a.entrySequence - b.entrySequence);
  const QUESTIONS = [
    { title: '① 换一组数字：到某格的 g = 4，h = 3，它的 f 是多少？', options: ['1', '7', '12'], answer: 1, why: 'f = g + h，所以 4 + 3 = 7。g 是当前已知的到达代价，h 是剩余代价估计。', target: 1 },
    { title: '② 两个待选格：甲 g=2、h=6；乙 g=4、h=3。A* 先选谁？', options: ['乙，因为总分 7 小于 8', '甲，因为已经走的 g 更小', '甲，因为估计剩余的 h 更大'], answer: 0, why: '先比较 f。甲 2+6=8，乙 4+3=7，所以选乙。不能只看 g 或只看 h。', target: 2 },
    { title: '③ 墙挡住直走方向。A* 会怎样？', options: ['每一步都必须更靠近终点', '把墙也当作可以走的格子', '会考虑绕路；h 的估计不等于实际路长'], answer: 2, why: '这里的 h 假装没有墙，所以可能估少。搜到墙附近后要绕行，不保证每一步都更接近终点。', target: 3 },
    { title: '④ 能不能把“横向差 + 纵向差”直接用于任何地图？', options: ['能，它永远保证最短路线', '不能：本课前提是上下左右走、每步代价 1；换规则要重新检查估计', '不能，因为它只能在没有墙时使用'], answer: 1, why: '有墙仍可以用这个下界；但允许斜走、代价不同等规则改变时，必须重新检查估计是否合适。本项目图搜索使用一致的估计。', target: 1 },
  ];
  const $ = sel => host.querySelector(sel);
  const completed = () => state.done.length;
  function persist() {
    if (!state.remember) return;
    const ok = storage.set(STORE, JSON.stringify({ schema: 1, stage: state.stage, done: state.done.filter(i => i < 4) }));
    if (!ok) toast('浏览器未允许保存；练习仍可继续，刷新可能丢失进度。');
  }
  function pass(index) {
    if (!state.done.includes(index)) { state.done.push(index); persist(); }
    updateProgress();
  }
  function updateProgress() {
    if (!host) return;
    $('#pl-progress-count').textContent = completed();
    host.querySelectorAll('[data-pl-stage]').forEach(btn => {
      const i = Number(btn.dataset.plStage);
      btn.setAttribute('aria-current', i === state.stage ? 'step' : 'false');
      btn.classList.toggle('pl-passed', state.done.includes(i));
      btn.querySelector('span').textContent = state.done.includes(i) ? '✓' : String(i + 1).padStart(2,'0');
      btn.setAttribute('aria-label', (i + 1) + ' ' + names[i] + (state.done.includes(i) ? '，已完成本页练习' : '，未完成本页练习'));
    });
    const done = state.done.includes(state.stage);
    $('#pl-stage-state').innerHTML = done ? '<strong>✓ 这一步已练过</strong> · 可以回看，也可以继续' : '可自由切换；完成小任务后才记为“已练过”';
    $('#pl-next').textContent = state.stage === 4 ? '回到第 1 步' : '下一步 →';
    $('#pl-prev').disabled = state.stage === 0;
    const count = document.querySelector('#pl-tool-count');
    if (count) count.textContent = completed() + '/5';
  }
  function message(text, wrong = false) {
    const el = $('#pl-feedback');
    if (el) { el.textContent = text; el.dataset.kind = wrong ? 'wrong' : 'right'; }
  }
  function toast(text) {
    let el = document.getElementById('pl-toast');
    if (!el) { el = document.createElement('div'); el.id = 'pl-toast'; el.className = 'pl-toast'; el.setAttribute('role','status'); document.body.append(el); }
    el.textContent = text; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4200);
  }
  function makeMap() {
    $('#pl-map').innerHTML = data.input.grid.rows.flatMap((row,y) => [...row].map((v,x) => '<button class="pl-tile" type="button" data-pl-cell="' + x + ',' + y + '" aria-label="第 ' + (y+1) + ' 行第 ' + (x+1) + ' 列"></button>')).join('');
  }
  function renderMap() {
    const frame = data.frames[state.replay];
    const replay = state.stage === 3;
    const positions = replay ? frame.frontier : state.stage === 2 ? candidates : [];
    host.querySelectorAll('[data-pl-cell]').forEach(btn => {
      const [x,y] = btn.dataset.plCell.split(',').map(Number), node = {x,y};
      const wall = data.input.grid.rows[y][x] === '#', start = same(node, data.input.start), goal = same(node, data.input.goal);
      const cell = positions.find(c => same(c.node,node));
      const onRoute = replay && frame.path.some(n => same(n,node));
      const closed = replay && frame.expanded.some(n => same(n,node));
      const selected = replay ? same(node,frame.selected.node) : state.stage === 1 ? same(node,{x:1,y:2}) : state.stage === 2 && state.pick ? same(node,state.pick) : state.stage === 0 && state.neighbor ? same(node,state.neighbor) : false;
      const routeFinal = replay && frame.final && onRoute;
      btn.className = ['pl-tile',wall ? 'pl-wall' : '',closed ? 'pl-closed' : '',onRoute ? 'pl-route' : '',cell ? 'pl-open' : '',start ? 'pl-start' : '',goal ? 'pl-goal' : '',selected ? 'pl-selected' : '',routeFinal ? 'pl-final' : ''].filter(Boolean).join(' ');
      let label = start ? 'S' : goal ? 'G' : wall ? '×' : selected && state.stage === 1 ? '1' : cell ? String(cell.f) : onRoute ? '·' : closed ? '✓' : '';
      let small = start ? '起点' : goal ? '终点' : wall ? '墙' : cell ? '总分' : selected && state.stage === 1 ? '已走' : '';
      btn.innerHTML = '<b>' + label + '</b>' + (small ? '<small>' + small + '</small>' : '');
      // Walls stay clickable in the first exercise so a mistake gets an explanation.
      btn.disabled = state.stage === 3 || state.stage === 4 || (state.stage === 1);
      let full = '第 ' + (y+1) + ' 行第 ' + (x+1) + ' 列，' + (wall ? '墙，不可通行' : start ? 'S 起点' : goal ? 'G 终点' : '可通行');
      if (cell) full += '，已经代价 g ' + cell.g + '，估计剩余 h ' + cell.h + '，总分 f ' + cell.f;
      if (closed) full += '，已展开';
      if (selected) full += '，当前选择';
      if (routeFinal) full += '，最终路线';
      btn.setAttribute('aria-label', full);
      btn.setAttribute('aria-pressed', String(!!selected));
    });
    const notes = [
      '从 <strong>S（起点）</strong> 去 <strong>G（终点）</strong>。只走上下左右，每走一格算 1 步，不能穿墙。请点出从 S 一步能到的一格。',
      '看紫色格子：从 S 到它 <strong>已经走 1 步</strong>。先假装没有墙，到 G 横向还差 5 格、纵向差 0 格，所以估计剩余 <strong>5 步</strong>。',
      '地图上带数字的 3 格都是<strong>待选格</strong>，数字是总分 f。点地图或右侧卡片作预测，不会自动替你提交原关卡答案。',
      frame.final ? '<strong>终点被选中，路线才确定。</strong>金色连线是找到的最短路线，共 ' + data.astar.pathLength + ' 步。起点不算一步；每跨一条格边才算 1 步。' : '<strong>现在只是搜索中的候选路线，不是最终答案。</strong>紫色＝本轮选中；边框发绿＝等待比较；带 ✓＝此前已展开。',
      '能看懂，不等于能独立使用。这里换一组数字和问题，<strong>答错会说明原因</strong>；通过这组自测也不代表长期掌握。',
    ];
    $('#pl-map-note').innerHTML = notes[state.stage];
    $('#pl-map-mode').textContent = state.stage === 3 ? '真实事件 · 第 ' + (state.replay + 1) + ' 轮' : '四方向 · 每步代价 1';
    $('#pl-replay-area').hidden = !replay;
    $('#pl-timeline').value = state.replay;
    $('#pl-timeline-out').textContent = (state.replay+1) + '/' + data.frames.length;
  }
  function renderLesson() {
    const feedback = '<p class="pl-feedback" id="pl-feedback" role="status" aria-live="polite"></p>';
    const intro = '<p class="pl-lesson-kicker">STEP ' + String(state.stage+1).padStart(2,'0') + ' / 05 · ' + ['先有画面，再有术语','先说白话，再看字母','先预测，再给解释','看每次选择，不只看动画','换题检验，不靠点过'][state.stage] + '</p>';
    const parts = [
      '<h3 tabindex="-1">让电脑帮你绕过这堵墙</h3><p class="pl-lead">你是导航员，要从起点走到终点。<strong>算法</strong>就是电脑按顺序执行的一套办法；<strong>A*</strong>（读作“A 星”）是一种找路线的方法。先不背公式。</p><div class="pl-definition"><b>地图上的每一格</b>，可以叫一个“节点”。<br><b>一步相邻的格子</b>，可以叫“邻居”。<br><b>目标</b>：找到能到终点、总步数最少的路线；不是只沿着看起来最近的方向走。</div><div class="pl-exercise"><p><b>第一个小任务：</b>点地图上一格，告诉我从 S 出发一步能到哪里。不是点完就过关，要真的相邻、不能是墙。</p><button class="pl-hint" data-pl-action="hint" type="button">有点没懂，给我一个提示</button>' + feedback + '</div>',
      '<h3 tabindex="-1">把“走过”和“还要走”分开</h3><p class="pl-lead">紫色格子在 S 右边。<strong>g</strong> 记“到这里的当前已知路线代价”；<strong>h</strong> 记“从这里到终点的估计代价”；把它们相加就是 <strong>f（总分）</strong>。</p><div class="pl-equation"><div class="pl-number"><b>1</b>已经走的<em>g</em></div><span>＋</span><div class="pl-number"><b>5</b>估计还要走<em>h</em></div><span>＝</span><div class="pl-number"><b id="pl-f-total">' + (state.fCorrect ? '6' : '?') + '</b>总分<em>f</em></div></div><form id="pl-f-form" class="pl-exercise"><p><b>亲手算一次：</b>1 + 5 等于多少？<br>h 只按横向差 + 纵向差估计，暂时忽略墙；它不是已经算好的真实路长。</p><div class="pl-form-row"><label>总分 f <input id="pl-f-input" inputmode="numeric" type="text" autocomplete="off" maxlength="3" aria-label="输入总分 f" value="' + state.fValue + '"></label><button class="pl-btn primary" type="submit">检查计算</button></div>' + feedback + '</form><p class="pl-boundary">g 不是算法累计访问了多少格，也不是屏幕上所有轨迹的总步数。本图每步代价都是 1，所以路线代价可以直接数步数。</p>',
      '<h3 tabindex="-1">如果是你，会先试哪一格？</h3><p class="pl-lead">现在 S 的三个邻居正在等待比较。A* 每轮从<strong>所有待选格</strong>中先挑 <strong>f 最小</strong>的一格，不是只挑离当前格最近的邻居。</p><div class="pl-candidates">' + candidates.map((c,i) => '<button type="button" class="pl-btn pl-candidate" data-pl-candidate="' + i + '" aria-pressed="' + same(state.pick,c.node) + '"><span>' + (c.node.y < 2 ? '↑ 上面' : c.node.y > 2 ? '↓ 下面' : '→ 右边') + ' · 已走 ' + c.g + ' + 估计 ' + c.h + '</span><b>总分 ' + c.f + '</b></button>').join('') + '</div>' + feedback + '<details class="pl-definition"><summary>如果总分相同怎么办？</summary>本项目先选 h 更小的；f、h 都相同，再按进入待选列表的先后顺序选择。这是为了结果可重复，不是所有 A* 实现都只有这一种决胜规则。</details>',
      replayLesson() + feedback,
      quizLesson(),
    ];
    lesson.innerHTML = intro + parts[state.stage];
    if (state.stage === 1 && state.fCorrect) message('✓ 算对了，f = 1 + 5 = 6。下面换你给候选格排顺序。');
    if (state.stage === 0 && state.done.includes(0)) message('✓ 你已正确辨认过一步相邻的格子。可以再点其他格子看解释。');
    if (state.stage === 2 && same(state.pick,candidateFrame.selected.node)) message('✓ 先选右边：f = 1 + 5 = 6，比上下两格的 8 更小。即使右边看起来会碰墙，这一轮仍要按当前待选列表比较。');
  }
  function replayLesson() {
    const frame = data.frames[state.replay], c = frame.selected;
    const tied = frame.frontier.filter(n => n.f === c.f);
    const sameH = tied.filter(n => n.h === c.h);
    const why = tied.length === 1 ? '它的 f 在所有待选格中最小。' : sameH.length === 1 ? '最小 f 出现并列，再选 h 更小的它。' : 'f、h 都出现并列，再按先进入待选列表的顺序选它。';
    return '<h3 tabindex="-1">每一轮，都问“为什么选它”</h3><p class="pl-lead">点击“下一轮”，跟着真实 A* 事件走一次。<strong>展开</strong>的意思是：选中一个格子后，再检查它的邻居，不是角色真的走到了那里。</p><div class="pl-definition"><b>本轮选择 ' + coord(c.node) + '</b><br>g = ' + c.g + '，h = ' + c.h + '，f = ' + c.f + '。' + why + '<br>本轮选择前有 ' + frame.frontier.length + ' 个待选格；此前已展开 ' + frame.expanded.length + ' 格。</div><div class="pl-compare"' + (frame.final ? '' : ' hidden') + '><div><span>A* 最终展开</span><b>' + data.astar.expandedCount + ' 格</b><span>路线 ' + data.astar.pathLength + ' 步</span></div><div><span>BFS 最终展开</span><b>' + data.bfs.expandedCount + ' 格</b><span>路线同为 ' + data.bfs.pathLength + ' 步</span></div></div><p class="pl-boundary"' + (frame.final ? '' : ' hidden') + '>BFS（广度优先搜索）按距离一层层查，不用“还差多远”的估计。在本图它们都得到最短路线，A* 展开得更少；不代表 A* 在所有地图都更快。数据由原项目 runAstar / runBfs 生成，未换成演示动画的虚构结果。</p><details class="pl-definition"><summary>什么时候才算这一步练过了？</summary>看完后区分：路线步数是最终怎么走，展开格数是找路时检查过多少格，它们不是同一个概念。</details><div class="pl-exercise"' + (frame.final ? '' : ' hidden') + '><p><b>看完再判断：</b>奶娃真正沿金色最终路线走到 G，要走多少步？</p><div class="pl-form-row"><button class="pl-btn" type="button" data-pl-action="replay-check" data-pl-answer="10">10 步</button><button class="pl-btn" type="button" data-pl-action="replay-check" data-pl-answer="15">15 步</button></div></div>';
  }
  function quizLesson() {
    return '<h3 tabindex="-1">关掉“我好像懂了”的错觉</h3><p class="pl-lead">这次不照抄刚才的答案。每题选一项后检查，会告诉你错在“加法”“选格规则”还是“估计的适用范围”。</p><form id="pl-quiz-form" class="pl-quiz">' + QUESTIONS.map((q,i) => '<fieldset><legend>' + q.title + '</legend>' + q.options.map((text,j) => '<label><input type="radio" name="pl-q-' + i + '" value="' + j + '"' + (state.answers[i] === j ? ' checked' : '') + ' required><span>' + text + '</span></label>').join('') + (state.quizChecked ? '<p class="pl-quiz-result ' + (state.answers[i] !== q.answer ? 'wrong' : '') + '">' + (state.answers[i] === q.answer ? '✓ 答对。' : '↳ 需要再练。') + q.why + '</p>' : '') + '</fieldset>').join('') + '<button class="pl-btn primary" type="submit">检查这 4 道题</button></form>' + (state.quizChecked ? reportHtml() : '<p class="pl-boundary">只看过页面、按过下一步，不会自动获得通过标记。练习舱与原课程评分、闯关星级、本机存档相互独立。</p>');
  }
  function score() { return QUESTIONS.filter((q,i) => q.answer === state.answers[i]).length; }
  function reportHtml() {
    const missed = QUESTIONS.filter((q,i) => q.answer !== state.answers[i]);
    return '<section class="pl-report" aria-label="本次练习结果"><h4>这次答对 ' + score() + ' / 4 · ' + (score() === 4 ? '本页自测通过' : '按错因再练一轮') + '</h4><p>第一次检查答对 ' + state.firstScore + ' 题；已检查 ' + state.quizAttempts + ' 次。这个结果只反映这组题，不是长期掌握度或能力认证。</p>' + (missed.length ? '<ul>' + missed.map(q => '<li>' + (q.target === 1 ? '回到第 2 步，重新区分 g、h、f 和估计范围。' : q.target === 2 ? '回到第 3 步，比较全部待选格的 f。' : '回到第 4 步，观察遇墙后如何绕行。') + '</li>').join('') + '</ul>' : '<p>下一步：去原来的“认识 A*”与“互动入门课”，再到自由实验换一张地图，先预测，再看算法结果。</p>') + '<div class="pl-report-actions"><button class="pl-btn" type="button" data-pl-action="export">导出本次学习记录</button><button class="pl-btn primary" type="button" data-pl-action="original">继续原来的完整课程 →</button></div><p class="pl-boundary">记录只有本页答案、尝试次数和建议，不含姓名、不上传。是否长期掌握，仍需过段时间在陌生地图独立预测来验证。</p></section>';
  }
  function setStage(stage, focus = true) {
    stop(); state.stage = stage; persist(); renderLesson(); renderMap(); updateProgress();
    if (focus) lesson.querySelector('h3')?.focus({preventScroll:true});
  }
  function pickCell(x,y) {
    const node = {x,y};
    if (state.stage === 0) {
      const distance = Math.abs(x - data.input.start.x) + Math.abs(y - data.input.start.y);
      if (data.input.grid.rows[y][x] === '#') return message('这格是墙，不能走进去。先找 S 上下左右紧挨着的空格。',true);
      if (distance !== 1) return message(distance === 0 ? '你点的是起点本身，还没有迈出一步。选它上下左右的一格。' : '这一格不是从 S 一步能到的。斜着走、跳格都不符合本课规则。',true);
      state.neighbor = node; pass(0); renderMap();
      message('✓ 对！从 S 到 ' + coord(node) + ' 只跨一条格边，这是一个合法的“邻居”。但能走，不等于最终最短路线一定经过它。');
    } else if (state.stage === 2) {
      const i = candidates.findIndex(c => same(c.node,node));
      if (i < 0) return message('请从带总分数字的 3 个待选格里作预测。这里不是直接点击终点。',true);
      pickCandidate(i);
    }
  }
  function pickCandidate(index) {
    const c = candidates[index]; if (!c) return;
    state.pick = c.node; renderMap();
    host.querySelectorAll('[data-pl-candidate]').forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.plCandidate) === index)));
    if (same(c.node,candidateFrame.selected.node)) { pass(2); message('✓ 先选右边：f = 1 + 5 = 6，比上下两格的 8 更小。A* 比较所有待选格的总分，不是只看已经走的步数。'); }
    else message('这格总分是 ' + c.f + '，但右边格子的总分只有 6。先选 f 更小的；不是凭方向、也不是随便选一个都算对。',true);
  }
  function replayTo(index) {
    state.replay = Math.min(data.frames.length-1,Math.max(0,index));
    renderLesson(); renderMap();
    if (state.replay === data.frames.length-1) stop();
  }
  function stop() { if (timer !== null) clearInterval(timer); timer = null; const btn = host?.querySelector('[data-pl-action="play"]'); if(btn) { btn.textContent = '▷ 自动播放'; btn.setAttribute('aria-pressed','false'); } }
  function action(name, btn) {
    if (name === 'hint') return message('先找到写着 S 的格子。只能往上、右、下、左挪一格；像走楼梯一样的斜线不算一步。试着点 S 右边。');
    if (name === 'next') return setStage(state.stage === 4 ? 0 : state.stage + 1);
    if (name === 'prev') return setStage(Math.max(0,state.stage-1));
    if (name === 'replay-next') { stop(); return replayTo(state.replay+1); }
    if (name === 'replay-prev') { stop(); return replayTo(state.replay-1); }
    if (name === 'replay-start') { stop(); return replayTo(0); }
    if (name === 'play') {
      if (timer !== null) return stop();
      if (state.replay === data.frames.length-1) replayTo(0);
      btn.textContent = 'Ⅱ 暂停'; btn.setAttribute('aria-pressed','true');
      timer = setInterval(() => replayTo(state.replay+1), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1600 : 1000); return;
    }
    if (name === 'replay-check') {
      if (state.replay < data.frames.length-1) return message('先用“下一轮”或时间轴看到终点被选中，再对照“路线 10 步”和“展开 15 格”。没有看到结尾，不会记为练过。',true);
      if (btn.dataset.plAnswer !== String(data.astar.pathLength)) return message('15 是搜索时展开的格子数，不是角色要走的步数。看金色最终路线，每跨一条格边算 1 步，再选一次。',true);
      pass(3); return message('✓ 你已看到最终路线，并分清两个指标。路线 10 步，是走到 G 的成本；展开 15 格，是搜索时检查邻居的工作量。两者不是一个指标。');
    }
    if (name === 'original') { closeCoach(); location.hash = 'intro'; return; }
    if (name === 'export') return exportRecord();
  }
  function exportRecord() {
    const text = 'PathLab AI · 零基础练习舱记录\n日期：' + new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Shanghai'}).format(new Date()) + '\n已完成本页练习：' + state.done.map(i=>names[i]).join('、') + '\n当前答对：' + score() + '/4；第一次检查：' + state.firstScore + '/4；检查次数：' + state.quizAttempts + '\n\n' + QUESTIONS.map((q,i)=>q.title + '\n本次选择：' + (q.options[state.answers[i]] ?? '未答') + '\n' + (q.answer===state.answers[i]?'答对':'需再练') + '：' + q.why).join('\n\n') + '\n\n边界：AI 设计的本页自测，非真人学习效果验证，非长期能力认证。不包含原课程成绩或个人身份信息。';
    const url = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'PathLab-本次学习记录.txt'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),3000);
    toast('已生成本次记录。保存时请选择 D:\\竞赛 或其子目录。');
  }
  function closeCoach() { stop(); if(dialog.open) dialog.close(); }
  function openCoach(from) {
    opener = from || document.activeElement;
    if (location.hash === '#home' || !location.hash) {
      if (anchor?.isConnected && host.parentElement === anchor) { anchor.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); host.querySelector('h2').focus({preventScroll:true}); return; }
    }
    dialog.append(host); dialog.showModal();
    host.querySelector('h2').focus({preventScroll:true});
  }
  function toggleTheme() {
    const light = !document.body.classList.contains('light-theme');
    document.body.classList.toggle('light-theme',light);
    storage.set('pathlab-theme',light?'light':'dark');
    const btn = document.getElementById('pl-theme-toggle');
    if (btn) { btn.innerHTML = '<span class="pl-tool-icon" aria-hidden="true">' + (light?'☾':'☀') + '</span>' + (light?'夜航模式':'晨光模式'); btn.setAttribute('aria-label', light?'切换到深色夜航模式':'切换到浅色晨光模式'); }
  }
  function showWelcome() {
    if (storage.get('pathlab-visited') === 'true') return;
    const welcome = document.createElement('dialog'); welcome.id = 'welcome-overlay'; welcome.className = 'pl-dialog pl-welcome'; welcome.setAttribute('aria-labelledby','pl-welcome-title');
    welcome.innerHTML = '<p class="pl-kicker">WELCOME TO PATHLAB</p><h2 id="pl-welcome-title">不必先会编程。<br>先陪我找一条路。</h2><p>一堵墙挡在起点和终点之间，电脑怎样选出更合适的路线？我们从点一格地图开始，不先丢给你一串公式。</p><ol class="pl-welcome-list"><li><span>01</span>先懂场景与规则，再认识 g、h、f。</li><li><span>02</span>你先做选择，再看算法的解释。</li><li><span>03</span>最后换题检验，不把“点过”当“学会”。</li></ol><button type="button" class="pl-btn primary" id="pl-welcome-start">进入零基础练习舱 →</button><button type="button" class="pl-hint" id="pl-welcome-skip">先看看原来的完整课程</button><p class="pl-modal-note">原有 8 站、视频、闯关、实验、奶娃提示全部保留。Esc 也可以关闭；不开网络就能学习。</p>';
    document.body.append(welcome);
    const dismiss = start => { storage.set('pathlab-visited','true'); welcome.close(); if(start) openCoach(document.getElementById('pl-open-coach')); else document.querySelector('[data-testid="start-journey"]')?.focus({preventScroll:true}); };
    welcome.querySelector('#pl-welcome-start').addEventListener('click',()=>dismiss(true));
    welcome.querySelector('#pl-welcome-skip').addEventListener('click',()=>dismiss(false));
    welcome.addEventListener('cancel',()=>{ storage.set('pathlab-visited','true'); });
    welcome.showModal();
  }
  function mount() {
    document.body.classList.toggle('light-theme',storage.get('pathlab-theme') === 'light');
    host = document.createElement('section'); host.id = 'pl-coach'; host.className = 'pl-coach'; host.dataset.testid = 'beginner-cockpit'; host.setAttribute('aria-labelledby','pl-coach-title');
    host.innerHTML = '<div class="pl-coach-top"><div><p class="pl-kicker">LEARN BY MAKING A CHOICE</p><h2 id="pl-coach-title" tabindex="-1">零基础练习舱</h2><p class="pl-coach-intro">每一步只做一件事。先试一试，再让算法解释给你听。</p></div><div class="pl-progress"><b id="pl-progress-count">0</b> / 5<small>本页练习<br>不是能力认证</small></div></div><ol class="pl-steps" aria-label="练习舱的五步学习路径">' + names.map((n,i)=>'<li><button type="button" data-pl-stage="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+n+'</button></li>').join('') + '</ol><div class="pl-coach-body"><div class="pl-map-side"><div class="pl-map-caption"><span>路线观察窗</span><span class="pl-chip" id="pl-map-mode">四方向 · 每步代价 1</span></div><div class="pl-map-scroll" tabindex="0" aria-label="地图区域，可横向滚动"><div class="pl-map" id="pl-map" role="group" aria-label="7 列 5 行练习地图"></div></div><ul class="pl-legend" aria-label="地图图例"><li><i class="pl-dot" aria-hidden="true"></i>S 起点</li><li><i class="pl-dot goal" aria-hidden="true"></i>G 终点</li><li><i class="pl-dot wall" aria-hidden="true"></i>× 墙</li><li><i class="pl-dot selected" aria-hidden="true"></i>当前选择</li></ul><p class="pl-map-note" id="pl-map-note"></p><div id="pl-replay-area" hidden><div class="pl-replay-controls"><button type="button" class="pl-btn" data-pl-action="replay-start" aria-label="回放回到第一轮">↺ 重看</button><button type="button" class="pl-btn" data-pl-action="replay-prev">← 上一轮</button><button type="button" class="pl-btn" data-pl-action="play" aria-pressed="false">▷ 自动播放</button><button type="button" class="pl-btn primary" data-pl-action="replay-next">下一轮 →</button></div><label class="pl-timeline">搜索轮次<input id="pl-timeline" type="range" min="0" max="'+(data.frames.length-1)+'" value="0" aria-label="选择 A* 搜索轮次"><output id="pl-timeline-out">1/'+data.frames.length+'</output></label></div></div><div class="pl-lesson" id="pl-lesson"></div></div><div class="pl-coach-bottom"><div><span class="pl-stage-state" id="pl-stage-state"></span><label style="display:flex;align-items:center;gap:7px;font-size:11px;color:var(--pl-sub);margin-top:10px;min-height:28px"><input type="checkbox" id="pl-remember" '+(state.remember?'checked':'')+'>记住本页练习进度（可选，保存在当前浏览器；自测答案不保存）</label></div><div class="pl-stage-actions"><button type="button" class="pl-btn quiet" id="pl-prev" data-pl-action="prev">← 上一步</button><button type="button" class="pl-btn primary" id="pl-next" data-pl-action="next">下一步 →</button></div></div>';
    lesson = $('#pl-lesson'); makeMap();
    anchor = document.createElement('div'); anchor.id = 'pl-coach-anchor'; anchor.append(host); anchor.hidden = true; document.body.append(anchor);
    dialog = document.createElement('dialog'); dialog.id = 'pl-coach-dialog'; dialog.className = 'pl-dialog'; dialog.setAttribute('aria-labelledby','pl-dialog-label'); dialog.innerHTML = '<div class="pl-dialog-bar"><span id="pl-dialog-label">零基础练习舱 · 与原有课程独立，不改原成绩</span><button type="button" aria-label="关闭练习舱">关闭 ×</button></div>'; document.body.append(dialog);
    dialog.querySelector('button').addEventListener('click',closeCoach);
    dialog.addEventListener('close',()=>{stop();anchor.append(host);opener?.isConnected&&opener.focus({preventScroll:true});});
    host.addEventListener('click',event=>{
      const btn = event.target.closest('button'); if (!btn) return;
      if (btn.dataset.plStage !== undefined) return setStage(Number(btn.dataset.plStage));
      if (btn.dataset.plCell) return pickCell(...btn.dataset.plCell.split(',').map(Number));
      if (btn.dataset.plCandidate !== undefined) return pickCandidate(Number(btn.dataset.plCandidate));
      if (btn.dataset.plAction) return action(btn.dataset.plAction,btn);
    });
    host.addEventListener('input',event=>{
      if(event.target.id === 'pl-f-input') state.fValue = event.target.value;
      if(event.target.id === 'pl-timeline') { stop(); replayTo(Number(event.target.value)); }
    });
    host.addEventListener('change',event=>{
      if (event.target.id === 'pl-remember') {
        state.remember = event.target.checked;
        if (state.remember) { persist(); toast('只记住本页完成标记和所在步骤，不保存自测答案。'); }
        else { storage.remove(STORE); toast('已取消记住，并删除本练习舱的已保存进度；原课程存档不变。'); }
      }
      if (event.target.name?.startsWith('pl-q-')) {
        const i = Number(event.target.name.slice(5)); state.answers[i] = Number(event.target.value);
        if(state.quizChecked) { state.quizChecked = false; lesson.querySelectorAll('.pl-quiz-result,.pl-report').forEach(el=>el.remove()); }
        // A once-passed exercise remains a history flag; the next report evaluates current answers.
      }
    });
    host.addEventListener('submit',event=>{
      event.preventDefault();
      if(event.target.id === 'pl-f-form') {
        state.fValue = $('#pl-f-input').value.trim();
        const valid = /^\d+$/.test(state.fValue) && Number(state.fValue) === 6;
        if(valid) { state.fCorrect = true; $('#pl-f-total').textContent = '6'; pass(1); message('✓ 算对了！f = g + h = 1 + 5 = 6。注意“估计还要走 5 步”不保证实际只走 5 步。'); }
        else message(state.fValue === '' ? '还没输入数字。把“已经走 1”加上“估计还要走 5”试试。' : '再算一次：这里要相加，不是相减。g = 1，h = 5，f = 1 + 5。',true);
      }
      if(event.target.id === 'pl-quiz-form') {
        if(Object.keys(state.answers).length !== 4) return;
        state.quizChecked = true; state.quizAttempts++; if(state.firstScore === null) state.firstScore = score();
        if(score() === 4) pass(4);
        renderLesson(); lesson.querySelector('.pl-report')?.scrollIntoView({block:'nearest',behavior:'instant'});
      }
    });
    const attach = () => {
      const header = document.querySelector('.site-header');
      if (header && !toolbar) {
        toolbar = document.createElement('div'); toolbar.className = 'pl-toolbar'; toolbar.setAttribute('aria-label','学习快捷工具');
        toolbar.innerHTML = '<button type="button" class="pl-open-coach" id="pl-open-coach"><span class="pl-tool-icon" aria-hidden="true">◇</span>练习舱 <span id="pl-tool-count">0/5</span></button><button type="button" id="pl-theme-toggle"></button><button type="button" id="pl-go-next" aria-label="继续学习：进入下一站原课程">继续学习 ↗</button>';
        header.append(toolbar);
        toolbar.querySelector('#pl-open-coach').addEventListener('click',e=>openCoach(e.currentTarget));
        toolbar.querySelector('#pl-theme-toggle').addEventListener('click',toggleTheme);
        toolbar.querySelector('#pl-go-next').addEventListener('click',()=>{const current=document.querySelector('.station-nav a[aria-current="page"]'); const links=[...document.querySelectorAll('.station-nav ol a')]; const i=links.indexOf(current); location.hash=links[Math.min(links.length-1,i+1)]?.hash||'intro';});
        // Refresh labels without changing the chosen theme.
        const light=document.body.classList.contains('light-theme');
        const tb=toolbar.querySelector('#pl-theme-toggle'); tb.innerHTML='<span class="pl-tool-icon" aria-hidden="true">'+(light?'☾':'☀')+'</span>'+(light?'夜航模式':'晨光模式');tb.setAttribute('aria-label',light?'切换到深色夜航模式':'切换到浅色晨光模式');
        updateProgress();
      }
      const hero = document.querySelector('#view-home .intro');
      if (hero && anchor.parentElement !== hero.parentElement) {
        hero.insertAdjacentElement('afterend',anchor); anchor.hidden=false;
        if (!hero.querySelector('.pl-hero-try')) {
          const btn=document.createElement('button');btn.type='button';btn.className='secondary-link pl-hero-try';btn.textContent='先玩一个找路小任务 →';btn.addEventListener('click',e=>openCoach(e.currentTarget));hero.querySelector('.intro-actions').append(btn);
        }
      }
      return Boolean(toolbar && hero);
    };
    const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});
    if(!attach())observer.observe(document.getElementById('pathlab-root'),{childList:true,subtree:true});
    setStage(state.stage,false);
    window.addEventListener('hashchange',stop);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    showWelcome();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
