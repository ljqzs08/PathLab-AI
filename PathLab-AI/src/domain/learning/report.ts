import type { Algorithm, Counterfactual, Metrics } from '../../../contracts/types.ts';
import type { CompletedRun } from './session.ts';
import { buildLocalFeedback, type LocalFeedbackResult } from './diagnose.ts';

export interface RunComparison {
  change: Counterfactual; changeEventId: string;
  previous: { runId: string; gridRevision: number; metrics: Metrics; evidenceEventId: string };
  current: { runId: string; gridRevision: number; metrics: Metrics; evidenceEventId: string };
  delta: { pathLength: number | null; expandedCount: number };
}
export interface ReflectionReport extends LocalFeedbackResult {
  runId: string; gridRevision: number; algorithm: Algorithm; explanation: string | null; evidenceEventIds: string[];
  comparison: RunComparison | null;
  completion: { predictionsAttempted: boolean; conditionRunCompleted: boolean; evidenceExplanationProvided: boolean; comparisonEvidenceProvided: boolean; recordComplete: boolean };
}

export function compareRuns(run: CompletedRun, completed: readonly CompletedRun[]): RunComparison | null {
  const change = run.events.find(e => e.type === 'counterfactual_applied');
  if (!change || change.type !== 'counterfactual_applied') return null;
  const previous = completed.find(r => r.runId === change.payload.previousRunId);
  const previousEnd = previous?.events.find(e => e.type === 'run_finished');
  const currentEnd = run.events.find(e => e.type === 'run_finished');
  if (!previous || !previousEnd || !currentEnd || previous.algorithm !== run.algorithm
    || previous.gridRevision !== change.payload.previousGridRevision || run.gridRevision !== change.payload.newGridRevision) return null;
  return structuredClone({ change: change.payload.change, changeEventId: change.eventId,
    previous: { runId: previous.runId, gridRevision: previous.gridRevision, metrics: previous.metrics, evidenceEventId: previousEnd.eventId },
    current: { runId: run.runId, gridRevision: run.gridRevision, metrics: run.metrics, evidenceEventId: currentEnd.eventId },
    delta: { pathLength: previous.metrics.pathLength === null || run.metrics.pathLength === null ? null : run.metrics.pathLength - previous.metrics.pathLength,
      expandedCount: run.metrics.expandedCount - previous.metrics.expandedCount },
  });
}

export function createReflectionReport(run: CompletedRun, completed: readonly CompletedRun[], explanation: string, evidenceEventIds: string[]): ReflectionReport {
  const diagnosis = buildLocalFeedback(run), text = explanation.trim();
  if (text.length > 500 || new Set(evidenceEventIds).size !== evidenceEventIds.length || evidenceEventIds.length > 12
    || evidenceEventIds.some(id => !diagnosis.request.facts.events.some(e => e.eventId === id))
    || (!!text !== (evidenceEventIds.length > 0))) throw new Error('解释限 500 字，并须选择本次已揭示的真实证据；空解释不能附证据。');
  const comparison = compareRuns(run, completed);
  const completion = {
    predictionsAttempted: run.predictions.length > 0,
    conditionRunCompleted: comparison !== null,
    evidenceExplanationProvided: text.length > 0 && evidenceEventIds.length > 0,
    comparisonEvidenceProvided: comparison !== null && evidenceEventIds.includes(comparison.changeEventId) && evidenceEventIds.includes(comparison.current.evidenceEventId),
    recordComplete: false,
  };
  completion.recordComplete = completion.predictionsAttempted && completion.conditionRunCompleted && completion.evidenceExplanationProvided && completion.comparisonEvidenceProvided;
  return structuredClone({ ...diagnosis, runId: run.runId, gridRevision: run.gridRevision, algorithm: run.algorithm,
    explanation: text || null, evidenceEventIds, comparison, completion });
}
