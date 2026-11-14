import { useEffect, useRef, useState, type ReactNode } from 'react';
import { mediaUrl } from '../media';

export type NaiwaMood = 'wave' | 'happy' | 'think' | 'oops';

/** The cartoon guide. Lines are shown one at a time so a beginner reads one idea before the next. */
export function Naiwa({ lines, mood = 'wave', size = 'md', label = '奶娃说' }: { lines: readonly ReactNode[]; mood?: NaiwaMood; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const [index, setIndex] = useState(0);
  const line = lines[Math.min(index, lines.length - 1)];
  return <div className={'naiwa naiwa--' + size} data-mood={mood} data-testid="naiwa">
    {/* eslint-disable-next-line @next/next/no-img-element -- the single-file build embeds media as data URLs */}
    <img className="naiwa-figure" src={mediaUrl('naiwa.webp')} alt="" width={163} height={210} />
    <div className="naiwa-bubble" role="note" aria-label={label}>
      <span className="naiwa-name">奶娃</span>
      <div className="naiwa-line" aria-live="polite">{line}</div>
      {lines.length > 1 && <div className="naiwa-controls">
        <span>{index + 1} / {lines.length}</span>
        <button type="button" className="naiwa-next" onClick={() => setIndex((index + 1) % lines.length)}>{index + 1 < lines.length ? '下一句 →' : '再听一遍'}</button>
      </div>}
    </div>
  </div>;
}

/** Click to enlarge; the native dialog keeps focus trapped and closes with Esc. */
export function Picture({ src, alt, caption }: { src: string; alt: string; caption?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return <figure className="picture">
    <button type="button" className="picture-thumb" onClick={() => setOpen(true)} aria-label={'放大查看：' + alt}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the single-file build embeds media as data URLs */}
      <img src={src} alt={alt} loading="lazy" />
      <span className="picture-zoom" aria-hidden="true">点击放大 ⤢</span>
    </button>
    {caption && <figcaption>{caption}</figcaption>}
    <dialog ref={dialog} className="picture-dialog" aria-label={alt} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the single-file build embeds media as data URLs */}
      {open && <img src={src} alt={alt} />}
      <button type="button" className="action-primary picture-close" onClick={() => setOpen(false)}>关闭</button>
    </dialog>
  </figure>;
}
