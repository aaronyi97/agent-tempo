# Product Boundary

Agent Tempo is a local-first bilingual web app for human-agent collaboration rhythm.

It exists to keep a human operator focused while agent sessions run outside the app.

## Core Promise

Agent Tempo helps the user answer five questions:

1. What are the one to three outcomes that matter today?
2. Which agent run is serving one of those outcomes?
3. What can the human do while the agent runs?
4. What decision is required when the agent returns?
5. Which ideas should stay parked because they do not serve today?

## Intended User

The first user is an independent builder, founder, researcher, or operator who already uses coding or writing agents and needs a small control surface to avoid drift.

## Product Principles

- Local-first by default.
- Human judgment stays primary.
- Small daily surface instead of project-management sprawl.
- Bilingual public docs.
- No private data in examples, tests, or issues.
- No hidden automation.

## In Scope

- Daily outcome limit.
- Agent run cards.
- Human-only task suggestions.
- Idea parking.
- Return gate decisions.
- Local browser persistence with `localStorage` key `agent-tempo:v1`.
- English and Simplified Chinese docs.
- Privacy scanning before publication.

## Out Of Scope

- Agent execution.
- Prompt routing.
- Cloud sync.
- User accounts.
- Team workspaces.
- Billing.
- Telemetry.
- Customer-data storage.
- Automatic Claude, Codex, or model-provider calls.

## Non-Goals

Agent Tempo should not become a full project manager, agent marketplace, prompt vault, CRM, or governance system. Those would pull it away from the narrow job of keeping one human and their agent work in a usable daily rhythm.

## Release Readiness

A candidate release should be judged by:

- Can a new user understand the local-first boundary in under five minutes?
- Can the app support a real one-day dogfood session?
- Does the return gate prevent generated work from being treated as automatically done?
- Do the docs explain what the product does not do?
- Does the privacy scanner pass?

Passing those checks means the candidate is easier to try. It does not prove market demand, security completeness, or production readiness.
