import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addOutcome,
  canPromoteIdea,
  completeAgentRun,
  createInitialState,
  getDailyReview,
  getSuggestedHumanTasks,
  parkIdea,
  recordGateDecision,
  startAgentRun
} from '../src/core.js';

test('limits daily outcomes to three concrete results', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Ship the landing proof', metric: 'Public demo URL exists' });
  state = addOutcome(state, { title: 'Reply to five prospects', metric: 'Five replies sent' });
  state = addOutcome(state, { title: 'Review agent patch', metric: 'Decision recorded' });

  assert.equal(state.outcomes.length, 3);
  assert.throws(
    () => addOutcome(state, { title: 'Start another side project', metric: 'Repository created' }),
    /OUTCOME_LIMIT/
  );
});

test('starts an agent run and suggests human-only work tied to the outcome', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Publish the prototype', metric: 'Prototype can be opened locally' });
  const outcomeId = state.outcomes[0].id;

  state = startAgentRun(state, {
    outcomeId,
    title: 'Codex builds the app shell',
    expectedMinutes: 25,
    humanMode: 'maker'
  });

  const run = state.agentRuns[0];
  assert.equal(run.status, 'running');
  assert.equal(run.outcomeId, outcomeId);

  const suggestions = getSuggestedHumanTasks(state, run.id);
  assert.ok(suggestions.length >= 3);
  assert.ok(suggestions.every((task) => task.outcomeId === outcomeId));
  assert.ok(suggestions.every((task) => task.agentIndependent === true));
});

test('rejects agent runs for completed outcomes', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Publish the prototype', metric: 'Prototype can be opened locally' });
  state = {
    ...state,
    outcomes: state.outcomes.map((outcome) => ({ ...outcome, status: 'completed' }))
  };

  assert.throws(
    () =>
      startAgentRun(state, {
        outcomeId: state.outcomes[0].id,
        title: 'Codex builds the app shell',
        expectedMinutes: 25,
        humanMode: 'maker'
      }),
    /OUTCOME_NOT_ACTIVE/
  );
});

test('keeps divergent ideas parked until they serve a current outcome and matter today', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Validate the focus board', metric: 'One real dogfood session logged' });
  const outcomeId = state.outcomes[0].id;

  state = parkIdea(state, {
    title: 'Add team billing',
    linkedOutcomeId: null,
    whyToday: '',
    costOfDelay: ''
  });
  assert.equal(canPromoteIdea(state, state.ideas[0].id), false);

  state = parkIdea(state, {
    title: 'Record one dogfood friction note',
    linkedOutcomeId: outcomeId,
    whyToday: 'Needed to validate the board today',
    costOfDelay: 'Tomorrow starts without evidence'
  });
  assert.equal(canPromoteIdea(state, state.ideas[1].id), true);
});

test('keeps ids unique after list items are removed', () => {
  let state = createInitialState('2026-06-23');
  state = parkIdea(state, {
    title: 'First idea',
    linkedOutcomeId: null,
    whyToday: '',
    costOfDelay: ''
  });
  state = { ...state, ideas: [] };
  state = parkIdea(state, {
    title: 'Second idea',
    linkedOutcomeId: null,
    whyToday: '',
    costOfDelay: ''
  });

  assert.equal(state.ideas[0].id, 'idea-2');
});

test('does not promote ideas linked to completed outcomes', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Validate the focus board', metric: 'One real dogfood session logged' });
  const outcomeId = state.outcomes[0].id;
  state = {
    ...state,
    outcomes: state.outcomes.map((outcome) => ({ ...outcome, status: 'completed' }))
  };

  state = parkIdea(state, {
    title: 'Record one dogfood friction note',
    linkedOutcomeId: outcomeId,
    whyToday: 'Needed to validate the board today',
    costOfDelay: 'Tomorrow starts without evidence'
  });

  assert.equal(canPromoteIdea(state, state.ideas[0].id), false);
});

test('moves a completed agent run into a return gate with four allowed decisions', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Prepare public README', metric: 'README explains setup and boundary' });
  const outcomeId = state.outcomes[0].id;
  state = startAgentRun(state, {
    outcomeId,
    title: 'Draft README',
    expectedMinutes: 15,
    humanMode: 'promoter'
  });
  const runId = state.agentRuns[0].id;

  state = completeAgentRun(state, runId, {
    summary: 'README draft complete',
    evidence: 'README.md created'
  });

  const run = state.agentRuns[0];
  assert.equal(run.status, 'review_gate');
  assert.deepEqual(run.returnGate.allowedDecisions, ['accept', 'rework', 'pause', 'next']);

  state = recordGateDecision(state, runId, {
    decision: 'rework',
    note: 'Missing Chinese quick start'
  });

  assert.equal(state.agentRuns[0].status, 'rework');
  assert.equal(state.agentRuns[0].returnGate.decision.note, 'Missing Chinese quick start');
});

test('rejects gate decisions for runs that are not in the review gate', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Prepare public README', metric: 'README explains setup and boundary' });
  const outcomeId = state.outcomes[0].id;
  state = startAgentRun(state, {
    outcomeId,
    title: 'Draft README',
    expectedMinutes: 15,
    humanMode: 'promoter'
  });
  const runId = state.agentRuns[0].id;

  assert.throws(
    () =>
      recordGateDecision(state, runId, {
        decision: 'accept',
        note: 'Looks ready'
      }),
    /RUN_NOT_IN_REVIEW_GATE/
  );
  assert.equal(state.agentRuns[0].status, 'running');
  assert.equal(state.outcomes[0].status, 'active');
});

test('summarizes focus without pretending unfinished work is done', () => {
  let state = createInitialState('2026-06-23');
  state = addOutcome(state, { title: 'Run a dogfood session', metric: 'Session note exists' });
  state = parkIdea(state, { title: 'Build a mobile app', linkedOutcomeId: null, whyToday: '', costOfDelay: '' });

  const review = getDailyReview(state);
  assert.equal(review.completedOutcomes, 0);
  assert.equal(review.parkedIdeas, 1);
  assert.equal(review.nextFirstMove, 'Run a dogfood session');
});
