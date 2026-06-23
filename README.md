# Agent Tempo

Agent Tempo is a local-first bilingual web app for keeping human-agent collaboration in rhythm.

It helps one person plan one to three outcomes for the day, start an agent work lane, keep a separate human-only lane active while the agent runs, and decide what to do when the agent returns with work.

Agent Tempo is not a cloud service, not an agent execution platform, and not an automation layer for Claude, Codex, or any other model. It does not call agents for you. It gives the human operator a small operating surface for pacing, review, and focus.

## Status

This repository is an open-source candidate for the public Agent Tempo package. The intended product surface is a static local web app plus plain JavaScript state logic, bilingual docs, and a privacy gate.

Use the current package as a candidate, not as a hosted product promise.

## What It Does

- Keeps the day constrained to one to three concrete outcomes.
- Separates agent-running time from human-only work.
- Parks new ideas until they serve an active outcome and matter today.
- Sends completed agent work into a return gate: accept, rework, pause, or next.
- Stores app state locally in the browser under `localStorage` key `agent-tempo:v1`.
- Provides English and Simplified Chinese project docs.

## What It Does Not Do

- It does not create, control, or supervise agents.
- It does not automatically call Claude, Codex, OpenAI, Anthropic, GitHub, or any remote API.
- It does not sync data across devices.
- It does not provide accounts, teams, billing, telemetry, or server storage.
- It is not suitable for secrets, customer data, private strategy, production incident notes, or real conversation archives.

## Privacy Boundary

Default behavior is local-only:

- No network calls by default.
- No account system.
- No telemetry.
- No server database.
- Browser data is stored in `localStorage` under `agent-tempo:v1`.

Treat the app as a lightweight local planning board. Do not paste API keys, passwords, customer records, confidential prompts, or full private chat logs into it.

Before publishing or packaging, run:

```bash
node scripts/privacy-scan.js
```

The scanner blocks common private-path markers, governance-source markers, and secret-like token patterns. It intentionally allows normal public product terms such as `localStorage` and `agent-tempo:v1`.

Maintainers can copy `privacy-blocklist.example.json` to `privacy-blocklist.local.json` and add private codenames or workspace terms that must never ship. The local blocklist is ignored by git but is loaded by the scanner.

## Quick Start

Requirements:

- Node.js 18 or newer.
- A modern browser for the static app surface.

Run checks:

```bash
npm test
node scripts/privacy-scan.js
```

Run the app from the checkout:

```bash
npm run serve
```

Then open [http://localhost:4173](http://localhost:4173). Serving the files locally is the supported path because the app imports local JavaScript modules; direct `file://` opening can be blocked by browser security rules.

## Suggested Daily Workflow

1. Choose one to three outcomes for today.
2. Start one agent run tied to a current outcome.
3. While the agent works, stay in the human lane: user calls, writing, review, sales, or decisions the agent cannot make.
4. When the agent returns, use the return gate instead of treating generated output as done.
5. Park unrelated ideas unless they serve today's outcome and have real cost of delay.

## Product Boundary

Agent Tempo is a rhythm tool for one human coordinating with one or more agent sessions. It is deliberately small:

- The human stays responsible for judgment and final decisions.
- The app helps with pacing and review discipline.
- Agent execution stays outside the app.
- Private work should stay out of public issues, examples, and screenshots.

See [docs/PRODUCT.md](docs/PRODUCT.md) and [docs/PRIVACY.md](docs/PRIVACY.md) for the full boundary.

## Contributing

Contributions should keep the product local-first, bilingual where user-facing, and privacy-safe by default.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Security

Do not file public issues containing private prompts, secrets, customer data, or local machine paths. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
