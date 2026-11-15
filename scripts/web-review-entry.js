/* E038: discoverable manual review; no requests, keys, grades, save writes or external-chat access. */
(() => {
  'use strict';
  const TOPICS = {
    start: ['从零认识 A*', '请用送东西找路的生活例子解释 A*（读作 A 星），先说输入和输出，再提出一道不需要编程的检查题。'],
    costs: ['弄懂 g / h / f', '请先用白话分别定义 g、h、f，再用教学例题 g = 2、h = 4 引导我算 f；不要先给检查题答案。说明估计不等于实际路长。'],
    walls: ['为什么遇到墙要绕路', '请用一个明确标为“教学例子”的小网格解释：为什么 A* 可能先远离终点，以及只看 h 为什么不够。先让我预测，再逐步解释。'],
    compare: ['区分 BFS 与 A*', '请解释 BFS 先来先处理、A* 先比较 f 的区别。不要把原理说成我已经做过的实验；提出一个可以回本页验证的问题。'],
  };
  function mount() {
    const root = document.getElementById('pathlab-root');
    if (!root) return;
    let mode = 'learn', opener = null, operation = 0, queued = false;
    const dialog = document.createElement('dialog');
    dialog.id = 'pl-review-dialog'; dialog.className = 'pl-review-dialog';
    dialog.setAttribute('aria-labelledby', 'pl-review-title');
    dialog.innerHTML = `
      <div class="pl-review-top"><div><p class="pl-kicker">ASK WITH CONTEXT, NOT GUESSWORK</p><h2 id="pl-review-title">辅助复盘 <span>× DeepSeek 网页</span></h2></div><button type="button" id="pl-review-close" aria-label="关闭辅助复盘">关闭 ×</button></div>
      <div class="pl-review-body">
        <p class="pl-review-lead">先在本机整理问题，核对并复制，再由你去官方网页粘贴、确认发送。<strong>不需要 API Key，也不会自动发送学习记录。</strong></p>
        <ol class="pl-review-flow" aria-label="辅助复盘三步"><li><b>01</b> 选问题</li><li><b>02</b> 核对与复制</li><li><b>03</b> 网页粘贴提问</li></ol>
        <div class="pl-review-modes" role="group" aria-label="辅助复盘内容来源"><button type="button" id="pl-review-learn" aria-pressed="true">学习提问 <small>随时可用</small></button><button type="button" id="pl-review-evidence" aria-pressed="false">本次运行复盘 <small id="pl-review-evidence-badge">待完成搜索</small></button></div>
        <div id="pl-review-learn-panel"><div class="pl-review-controls"><label for="pl-review-topic">我想弄懂什么？<select id="pl-review-topic"><option value="start">从零认识 A*</option><option value="costs">弄懂 g / h / f</option><option value="walls">为什么遇到墙要绕路</option><option value="compare">区分 BFS 与 A*</option></select></label><label for="pl-review-style">希望怎么讲？<select id="pl-review-style"><option value="guided">一步一步引导我</option><option value="brief">先给简明解释</option></select></label></div><p class="pl-review-note">这是学习提问模板，不是你的运行结果或掌握度判断。生成的例子必须与真实记录分开。</p></div>
        <div id="pl-review-evidence-panel" hidden><p id="pl-review-evidence-state" class="pl-review-note"></p><div id="pl-review-locked" class="pl-review-locked"><strong>先有真实运行，才有证据复盘。</strong><ol><li>进入「任务工作台」，选关卡与算法，点击「开始预测」。</li><li>选候选格并提交预测，再逐步回放，直到搜索结束。</li><li>回到这里整理本次证据；完成条件实验后，原复盘区还可选择前后对照。</li></ol><button type="button" class="pl-btn" id="pl-review-go-lab">去任务工作台 →</button><p>不会代你作答，不提前揭示搜索结果。自由实验与独立练习舱不会伪装成任务工作台记录。</p></div><button type="button" class="pl-btn" id="pl-review-go-original" hidden>到原复盘区调整方向 / 回答风格 ↗</button></div>
        <div class="pl-review-preview-heading"><label for="pl-review-preview">准备复制的内容 <small id="pl-review-source-label">学习提问 · 非运行记录</small></label><span id="pl-review-length"></span></div>
        <textarea id="pl-review-preview" rows="10" readonly spellcheck="false" aria-describedby="pl-review-privacy" placeholder="完成一轮任务搜索后，这里才会出现真实运行证据。"></textarea>
        <p id="pl-review-privacy" class="pl-review-note">只整理学习模板或原复盘区已揭示的事实，不读取你的自由文本解释、完整存档、账号或凭证。复制会写入系统剪贴板。</p>
        <div class="pl-review-actions"><button type="button" class="pl-btn pl-btn-primary" id="pl-review-copy">复制提问内容</button><a id="pl-review-open" class="pl-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">打开 DeepSeek 网页 ↗<span class="sr-only">（新标签页）</span></a><button type="button" class="pl-btn" id="pl-review-select">选中全文</button></div>
        <p id="pl-review-status" class="pl-review-status" role="status" aria-live="polite">内容在本机生成，尚未发送。</p>
        <details class="pl-review-help"><summary>第一次使用：复制之后怎么做？</summary><ol><li>核对上方内容，再点击「复制提问内容」。复制失败时点「选中全文」，电脑按 Ctrl+C / ⌘C，手机长按复制。</li><li>打开 DeepSeek 官方网页，可能需要登录你自己的账号。粘贴后再次检查，由你决定是否发送；网页服务需要联网。</li><li>收到回答后回到本页，核对公式、选择规则和 F 编号事实。外部回答可能出错，不能替代你自己的解释。</li></ol><p>这里不是内嵌聊天，不能读取外部网页回答。「复制」和「打开网页」是独立操作，不会记作完成复盘，也不改变评分和存档。</p></details>
        <details class="pl-review-api" id="pl-review-api"><summary>进阶选项：站内 API 复盘（可选）</summary><p><strong>当前离线 HTML 不提供站内 API 请求。</strong>网页辅助已可用，不需要在这个文件里填写密钥。</p><p>只有运行带服务端的项目、由部署者配置并启用后，才可在任务搜索结束后的原复盘区，主动同意并请求 API 复盘。未真实联调，不表示当前已连接 DeepSeek。</p><p>API Key 只能留在服务端，不能写进 HTML、前端输入框或公开仓库。不配置 API 也不影响本地课程与网页辅助。</p></details>
      </div>`;
    document.body.append(dialog);
    const $ = selector => dialog.querySelector(selector);
    const preview = $('#pl-review-preview'), copyButton = $('#pl-review-copy');
    const status = text => { $('#pl-review-status').textContent = text; };
    const original = () => root.querySelector('[data-testid="web-review-preview"]');
    function learningPrompt() {
      return [
        '你是一位面向零基础学生的算法学习教练。我正在使用 PathLab AI，请帮助我理解，而不是替我评分。',
        '【问题】' + TOPICS[$('#pl-review-topic').value][1],
        $('#pl-review-style').value === 'guided' ? '【方式】循序引导：先提一个小问题，等我作答后再继续；新术语必须先白话解释再使用。' : '【方式】简明解释：先用三句话解释，再给一道我可以独立作答的小题；先不要附答案。',
        '【本课前提】地图只允许上下左右移动，墙不可穿过，每步代价为 1。',
        'g 是当前已知从起点到该格的代价；h 是到终点剩余代价的估计，本课用横向距离差加纵向距离差，暂时忽略墙；f = g + h。',
        '本项目 A* 先选 f 最小的待选格；若相同，先选 h 较小的；仍相同，先选更早进入候选集合的。BFS 按进入队列的先后顺序选择。',
        '【边界】这是一份学习提问模板，没有附带我的运行结果、预测答案或存档。请把一般原理和新编教学例子明确标注，不编造我的搜索事件、实验差值、错误原因或掌握程度。',
        '不要承诺任意启发式都能找到最短路，也不要说 A* 每一步都更靠近终点。不确定时说明前提。',
      ].join('\n');
    }
    function sync() {
      const source = original(), ready = Boolean(source && source.value);
      $('#pl-review-evidence-badge').textContent = ready ? '已有真实证据' : '待完成搜索';
      $('#pl-review-learn').setAttribute('aria-pressed', String(mode === 'learn'));
      $('#pl-review-evidence').setAttribute('aria-pressed', String(mode === 'evidence'));
      $('#pl-review-learn-panel').hidden = mode !== 'learn'; $('#pl-review-evidence-panel').hidden = mode !== 'evidence';
      $('#pl-review-locked').hidden = ready; $('#pl-review-go-original').hidden = !ready;
      const label = ready ? '直接使用当前任务原复盘区的预览，不额外补写事实。切换关卡、重置或改变条件后会重新核对；若原记录仍可用则继续显示。' : '当前任务没有已完成且已揭示的运行证据；尚未生成，不会沿用其他关卡的记录。';
      if ($('#pl-review-evidence-state').textContent !== label) $('#pl-review-evidence-state').textContent = label;
      const prompt = mode === 'learn' ? learningPrompt() : ready ? source.value : '';
      $('#pl-review-source-label').textContent = mode === 'learn' ? '学习提问 · 非运行记录' : ready ? '原复盘预览 · 已揭示事实' : '等待真实证据';
      $('#pl-review-length').textContent = prompt ? prompt.length + ' 字符' : '尚未生成';
      if (preview.value !== prompt) {
        operation++; copyButton.dataset.busy = 'false'; preview.value = prompt; copyButton.textContent = '复制提问内容'; copyButton.disabled = false;
        status(prompt ? '内容已在本机整理，尚未发送。请先核对，再复制。' : '请先完成一轮任务搜索，或切回「学习提问」。没有生成或发送运行记录。');
      }
      copyButton.disabled = !prompt || copyButton.dataset.busy === 'true';
      $('#pl-review-select').disabled = !prompt;
    }
    function schedule() { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; attach(); sync(); }); } }
    function open(from) { opener = from; $('#pl-review-open').href = 'https://chat.deepseek.com/'; sync(); if (!dialog.open) dialog.showModal(); }
    function close() { dialog.close(); }
    function selectAll() {
      preview.focus(); preview.select(); preview.setSelectionRange(0, preview.value.length);
      status('已选中全文。电脑按 Ctrl+C（Mac 为 ⌘C）；手机请长按复制。尚未发送。');
    }
    function goLab() { close(); location.hash = 'lab'; }
    $('#pl-review-close').addEventListener('click', close);
    dialog.addEventListener('close', () => { operation++; copyButton.dataset.busy = 'false'; copyButton.disabled = !preview.value; copyButton.textContent = '复制提问内容'; if (opener?.isConnected) opener.focus({ preventScroll: true }); });
    $('#pl-review-learn').addEventListener('click', () => { mode = 'learn'; sync(); });
    $('#pl-review-evidence').addEventListener('click', () => { mode = 'evidence'; sync(); });
    $('#pl-review-topic').addEventListener('change', sync); $('#pl-review-style').addEventListener('change', sync);
    $('#pl-review-select').addEventListener('click', selectAll); $('#pl-review-go-lab').addEventListener('click', goLab);
    $('#pl-review-go-original').addEventListener('click', () => {
      close(); location.hash = 'lab';
      requestAnimationFrame(() => { const source = original(); if (source) { source.scrollIntoView({ block: 'center', behavior: 'instant' }); source.focus({ preventScroll: true }); } });
    });
    copyButton.addEventListener('click', async () => {
      sync(); const prompt = preview.value; if (!prompt || copyButton.dataset.busy === 'true') return;
      const current = ++operation; copyButton.dataset.busy = 'true'; copyButton.disabled = true; copyButton.textContent = '正在复制…';
      try {
        if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable');
        await navigator.clipboard.writeText(prompt);
        if (current !== operation || !dialog.open) return;
        copyButton.textContent = '已复制 · 再次复制'; status('已复制当前预览；尚未发送。请到 DeepSeek 网页粘贴，核对后由你发送。');
      } catch {
        if (current !== operation || !dialog.open) return;
        selectAll(); status('自动复制不可用，已选中全文。请按 Ctrl+C / ⌘C 或手机长按复制；尚未发送。'); copyButton.textContent = '复制提问内容';
      } finally {
        if (current === operation) { copyButton.dataset.busy = 'false'; copyButton.disabled = !preview.value; }
      }
    });
    const card = document.createElement('section'); card.id = 'pl-review-entry'; card.className = 'pl-review-entry'; card.setAttribute('aria-labelledby', 'pl-review-entry-title');
    card.innerHTML = '<div><p class="pl-kicker">从「我不懂」到一个好问题</p><h2 id="pl-review-entry-title">辅助复盘，让提问也有依据。</h2><p>DeepSeek 网页辅助：本机整理、手动复制提问。还没做任务？也能先问懂 A*；做完后再带着真实证据复盘。</p><div class="pl-review-tags"><span>无需密钥</span><span>你决定是否发送</span><span>站内 API 为可选进阶</span></div></div><div class="pl-review-entry-actions"><button type="button" class="pl-btn pl-btn-primary" id="pl-review-home-open">打开辅助复盘 →</button><button type="button" class="pl-btn" id="pl-review-home-lab">去工作台积累证据</button></div>';
    card.querySelector('#pl-review-home-open').addEventListener('click', event => open(event.currentTarget));
    card.querySelector('#pl-review-home-lab').addEventListener('click', goLab);
    function attach() {
      const toolbar = root.querySelector('.pl-toolbar');
      if (toolbar && !document.getElementById('pl-open-review')) {
        const button = document.createElement('button'); button.id = 'pl-open-review'; button.type = 'button'; button.textContent = '辅助复盘'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', dialog.id); button.addEventListener('click', event => open(event.currentTarget)); toolbar.insertBefore(button, toolbar.querySelector('#pl-theme-toggle'));
      }
      const hero = root.querySelector('#view-home .intro');
      if (hero && card.parentElement !== hero.parentElement) hero.insertAdjacentElement('afterend', card);
    }
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true, characterData: true });
    root.addEventListener('change', schedule); root.addEventListener('click', schedule); window.addEventListener('hashchange', schedule);
    attach(); sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
