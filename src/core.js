const OUTCOME_LIMIT = 3;
const GATE_DECISIONS = ['accept', 'rework', 'pause', 'next'];

function nextId(items, prefix) {
  const maxExistingId = items.reduce((max, item) => {
    const match = typeof item.id === 'string' ? item.id.match(new RegExp(`^${prefix}-(\\d+)$`)) : null;
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${prefix}-${maxExistingId + 1}`;
}

function nextItemState(state, collectionName, prefix, item) {
  const items = state[collectionName];
  const nextFromCounter = (state.counters?.[prefix] || 0) + 1;
  const nextFromItems = Number(nextId(items, prefix).replace(`${prefix}-`, ''));
  const nextNumber = Math.max(nextFromCounter, nextFromItems);

  return {
    ...state,
    counters: {
      ...(state.counters || {}),
      [prefix]: nextNumber
    },
    [collectionName]: [
      ...items,
      {
        id: `${prefix}-${nextNumber}`,
        ...item
      }
    ]
  };
}

function requireOutcome(state, outcomeId) {
  const outcome = state.outcomes.find((item) => item.id === outcomeId);
  if (!outcome) {
    throw new Error('OUTCOME_NOT_FOUND');
  }
  return outcome;
}

function updateRun(state, runId, updater) {
  let found = false;
  const agentRuns = state.agentRuns.map((run) => {
    if (run.id !== runId) {
      return run;
    }
    found = true;
    return updater(run);
  });

  if (!found) {
    throw new Error('RUN_NOT_FOUND');
  }

  return { ...state, agentRuns };
}

export function createInitialState(date) {
  return {
    date,
    counters: {},
    outcomes: [],
    ideas: [],
    agentRuns: []
  };
}

export function addOutcome(state, outcome) {
  if (state.outcomes.length >= OUTCOME_LIMIT) {
    throw new Error('OUTCOME_LIMIT');
  }

  return nextItemState(state, 'outcomes', 'outcome', {
    status: 'active',
    ...outcome
  });
}

export function parkIdea(state, idea) {
  return nextItemState(state, 'ideas', 'idea', {
    status: 'parked',
    ...idea
  });
}

export function canPromoteIdea(state, ideaId) {
  const idea = state.ideas.find((item) => item.id === ideaId);
  if (!idea || !idea.linkedOutcomeId) {
    return false;
  }

  const linkedOutcome = state.outcomes.find((outcome) => outcome.id === idea.linkedOutcomeId);

  return Boolean(
    linkedOutcome &&
      linkedOutcome.status === 'active' &&
      idea.whyToday &&
      idea.whyToday.trim() &&
      idea.costOfDelay &&
      idea.costOfDelay.trim()
  );
}

export function startAgentRun(state, run) {
  const outcome = requireOutcome(state, run.outcomeId);
  if (outcome.status === 'completed') {
    throw new Error('OUTCOME_NOT_ACTIVE');
  }

  return nextItemState(state, 'agentRuns', 'run', {
    status: 'running',
    ...run
  });
}

export function completeAgentRun(state, runId, result) {
  return updateRun(state, runId, (run) => ({
    ...run,
    status: 'review_gate',
    result: { ...result },
    returnGate: {
      allowedDecisions: [...GATE_DECISIONS]
    }
  }));
}

export function getSuggestedHumanTasks(state, runId) {
  const run = state.agentRuns.find((item) => item.id === runId);
  if (!run) {
    throw new Error('RUN_NOT_FOUND');
  }

  const outcome = requireOutcome(state, run.outcomeId);
  const baseTask = {
    outcomeId: run.outcomeId,
    agentRunId: run.id,
    agentIndependent: true
  };

  return [
    {
      ...baseTask,
      title: `Clarify acceptance notes for ${outcome.title}`
    },
    {
      ...baseTask,
      title: `Gather evidence needed for ${outcome.metric}`
    },
    {
      ...baseTask,
      title: `Prepare the next review decision for ${run.title}`
    }
  ];
}

export function recordGateDecision(state, runId, decisionRecord) {
  const run = state.agentRuns.find((item) => item.id === runId);
  if (!run) {
    throw new Error('RUN_NOT_FOUND');
  }

  if (!GATE_DECISIONS.includes(decisionRecord.decision)) {
    throw new Error('INVALID_GATE_DECISION');
  }

  if (run.status !== 'review_gate') {
    throw new Error('RUN_NOT_IN_REVIEW_GATE');
  }

  const nextState = updateRun(state, runId, (run) => ({
    ...run,
    status: decisionRecord.decision,
    returnGate: {
      ...run.returnGate,
      decision: { ...decisionRecord }
    }
  }));

  if (decisionRecord.decision !== 'accept') {
    return nextState;
  }

  return {
    ...nextState,
    outcomes: nextState.outcomes.map((outcome) =>
      outcome.id === run.outcomeId ? { ...outcome, status: 'completed' } : outcome
    )
  };
}

export function getDailyReview(state) {
  const completedOutcomes = state.outcomes.filter((outcome) => outcome.status === 'completed').length;
  const parkedIdeas = state.ideas.filter((idea) => idea.status === 'parked').length;
  const nextOutcome = state.outcomes.find((outcome) => outcome.status !== 'completed');

  return {
    date: state.date,
    totalOutcomes: state.outcomes.length,
    completedOutcomes,
    parkedIdeas,
    nextFirstMove: nextOutcome ? nextOutcome.title : ''
  };
}
