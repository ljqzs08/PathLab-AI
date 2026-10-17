import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { LocalFeedbackResult } from '../domain/learning/diagnose';
import type { RunComparison } from '../domain/learning/report';
import { buildWebReviewPrompt, hasWebComparison, webReviewChoices, type WebReviewDetail, type WebReviewFocus } from '../domain/learning/web-review';

/** Keyed by run/revision in the parent. Preparing/copying never sends a request. */
export function WebReview({ result, comparison }: { result: LocalFeedbackResult; comparison: RunComparison | null }) {
  const id = useId();
  const [focus, setFocus] = useState<WebReviewFocus>('prediction');
  const [detail, setDetail] = useState<WebReviewDetail>('brief');
  const [status, setStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const preview = useRef<HTMLTextAreaElement>(null);
  const operation = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const paired = hasWebComparison(result.request, comparison);
  const prompt = useMemo(() => buildWebReviewPrompt(result.request, { focus, detail }, comparison), [result.request, comparison, focus, detail]);
  function resetCopy() { operation.current++; setCopied(false); setStatus('内容已更新，请核对后重新复制。'); }
  function selectText() {
    preview.current?.focus(); preview.current?.select();
    setStatus('已选中全文。电脑请按 Ctrl+C（Mac 为 ⌘C）；手机请长按文本后选择复制。');
  }
  async function copy() {
    if (copying) return;
    const current = ++operation.current;
    setCopying(true); setCopied(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard_unavailable');
      await navigator.clipboard.writeText(prompt);
      if (!mounted.current || current !== operation.current) return;
      setCopied(true); setStatus('已复制当前复盘内容；尚未发送。打开 DeepSeek 后粘贴，并由你确认发送。');
    } catch {
      if (!mounted.current || current !== operation.current) return;
      preview.current?.focus(); preview.current?.select();
      setStatus('自动复制不可用，已选中全文。请按 Ctrl+C 或长按复制；没有发送任何数据。');
    } finally { if (mounted.current) setCopying(false); }
  }
  return <section className="web-review" aria-labelledby={id + '-title'} data-testid="web-review">
    <div className="web-review-heading"><div><p className="eyebrow">YOUR EVIDENCE. YOUR QUESTION.</p><h4 id={id + '-title'}>把这次探索，变成一个好问题。</h4></div><span className="web-review-badge">DeepSeek 网页辅助 · 无需 API</span></div>
    <p className="web-review-intro">先在这里整理证据，再去官方网页提问。不用配置密钥；不会自动发送学习记录。</p>
    <ol className="web-review-steps" aria-label="网页复盘步骤"><li><span>01</span>选复盘方向</li><li><span>02</span>核对并复制</li><li><span>03</span>网页粘贴提问</li></ol>
    <dl className="web-review-stats"><div><dt>当前算法</dt><dd>{result.request.algorithm === 'bfs' ? 'BFS' : 'A*'}</dd></div><div><dt>符合选择规则</dt><dd>{result.request.facts.correctCount}<small> / {result.request.facts.predictionCount} 次预测</small></dd></div><div><dt>条件实验</dt><dd>{paired ? '已有对照' : '尚无对照'}</dd></div></dl>
    <fieldset className="web-review-topics"><legend>1. 这次想弄懂什么？</legend><div>{webReviewChoices.map(choice => <label key={choice.id} data-selected={focus === choice.id} data-disabled={choice.id === 'experiment' && !paired}>
      <input type="radio" name={id + '-focus'} value={choice.id} checked={focus === choice.id} disabled={choice.id === 'experiment' && !paired} onChange={() => { setFocus(choice.id); resetCopy(); }} />
      <span><strong>{choice.title}</strong><small>{choice.id === 'experiment' && !paired ? '先完成上方“改变一次条件”，再来比较。' : choice.description}</small></span>
    </label>)}</div></fieldset>
    <div className="web-review-preview-heading"><label htmlFor={id + '-preview'}>2. 核对准备复制的内容</label><label className="web-review-detail">回答风格<select aria-label="复盘回答风格" value={detail} onChange={e => { setDetail(e.target.value as WebReviewDetail); resetCopy(); }}><option value="brief">简明复盘</option><option value="guided">循序引导</option></select></label></div>
    <textarea ref={preview} id={id + '-preview'} className="web-review-preview" data-testid="web-review-preview" readOnly value={prompt} rows={10} spellCheck={false} aria-describedby={id + '-privacy'} />
    <p id={id + '-privacy'} className="web-review-privacy">仅整理已揭示的模板事实；不包含你的自由文本解释、完整存档或凭证。复制会写入系统剪贴板，请勿粘贴到无关页面。</p>
    <div className="web-review-actions"><button type="button" className="action-primary" disabled={copying} onClick={() => void copy()} data-testid="web-review-copy">{copying ? '正在复制…' : copied ? '已复制 · 再次复制' : '复制复盘内容'}</button><a className="action-secondary" href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" data-testid="web-review-open">打开 DeepSeek 网页 <span aria-hidden="true">↗</span><span className="sr-only">（新标签页）</span></a><button type="button" className="action-quiet" onClick={selectText}>选中全文</button></div>
    <p className="web-review-status" role="status" aria-live="polite" data-testid="web-review-status">{status || '内容在本机生成，尚未发送。复制与打开网页是两个独立操作。'}</p>
    <details className="web-review-help"><summary>第一次使用？查看粘贴与核对方法</summary><ol><li>复制上方内容，再打开官方网页；可能需要登录你自己的 DeepSeek 账号。</li><li>将内容粘贴到官方聊天输入框，检查后由你点击发送。联网和网页使用限制以官方服务为准。</li><li>收到回答后回到本页，对照 F 编号事实与条件结果，再用自己的话填写下方解释。</li></ol><p>这里不是内嵌聊天。网站不能读取外部网页的回答，也不会把“打开网页”记为复盘完成。外部回答未经过本项目的格式或引用校验。</p></details>
  </section>;
}
