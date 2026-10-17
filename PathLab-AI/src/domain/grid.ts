import type { Position } from '../../contracts/types.ts';

export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly rows: readonly string[];
}
export interface SearchInput {
  readonly grid: Grid;
  readonly start: Position;
  readonly goal: Position;
}
export type GridInputErrorCode = 'invalid_grid' | 'invalid_position' | 'out_of_bounds' | 'blocked_endpoint';

export class GridInputError extends Error {
  readonly code: GridInputErrorCode;

  constructor(code: GridInputErrorCode, message: string) {
    super(message);
    this.name = 'GridInputError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isInBounds(grid: Grid, node: Position): boolean {
  return Number.isSafeInteger(node.x) && Number.isSafeInteger(node.y)
    && node.x >= 0 && node.y >= 0 && node.x < grid.width && node.y < grid.height;
}

export function isWalkable(grid: Grid, node: Position): boolean {
  return isInBounds(grid, node) && grid.rows[node.y]?.[node.x] === '.';
}

/** Includes invalid neighbors so the engine can emit explicit skip evidence. */
export function neighborsOf({ x, y }: Position): Position[] {
  return [{ x, y: y - 1 }, { x: x + 1, y }, { x, y: y + 1 }, { x: x - 1, y }];
}

/** Runtime boundary for direct calls, independent of React and level schemas. */
export function assertSearchInput(input: unknown): asserts input is SearchInput {
  if (!isRecord(input) || !isRecord(input.grid)) {
    throw new GridInputError('invalid_grid', 'Search input must contain a grid object.');
  }
  const { width, height, rows } = input.grid;
  if (typeof width !== 'number' || typeof height !== 'number'
    || !Number.isSafeInteger(width) || !Number.isSafeInteger(height)
    || width < 1 || height < 1 || width > 25 || height > 25) {
    throw new GridInputError('invalid_grid', 'Grid dimensions must be integers from 1 to 25.');
  }
  if (!Array.isArray(rows) || rows.length !== height) {
    throw new GridInputError('invalid_grid', 'Grid row count must equal height.');
  }
  // Do not use Array.every: it silently skips holes in sparse arrays.
  for (let y = 0; y < height; y++) {
    const row: unknown = rows[y];
    if (typeof row !== 'string' || row.length !== width || !/^[.#]+$/.test(row)) {
      throw new GridInputError('invalid_grid', 'Each grid row must match width and contain only . or #.');
    }
  }
  for (const name of ['start', 'goal'] as const) {
    const node = input[name];
    if (!isRecord(node) || typeof node.x !== 'number' || typeof node.y !== 'number'
      || !Number.isSafeInteger(node.x) || !Number.isSafeInteger(node.y)) {
      throw new GridInputError('invalid_position', name + ' must contain safe integer x and y coordinates.');
    }
    if (node.x < 0 || node.y < 0 || node.x >= width || node.y >= height) {
      throw new GridInputError('out_of_bounds', name + ' must be inside the grid.');
    }
    if (rows[node.y][node.x] !== '.') {
      throw new GridInputError('blocked_endpoint', name + ' must be on an open cell.');
    }
  }
}
