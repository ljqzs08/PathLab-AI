/** Same components/domain as Next; this entry adds no server or duplicate game logic. */
import { createRoot } from 'react-dom/client';
import { PathLabShell } from './components/PathLabShell';

const container = document.getElementById('pathlab-root');
if (!container) throw new Error('PathLab HTML 缺少应用容器。');
document.documentElement.dataset.pathlabStandalone = 'true';
createRoot(container).render(<PathLabShell />);
