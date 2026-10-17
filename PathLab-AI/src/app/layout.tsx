import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './learning.css';

export const metadata: Metadata = {
  title: 'PathLab AI · 路径学习实验室',
  description: '先预测，再用已揭示事件理解 BFS 与 A*。四个校园任务、本地确定性搜索、Canvas 回放与证据检查，无需密钥；尚未连接远程 AI。',
};

export const viewport: Viewport = { themeColor: '#0b1118', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
