import levelData from '../../fixtures/levels.json';
import type { LevelDefinition } from '../../contracts/types';

// The JSON import boundary is validated against level.schema.json by npm test.
// Keep a single source of truth; this layer does not generate search results.
export const missions = levelData as readonly LevelDefinition[];
