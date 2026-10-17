import { createDeepSeekHandler } from '../../../server/deepseek';
export const runtime = 'nodejs';
export const POST = createDeepSeekHandler(() => process.env);
