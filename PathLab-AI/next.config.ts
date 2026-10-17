import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Repository rules live at the workspace root; avoid a second managed AGENTS.md.
  agentRules: false,
  // Resolve from this application, not an unrelated parent lockfile.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
