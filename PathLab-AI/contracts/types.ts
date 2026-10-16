/** Stage 0 contract types. Runtime JSON schemas remain the boundary validator. */
export type Algorithm = 'bfs' | 'astar';
export type Position = Readonly<{ x: number; y: number }>;
export type LearningState = 'idle' | 'briefing' | 'editing' | 'prediction' | 'running' | 'paused' | 'reflection' | 'counterfactual' | 'report';
export type ErrorType = 'only_goal_distance' | 'ignore_path_cost' | 'misunderstand_queue_order' | 'confuse_search_and_path' | 'overtrust_greedy_choice' | 'cannot_explain_counterfactual';
export type Counterfactual = { type: 'block_cell'; cell: Position } | { type: 'move_goal'; cell: Position };
export interface LevelDefinition {
  schemaVersion: 1; id: string; title: string; narrative: string;
  learningObjectives: string[]; algorithms: Algorithm[];
  grid: { width: number; height: number; rows: string[] };
  start: Position; goal: Position;
  checkpoints: { id: string; beforeSelectionOrdinal: number; minCandidates: 2; prompt: string }[];
  counterfactual: Counterfactual; successCriteria: string[]; teachingNotes: string[];
}
export interface Feedback {
  schemaVersion: 1; mode: 'local' | 'remote'; summary: string;
  primaryErrorType: ErrorType | null;
  evidence: { eventId: string; factPath: string }[];
  hintLevel: 1 | 2 | 3 | 4; nextQuestion: string; recommendation: string;
  insufficientEvidence: boolean;
}
export interface Candidate { node: Position; entrySequence: number; distanceFromStart: number; g: number; h: number; f: number }
export interface Metrics { discoveredCount: number; expandedCount: number; selectionCount: number; frontierPeak: number; pathLength: number | null }
export interface EventPayloadMap {
  mission_started: { gridRevision: number };
  prediction_requested: { checkpointId: string; candidates: Candidate[] };
  prediction_submitted: { checkpointId: string; selected: Position; actual: Position; candidates: Candidate[]; correct: boolean; hintLevel: 0|1|2|3|4; elapsedBucket: 'under_10s'|'10_to_30s'|'over_30s'; retryCount: number };
  node_discovered: { node: Position; parent: Position|null; g: number; h: number; f: number; entrySequence: number };
  node_relaxed: { node: Position; parent: Position; previousG: number; g: number; h: number; f: number; entrySequence: number };
  node_selected: { node: Position; g: number; h: number; f: number; entrySequence: number };
  node_expanded: { node: Position };
  node_skipped: { node: Position; reason: 'blocked'|'out_of_bounds'|'already_discovered'|'not_better'|'stale_entry' };
  frontier_snapshot: { nodes: Omit<Candidate, 'distanceFromStart'>[] };
  path_updated: { nodes: Position[]; final: boolean };
  run_paused: { reason: 'user'|'checkpoint'|'restore' };
  run_resumed: { speed: 0.5|1|2|4 };
  run_finished: { status: 'found'|'unreachable'; path: Position[]; metrics: Metrics };
  counterfactual_applied: { previousRunId: string; previousGridRevision: number; newGridRevision: number; change: Counterfactual };
  diagnosis_generated: { feedbackId: string; mode: 'local'|'remote'; evidenceEventIds: string[] };
  reflection_completed: { evidenceEventIds: string[]; explanation: string };
}
export type SearchEvent = { [K in keyof EventPayloadMap]: {
  schemaVersion: 1; eventId: string; sessionId: string; runId: string; levelId: 'L01'|'L02'|'L03'|'L04'; gridRevision: number;
  algorithm: Algorithm; algorithmVersion: '1.0.0'; step: number; type: K; payload: EventPayloadMap[K]; createdAt: string;
} }[keyof EventPayloadMap];
export type EngineEventType = 'node_discovered' | 'node_relaxed' | 'node_selected' | 'node_expanded' | 'node_skipped' | 'frontier_snapshot' | 'path_updated' | 'run_finished';
export type DeterministicEvent = { [K in EngineEventType]: { step: number; type: K; payload: EventPayloadMap[K] } }[EngineEventType];
export interface FeedbackRequest {
  schemaVersion: 1; levelId: 'L01'|'L02'|'L03'|'L04'; algorithm: Algorithm; runId: string; gridRevision: number;
  requestedHintLevel: 1|2|3|4; answerRevealed: boolean;
  facts: { predictionCount: number; correctCount: number; candidateErrorTypes: ErrorType[];
    events: { eventId: string; type: 'prediction_submitted'|'run_finished'|'counterfactual_applied'|'reflection_completed'; description: string }[] };
}
// Compile-only examples, explicitly synthetic; not user history or a finished algorithm.
const example: SearchEvent = { schemaVersion: 1, eventId: 'fixture:0', sessionId: 'fixture', runId: 'fixture-run', levelId: 'L01', gridRevision: 0, algorithm: 'bfs', algorithmVersion: '1.0.0', step: 0, type: 'node_expanded', payload: { node: {x: 0, y: 2} }, createdAt: '2026-10-17T00:00:00.000Z' };
void example;
// @ts-expect-error selected events require node, costs, and sequence.
const invalidPayload: EventPayloadMap['node_selected'] = { reason: 'blocked' };
void invalidPayload;
