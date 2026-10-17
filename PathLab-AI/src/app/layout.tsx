import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'PathLab AI · 路径学习实验室',
  description: '先预测，再用证据理解算法。当前提供固定关卡简报与静态地图，搜索与 AI 尚未接入。',
};

export const viewport: Viewport = { themeColor: '#0b1118', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
