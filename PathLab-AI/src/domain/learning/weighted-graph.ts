/** A* on a small weighted directed graph: the worked example from the embedded video lesson. */
export interface GraphNode { readonly id: string; readonly x: number; readonly y: number; readonly h: number }
export interface GraphEdge { readonly from: string; readonly to: string; readonly cost: number }
export interface WeightedGraph { readonly nodes: readonly GraphNode[]; readonly edges: readonly GraphEdge[]; readonly start: string; readonly goal: string }
export interface GraphEntry { readonly id: string; readonly g: number; readonly h: number; readonly f: number; readonly parent: string | null; readonly order: number }
export interface GraphUpdate { readonly entry: GraphEntry; readonly previousG: number | null }
export interface GraphSkip { readonly id: string; readonly g: number; readonly reason: 'closed' | 'not_better' }
export interface GraphStep { readonly open: readonly GraphEntry[]; readonly picked: GraphEntry; readonly isGoal: boolean; readonly updates: readonly GraphUpdate[]; readonly skipped: readonly GraphSkip[] }
export interface GraphRun { readonly steps: readonly GraphStep[]; readonly path: readonly string[]; readonly cost: number | null }

export const VIDEO_GRAPH: WeightedGraph = {
  nodes: [
    { id: 'S', x: 40, y: 150, h: 6 },
    { id: 'A', x: 200, y: 50, h: 10 },
    { id: 'B', x: 200, y: 250, h: 2 },
    { id: 'C', x: 340, y: 250, h: 5 },
    { id: 'D', x: 340, y: 130, h: 1 },
    { id: 'T', x: 480, y: 130, h: 0 },
  ],
  edges: [
    { from: 'S', to: 'A', cost: 1 },
    { from: 'S', to: 'B', cost: 4 },
    { from: 'A', to: 'T', cost: 12 },
    { from: 'B', to: 'D', cost: 2 },
    { from: 'B', to: 'C', cost: 1 },
    { from: 'D', to: 'T', cost: 3 },
    { from: 'C', to: 'T', cost: 5 },
  ],
  start: 'S',
  goal: 'T',
};

export function compareEntries(a: GraphEntry, b: GraphEntry): number {
  return a.f - b.f || a.h - b.h || a.order - b.order;
}

export function runGraphAstar(graph: WeightedGraph): GraphRun {
  const h = new Map(graph.nodes.map(node => [node.id, node.h]));
  const open = new Map<string, GraphEntry>();
  const best = new Map<string, GraphEntry>();
  const closed = new Set<string>();
  const steps: GraphStep[] = [];
  let order = 0;
  const put = (id: string, g: number, parent: string | null): GraphEntry => {
    const entry: GraphEntry = { id, g, h: h.get(id)!, f: g + h.get(id)!, parent, order: order++ };
    open.set(id, entry);
    best.set(id, entry);
    return entry;
  };
  put(graph.start, 0, null);
  while (open.size > 0) {
    const list = [...open.values()].sort(compareEntries);
    const picked = list[0]!;
    open.delete(picked.id);
    if (picked.id === graph.goal) {
      steps.push({ open: list, picked, isGoal: true, updates: [], skipped: [] });
      const path: string[] = [];
      for (let cursor: string | null = picked.id; cursor !== null; cursor = best.get(cursor)!.parent) path.unshift(cursor);
      return { steps, path, cost: picked.g };
    }
    closed.add(picked.id);
    const updates: GraphUpdate[] = [];
    const skipped: GraphSkip[] = [];
    for (const edge of graph.edges.filter(item => item.from === picked.id)) {
      const g = picked.g + edge.cost;
      const previous = best.get(edge.to);
      if (closed.has(edge.to)) skipped.push({ id: edge.to, g, reason: 'closed' });
      else if (previous && g >= previous.g) skipped.push({ id: edge.to, g, reason: 'not_better' });
      else updates.push({ entry: put(edge.to, g, picked.id), previousG: previous?.g ?? null });
    }
    steps.push({ open: list, picked, isGoal: false, updates, skipped });
  }
  return { steps, path: [], cost: null };
}
