/** Stage 0 specification checks only; not an application engine or remote adapter. */
import assert from 'node:assert/strict';
export function validateLevelRelations(level) {
  const { width, height, rows } = level.grid;
  assert.equal(rows.length, height, 'row count must equal height');
  assert(rows.every(row => row.length === width), 'row widths must match');
  const open = ({x,y}) => x >= 0 && y >= 0 && x < width && y < height && rows[y][x] === '.';
  assert(open(level.start) && open(level.goal), 'endpoints must be open and in bounds');
  const cell = level.counterfactual.cell;
  assert(open(cell), 'counterfactual target must be an open in-bounds cell');
  const same = (a,b) => a.x === b.x && a.y === b.y;
  if (level.counterfactual.type === 'block_cell') assert(!same(cell,level.start) && !same(cell,level.goal), 'cannot block an endpoint');
  if (level.counterfactual.type === 'move_goal') assert(!same(cell,level.goal), 'goal must change');
  assert.equal(new Set(level.checkpoints.map(p => p.id)).size, level.checkpoints.length);
  for (let i=1;i<level.checkpoints.length;i++) assert(level.checkpoints[i].beforeSelectionOrdinal > level.checkpoints[i-1].beforeSelectionOrdinal, 'checkpoints must be ordered');
}
export function validateFeedbackRelations(request, response) {
  assert(request.facts.correctCount <= request.facts.predictionCount, 'correct count exceeds total');
  assert(response.hintLevel <= request.requestedHintLevel, 'hint escalation requires user request');
  assert(request.answerRevealed, 'MVP remote feedback only follows submitted prediction');
  const events=request.facts.events;
  assert.equal(new Set(events.map(e=>e.eventId)).size,events.length,'duplicate event IDs');
  if (response.insufficientEvidence) assert.equal(response.primaryErrorType,null,'insufficient evidence cannot diagnose');
  else assert(response.evidence.length>0,'judgment requires evidence');
  if(response.primaryErrorType!==null) assert(request.facts.candidateErrorTypes.includes(response.primaryErrorType),'error not established by local evidence');
  for(const evidence of response.evidence) {
    const match=/^\/facts\/events\/(0|[1-9]\d*)\/description$/.exec(evidence.factPath);
    assert(match,'MVP evidence must point to an event description');
    assert.equal(events[Number(match[1])]?.eventId,evidence.eventId,'event reference must resolve to the same supplied event');
  }
}
