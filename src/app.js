(function () {
  'use strict';

  const storage = window.AgentTempoStorage;
  const i18n = window.AgentTempoI18n;
  const app = document.getElementById('app');
  const today = new Date().toISOString().slice(0, 10);

  let core = null;
  let state = normalizeState(storage.loadState() || { date: today });
  let statusMessage = '';

  init();

  function init() {
    import('./core.js')
      .then((module) => {
        core = module;
        state = normalizeState(state);
        render();
      })
      .catch(() => {
        renderCoreLoadFailure();
      });
  }

  function normalizeState(nextState) {
    const normalized = {
      date: nextState.date || today,
      locale: i18n.normalizeLocale(nextState.locale),
      outcomes: Array.isArray(nextState.outcomes) ? nextState.outcomes : [],
      agentRuns: Array.isArray(nextState.agentRuns) ? nextState.agentRuns : [],
      ideas: Array.isArray(nextState.ideas) ? nextState.ideas : [],
      counters: nextState.counters && typeof nextState.counters === 'object' ? nextState.counters : {},
      humanTaskDone: nextState.humanTaskDone && typeof nextState.humanTaskDone === 'object' ? nextState.humanTaskDone : {}
    };
    return normalized;
  }

  function persist() {
    state = normalizeState(state);
    const saved = storage.saveState(state);
    if (!saved) statusMessage = t('saveFailed');
    document.documentElement.lang = state.locale === 'en' ? 'en' : 'zh-CN';
  }

  function t(key) {
    return i18n.t(state.locale, key);
  }

  function render() {
    persist();
    app.innerHTML = `
      <header class="topbar">
        <div>
          <p class="kicker">${escapeHtml(t('appKicker'))}</p>
          <h1 id="app-title">${escapeHtml(t('appTitle'))}</h1>
          <p class="local-note">${escapeHtml(t('localOnly'))}</p>
        </div>
        <div class="topbar-actions" aria-label="${escapeAttr(t('language'))}">
          <button class="ghost-button" type="button" data-action="toggle-locale">${escapeHtml(t('switchToEnglish'))}</button>
          <button class="danger-button" type="button" data-action="clear-state">${escapeHtml(t('clear'))}</button>
        </div>
      </header>

      <section class="status-strip" aria-label="${escapeAttr(t('dailyReview'))}">
        ${renderDailyReview()}
      </section>

      ${statusMessage ? `<p class="form-status" role="status">${escapeHtml(statusMessage)}</p>` : ''}

      <div class="work-grid">
        ${renderGoals()}
        ${renderAgents()}
        ${renderHumanLane()}
        ${renderParkingLot()}
        ${renderReturnGate()}
      </div>
    `;
  }

  function renderCoreLoadFailure() {
    app.innerHTML = `
      <section class="boot-panel" role="alert">
        <p class="kicker">${escapeHtml(t('appKicker'))}</p>
        <h1>${escapeHtml(t('appTitle'))}</h1>
        <p>${escapeHtml(t('coreLoadFailed'))}</p>
      </section>
    `;
  }

  function renderDailyReview() {
    const review = core.getDailyReview(state);
    return `
      <div><span>${escapeHtml(t('todayLabel'))}</span><strong>${escapeHtml(state.date)}</strong></div>
      <div><span>${escapeHtml(t('done'))}</span><strong>${review.completedOutcomes}/${state.outcomes.length}</strong></div>
      <div><span>${escapeHtml(t('parkingLot'))}</span><strong>${review.parkedIdeas}</strong></div>
      <div class="next-move"><span>${escapeHtml(t('next'))}</span><strong>${escapeHtml(formatNextMove(review.nextFirstMove))}</strong></div>
    `;
  }

  function formatNextMove(nextFirstMove) {
    return nextFirstMove ? `${t('startWith')} ${nextFirstMove}` : t('noUnfinished');
  }

  function renderGoals() {
    return `
      <section class="panel panel-goals" aria-labelledby="goals-title">
        <div class="section-heading">
          <h2 id="goals-title">${escapeHtml(t('todayGoals'))}</h2>
          <span class="count-pill">${state.outcomes.length}/3</span>
        </div>
        <form class="stacked-form" data-form="goal">
          <label for="goal-title">${escapeHtml(t('goalTitle'))}</label>
          <input id="goal-title" name="title" type="text" maxlength="96" placeholder="${escapeAttr(t('titlePlaceholder'))}" required>
          <label for="goal-metric">${escapeHtml(t('goalMetric'))}</label>
          <input id="goal-metric" name="metric" type="text" maxlength="120" placeholder="${escapeAttr(t('metricPlaceholder'))}" required>
          <button type="submit">${escapeHtml(t('addGoal'))}</button>
        </form>
        <div class="item-list">
          ${state.outcomes.length ? state.outcomes.map(renderGoal).join('') : `<p class="empty-state">${escapeHtml(t('emptyGoals'))}</p>`}
        </div>
      </section>
    `;
  }

  function renderGoal(goal, index) {
    const completed = goal.done === true || goal.status === 'completed';
    return `
      <article class="item goal-item">
        <div>
          <span class="index">${index + 1}</span>
          <h3>${escapeHtml(goal.title)}</h3>
          <p>${escapeHtml(goal.metric || '')}</p>
        </div>
        <button class="${completed ? 'done-button active' : 'done-button'}" type="button" data-action="toggle-goal" data-id="${escapeAttr(goal.id)}">
          ${completed ? escapeHtml(t('workDone')) : escapeHtml(t('done'))}
        </button>
      </article>
    `;
  }

  function renderAgents() {
    const running = state.agentRuns.filter((run) => run.status === 'running');
    return `
      <section class="panel panel-agents" aria-labelledby="agents-title">
        <div class="section-heading">
          <h2 id="agents-title">${escapeHtml(t('activeAgents'))}</h2>
          <span class="count-pill">${running.length}</span>
        </div>
        <form class="stacked-form" data-form="agent">
          <label for="agent-outcome">${escapeHtml(t('runFor'))}</label>
          <select id="agent-outcome" name="outcomeId" required>
            <option value="">${escapeHtml(t('selectGoal'))}</option>
            ${activeOutcomes().map((goal) => `<option value="${escapeAttr(goal.id)}">${escapeHtml(goal.title)}</option>`).join('')}
          </select>
          <label for="agent-title">${escapeHtml(t('agentName'))}</label>
          <input id="agent-title" name="title" type="text" maxlength="100" required>
          <div class="form-row">
            <div>
              <label for="agent-minutes">${escapeHtml(t('agentExpected'))}</label>
              <input id="agent-minutes" name="expectedMinutes" type="number" min="5" max="240" step="5" value="25">
            </div>
            <div>
              <label for="agent-mode">${escapeHtml(t('agentMode'))}</label>
              <select id="agent-mode" name="humanMode">
                <option value="maker">${escapeHtml(t('maker'))}</option>
                <option value="manager">${escapeHtml(t('manager'))}</option>
                <option value="promoter">${escapeHtml(t('promoter'))}</option>
              </select>
            </div>
          </div>
          <button type="submit">${escapeHtml(t('startRun'))}</button>
        </form>
        <div class="item-list">
          ${running.length ? running.map(renderRunningAgent).join('') : `<p class="empty-state">${escapeHtml(t('emptyAgents'))}</p>`}
        </div>
      </section>
    `;
  }

  function renderRunningAgent(run) {
    const goal = findOutcome(run.outcomeId);
    return `
      <article class="item agent-item">
        <div>
          <h3>${escapeHtml(run.title)}</h3>
          <p>${escapeHtml(goal ? goal.title : '')}</p>
        </div>
        <form class="return-form" data-form="complete-run" data-id="${escapeAttr(run.id)}">
          <label for="summary-${escapeAttr(run.id)}">${escapeHtml(t('summary'))}</label>
          <input id="summary-${escapeAttr(run.id)}" name="summary" type="text" maxlength="140" required>
          <label for="evidence-${escapeAttr(run.id)}">${escapeHtml(t('evidence'))}</label>
          <input id="evidence-${escapeAttr(run.id)}" name="evidence" type="text" maxlength="140" required>
          <button type="submit">${escapeHtml(t('completeRun'))}</button>
        </form>
      </article>
    `;
  }

  function renderHumanLane() {
    const running = state.agentRuns.filter((run) => run.status === 'running');
    const tasks = running.flatMap((run) => getHumanTasks(run));
    return `
      <section class="panel panel-human" aria-labelledby="human-title">
        <div class="section-heading">
          <h2 id="human-title">${escapeHtml(t('humanLane'))}</h2>
          <span class="count-pill">${tasks.length}</span>
        </div>
        <div class="task-list">
          ${tasks.length ? tasks.map(renderHumanTask).join('') : `<p class="empty-state">${escapeHtml(t('emptyHumanTasks'))}</p>`}
        </div>
      </section>
    `;
  }

  function renderHumanTask(task) {
    const checked = state.humanTaskDone[task.id] === true;
    return `
      <label class="task-check">
        <input type="checkbox" data-action="toggle-task" data-id="${escapeAttr(task.id)}" ${checked ? 'checked' : ''}>
        <span>
          <strong>${escapeHtml(task.title)}</strong>
          <small>${escapeHtml(task.detail || '')}</small>
        </span>
      </label>
    `;
  }

  function renderParkingLot() {
    return `
      <section class="panel panel-parking" aria-labelledby="parking-title">
        <div class="section-heading">
          <h2 id="parking-title">${escapeHtml(t('parkingLot'))}</h2>
          <span class="count-pill">${state.ideas.length}</span>
        </div>
        <form class="stacked-form" data-form="idea">
          <label for="idea-title">${escapeHtml(t('ideaTitle'))}</label>
          <input id="idea-title" name="title" type="text" maxlength="100" required>
          <label for="idea-outcome">${escapeHtml(t('linkedGoal'))}</label>
          <select id="idea-outcome" name="linkedOutcomeId">
            <option value="">${escapeHtml(t('noGoal'))}</option>
            ${state.outcomes.map((goal) => `<option value="${escapeAttr(goal.id)}">${escapeHtml(goal.title)}</option>`).join('')}
          </select>
          <label for="idea-why">${escapeHtml(t('whyToday'))}</label>
          <input id="idea-why" name="whyToday" type="text" maxlength="140">
          <label for="idea-cost">${escapeHtml(t('costOfDelay'))}</label>
          <input id="idea-cost" name="costOfDelay" type="text" maxlength="140">
          <button type="submit">${escapeHtml(t('parkIdea'))}</button>
        </form>
        <div class="item-list">
          ${state.ideas.length ? state.ideas.map(renderIdea).join('') : `<p class="empty-state">${escapeHtml(t('emptyIdeas'))}</p>`}
        </div>
      </section>
    `;
  }

  function renderIdea(idea) {
    const promotable = core.canPromoteIdea(state, idea.id);
    return `
      <article class="item idea-item">
        <div>
          <h3>${escapeHtml(idea.title)}</h3>
          <p>${escapeHtml(idea.whyToday || idea.costOfDelay || t('emptyIdeas'))}</p>
        </div>
        <button type="button" data-action="promote-idea" data-id="${escapeAttr(idea.id)}" ${promotable ? '' : 'disabled'}>
          ${escapeHtml(t('promote'))}
        </button>
      </article>
    `;
  }

  function renderReturnGate() {
    const gates = state.agentRuns.filter((run) => run.status === 'review_gate');
    return `
      <section class="panel panel-gate" aria-labelledby="gate-title">
        <div class="section-heading">
          <h2 id="gate-title">${escapeHtml(t('returnGate'))}</h2>
          <span class="count-pill">${gates.length}</span>
        </div>
        <div class="item-list">
          ${gates.length ? gates.map(renderGate).join('') : `<p class="empty-state">${escapeHtml(t('emptyGates'))}</p>`}
        </div>
      </section>
    `;
  }

  function renderGate(run) {
    return `
      <article class="item gate-item">
        <div>
          <span class="tag">${escapeHtml(t('agentReturned'))}</span>
          <h3>${escapeHtml(run.title)}</h3>
          <p>${escapeHtml(getRunResult(run, 'summary'))}</p>
          <p>${escapeHtml(getRunResult(run, 'evidence'))}</p>
        </div>
        <form class="gate-form" data-form="gate" data-id="${escapeAttr(run.id)}">
          <label for="note-${escapeAttr(run.id)}">${escapeHtml(t('decisionNote'))}</label>
          <input id="note-${escapeAttr(run.id)}" name="note" type="text" maxlength="160">
          <div class="gate-buttons" role="group" aria-label="${escapeAttr(t('returnGate'))}">
            <button type="submit" name="decision" value="accept">${escapeHtml(t('accept'))}</button>
            <button type="submit" name="decision" value="rework">${escapeHtml(t('rework'))}</button>
            <button type="submit" name="decision" value="pause">${escapeHtml(t('pause'))}</button>
            <button type="submit" name="decision" value="next">${escapeHtml(t('next'))}</button>
          </div>
        </form>
      </article>
    `;
  }

  app.addEventListener('submit', (event) => {
    const form = event.target.closest('form');
    if (!form) return;
    event.preventDefault();
    statusMessage = '';

    if (form.dataset.form === 'goal') addGoal(form);
    if (form.dataset.form === 'agent') startRun(form);
    if (form.dataset.form === 'complete-run') completeRun(form);
    if (form.dataset.form === 'idea') addIdea(form);
    if (form.dataset.form === 'gate') decideGate(form, event.submitter);

    render();
  });

  app.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (!action) return;
    statusMessage = '';

    if (action === 'toggle-locale') state.locale = state.locale === 'en' ? 'zh' : 'en';
    if (action === 'clear-state') clearLocalState();
    if (action === 'toggle-goal') toggleGoal(button.dataset.id);
    if (action === 'promote-idea') promoteIdea(button.dataset.id);

    render();
  });

  app.addEventListener('change', (event) => {
    const input = event.target;
    if (input.dataset.action !== 'toggle-task') return;
    state.humanTaskDone[input.dataset.id] = input.checked;
    render();
  });

  function addGoal(form) {
    const data = new FormData(form);
    try {
      state = core.addOutcome(state, {
        title: clean(data.get('title')),
        metric: clean(data.get('metric'))
      });
    } catch (error) {
      statusMessage = error.message || 'OUTCOME_LIMIT';
    }
  }

  function startRun(form) {
    const data = new FormData(form);
    try {
      state = core.startAgentRun(state, {
        outcomeId: clean(data.get('outcomeId')),
        title: clean(data.get('title')),
        expectedMinutes: Number(data.get('expectedMinutes')) || 25,
        humanMode: clean(data.get('humanMode')) || 'maker'
      });
    } catch (error) {
      statusMessage = error.message || 'OUTCOME_NOT_ACTIVE';
    }
  }

  function completeRun(form) {
    const data = new FormData(form);
    state = core.completeAgentRun(state, form.dataset.id, {
      summary: clean(data.get('summary')),
      evidence: clean(data.get('evidence'))
    });
  }

  function addIdea(form) {
    const data = new FormData(form);
    state = core.parkIdea(state, {
      title: clean(data.get('title')),
      linkedOutcomeId: clean(data.get('linkedOutcomeId')) || null,
      whyToday: clean(data.get('whyToday')),
      costOfDelay: clean(data.get('costOfDelay'))
    });
  }

  function decideGate(form, submitter) {
    const data = new FormData(form);
    const decision = submitter ? submitter.value : 'pause';
    state = core.recordGateDecision(state, form.dataset.id, {
      decision,
      note: clean(data.get('note'))
    });
  }

  function clearLocalState() {
    if (!window.confirm(t('resetConfirm'))) return;
    storage.clearState();
    state = normalizeState(core.createInitialState(today));
  }

  function toggleGoal(goalId) {
    state = {
      ...state,
      outcomes: state.outcomes.map((goal) => {
        if (goal.id !== goalId) return goal;
        const completed = goal.done === true || goal.status === 'completed';
        return { ...goal, done: !completed, status: completed ? 'active' : 'completed' };
      })
    };
  }

  function promoteIdea(ideaId) {
    const idea = state.ideas.find((item) => item.id === ideaId);
    if (!idea) return;
    try {
      state = core.addOutcome(state, {
        title: idea.title,
        metric: idea.costOfDelay || idea.whyToday || idea.title
      });
      state = {
        ...state,
        ideas: state.ideas.filter((item) => item.id !== ideaId)
      };
    } catch (error) {
      statusMessage = error.message || 'OUTCOME_LIMIT';
    }
  }

  function getHumanTasks(run) {
    return core.getSuggestedHumanTasks(state, run.id).map((task, index) => ({
      id: task.id || `${run.id}:${index}`,
      title: localizedTaskTitle(index, task.title || task.label || String(task)),
      detail: task.detail || findOutcome(task.outcomeId || run.outcomeId)?.title || '',
      outcomeId: task.outcomeId || run.outcomeId,
      agentIndependent: task.agentIndependent !== false
    }));
  }

  function localizedTaskTitle(index, fallback) {
    const keys = ['humanTaskAccept', 'humanTaskEvidence', 'humanTaskReview'];
    return keys[index] ? t(keys[index]) : fallback;
  }

  function getRunResult(run, key) {
    if (run.result && run.result[key]) return run.result[key];
    if (run.returnGate && run.returnGate[key]) return run.returnGate[key];
    return '';
  }

  function findOutcome(outcomeId) {
    return state.outcomes.find((goal) => goal.id === outcomeId);
  }

  function activeOutcomes() {
    return state.outcomes.filter((goal) => goal.status !== 'completed' && goal.done !== true);
  }

  function clean(value) {
    return String(value || '').trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
