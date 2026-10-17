import Ajv2020 from 'ajv/dist/2020.js';
import requestSchema from '../../../contracts/feedback-request.schema.json' with { type: 'json' };
import feedbackSchema from '../../../contracts/feedback.schema.json' with { type: 'json' };
import type { Feedback, FeedbackRequest } from '../../../contracts/types.ts';
import { assertFeedbackReferences } from './diagnose.ts';

const ajv = new Ajv2020({ strict: true, allErrors: false });
const requestValid = ajv.compile<FeedbackRequest>(requestSchema);
const feedbackValid = ajv.compile<Feedback>(feedbackSchema);
export function validateRemoteRequest(value: unknown): FeedbackRequest {
  if (!requestValid(value) || !value.answerRevealed
    || value.facts.correctCount > value.facts.predictionCount
    || new Set(value.facts.events.map(e => e.eventId)).size !== value.facts.events.length
    || !value.facts.events.some(e => e.type === 'run_finished')
    || value.facts.events.some(e => e.type === 'reflection_completed')) throw new Error('invalid_request');
  return value;
}
export function validateRemoteFeedback(request: FeedbackRequest, value: unknown): Feedback {
  if (!feedbackValid(value)) throw new Error('invalid_feedback');
  assertFeedbackReferences(request, value);
  // The transport, not the model, is the authority on provenance.
  return { ...value, mode: 'remote' };
}
