// The single-file build injects every file in public/media as a data URL; Next serves the same files from /media.
declare global { interface Window { __PATHLAB_MEDIA__?: Record<string, string> } }

export type MediaName = 'naiwa.webp' | 'astar-io.jpg' | 'astar-principle.jpg' | 'astar-formula.jpg' | 'astar-scenes.jpg' | 'astar-video.mp4';

export function mediaUrl(name: MediaName): string {
  return (typeof window === 'undefined' ? undefined : window.__PATHLAB_MEDIA__?.[name]) ?? '/media/' + name;
}

/** Large embedded videos seek reliably only from a Blob URL, not a multi-megabyte data URL. */
export function playableUrl(name: MediaName): { url: string; release: () => void } {
  const url = mediaUrl(name);
  const match = /^data:([^;]+);base64,/.exec(url);
  if (!match) return { url, release: () => {} };
  const binary = atob(url.slice(match[0].length));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  const blob = URL.createObjectURL(new Blob([bytes], { type: match[1]! }));
  return { url: blob, release: () => URL.revokeObjectURL(blob) };
}
