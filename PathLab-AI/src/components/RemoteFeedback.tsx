import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Feedback } from '../../contracts/types';
import type { LocalFeedbackResult } from '../domain/learning/diagnose';
import { validateRemoteFeedback, validateRemoteRequest } from '../domain/learning/feedback-validation';

const subscribe = () => () => {};
const isStandalone = () => document.documentElement.dataset.pathlabStandalone === 'true' || location.protocol === 'file:';
const messages: Record<string, string> = {
  disabled: '服务端尚未启用 DeepSeek，继续使用上方本地反馈。',
  not_configured: '服务端配置未齐备，继续使用本地反馈。',
  unauthorized: '复盘访问口令不正确；不要在这里填写 DeepSeek API Key。',
  forbidden: '访问来源不匹配，请检查服务端允许的地址。',
  invalid_request: '本次事实未通过检查，没有生成远程反馈。',
  rate_limited: '请求过于频繁或本次服务额度已用完；至少等 10 秒再手动尝试。',
  provider_unavailable: 'DeepSeek 暂时不可用，继续使用本地反馈。',
  invalid_feedback: '远程结果未通过格式或引用检查，已弃用，保留本地反馈。',
  cancelled_or_timeout: '请求已取消或超时；未自动重试，保留本地反馈。',
};

/** Unmounted/keyed on run changes; remote prose never enters score, report or save. */
export function RemoteFeedback({ result }: { result: LocalFeedbackResult }) {
  const offline = useSyncExternalStore(subscribe, isStandalone, () => false);
  const [consent, setConsent] = useState(false), [token, setToken] = useState('');
  const [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => { const controller = active.current; active.current = null; controller?.abort(); }, []);
  function cancel() {
    const controller = active.current; active.current = null; controller?.abort();
    setBusy(false); setStatus('已取消；远程服务可能已开始计费，本地反馈不受影响。');
  }
  async function requestReview() {
    if (offline || !consent || token.length < 32 || active.current) return;
    const controller = new AbortController(); active.current = controller;
    const deadline = setTimeout(() => controller.abort(), 17000);
    setBusy(true); setFeedback(null); setStatus('正在请求 DeepSeek；本地反馈仍可查看。');
    try {
      const request = validateRemoteRequest(result.request);
      const response = await fetch('/api/feedback', { method: 'POST', signal: controller.signal, credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-Pathlab-Consent': 'minimal-facts-v1' },
        body: JSON.stringify(request) });
      const text = await response.text();
      if (text.length > 32768) throw new Error('invalid_feedback');
      const body = JSON.parse(text);
      if (active.current !== controller) return;
      if (!response.ok) { setStatus(messages[body?.status] ?? '远程请求未成功，继续使用本地反馈。'); return; }
      if (body?.runId !== request.runId || body?.gridRevision !== request.gridRevision) throw new Error('invalid_feedback');
      const checked = validateRemoteFeedback(request, body.feedback);
      setFeedback(checked); setStatus('已收到 DeepSeek 复盘并通过格式与引用检查；自然语言判断仍需核对。');
    } catch {
      if (active.current === controller) setStatus(controller.signal.aborted ? messages.cancelled_or_timeout! : '网络或结果校验失败，已保留本地反馈，没有自动重试。');
    } finally {
      clearTimeout(deadline);
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }
  return <section className="local-feedback remote-feedback" aria-labelledby="remote-feedback-title" data-testid="remote-feedback">
    <div className="panel-heading"><h4 id="remote-feedback-title">可选 · DeepSeek 证据复盘</h4><span className="neutral-badge">不参与评分或存档</span></div>
    <p>本地反馈始终可用。远程仅补充建议，引用通过检查也不代表内容绝对正确。</p>
    {offline ? <p data-testid="remote-offline">完整离线 HTML 不调用远程 AI、不保存密钥；请使用已配置的 Next 服务体验可选复盘。</p> : <>
      <details className="evidence-details"><summary>查看本次拟发送的最小学习事实</summary><p>仅本次关卡、算法、运行标识、地图修订、提示级别、预测统计与模板化事件。不含你的自由文本解释、存档、账号或完整聊天。</p><pre className="remote-facts" data-testid="remote-facts">{JSON.stringify(result.request, null, 2)}</pre></details>
      <label className="explanation-label" htmlFor="remote-access-token">复盘访问口令（不是 DeepSeek API Key）</label>
      <input id="remote-access-token" className="remote-token" type="password" autoComplete="off" maxLength={256} value={token} disabled={busy} onChange={e => setToken(e.target.value)} aria-describedby="remote-access-help" />
      <p id="remote-access-help" className="control-help">由本服务的维护者配置；仅在当前复盘组件内存中使用，不写入本机存档。</p>
      <label className="remote-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />我同意将上面列出的事实发送给 DeepSeek，并知悉可能产生费用。</label>
      <div className="reflection-actions"><button type="button" className="action-secondary" data-testid="request-remote" disabled={!consent || token.length < 32 || busy} onClick={() => void requestReview()}>请求 DeepSeek 复盘</button>{busy && <button type="button" className="action-quiet" onClick={cancel}>取消远程请求</button>}</div>
    </>}
    <p role="status" aria-live="polite" data-testid="remote-status">{status}</p>
    {feedback && <div data-testid="remote-result"><span className="neutral-badge">DeepSeek · 远程生成</span><p>{feedback.summary}</p><p>{feedback.nextQuestion}</p><p>{feedback.recommendation}</p><p>{feedback.insufficientEvidence ? '原因证据不足，不作能力判断。' : '仅解释本次已提供的事实，不作能力判断。'}</p><details className="evidence-details"><summary>核对远程引用</summary><ol>{feedback.evidence.map((e, i) => <li key={i}><p>{result.request.facts.events.find(f => f.eventId === e.eventId)!.description}</p><small>{e.eventId} · {e.factPath}</small></li>)}</ol></details></div>}
  </section>;
}
