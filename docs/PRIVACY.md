# Privacy

Agent Tempo is designed as a local-first planning surface for one human coordinating work with agent sessions outside the app.

## Default Data Flow

By default:

- The app does not require an account.
- The app does not send telemetry.
- The app does not use a hosted database.
- The app does not call model providers.
- App state is stored in the browser using `localStorage`.
- The storage key is `agent-tempo:v1`.

If a future contribution adds any network behavior, it must be opt-in, documented, and reviewed as a product-boundary change.

## What Not To Store

Do not store sensitive material in Agent Tempo, including:

- API keys, passwords, tokens, or private certificates.
- Customer records or regulated data.
- Full private conversation archives.
- Production incident details.
- Private strategy, unpublished financial information, or personal identity records.

The app is for collaboration rhythm, not secure records management.

## Public Contribution Rule

Public issues, pull requests, screenshots, docs, and test fixtures must use synthetic examples. Do not include:

- Real local machine paths.
- Private project names.
- Raw personal workspace notes.
- Secret-like strings.
- Internal governance or operating-system material.

Run the privacy scanner before publishing:

```bash
node scripts/privacy-scan.js
```

The scanner is a guardrail, not a guarantee. Human review is still required before release.

Maintainers may create `privacy-blocklist.local.json` from `privacy-blocklist.example.json` to add private local terms. The local blocklist is ignored by git and loaded at scan time.

## Browser Storage

Browser `localStorage` is convenient but not encrypted. Anyone with access to the browser profile may be able to read it.

Clearing site data for the app origin removes the saved Agent Tempo board.

## Network Boundary

The open-source candidate is scoped to local use. It should not add background sync, analytics, hosted auth, or model-provider calls without a clear product decision and matching privacy update.

## Maintainer Checklist

Before a public release:

- Run `node scripts/privacy-scan.js`.
- Read changed docs and examples manually.
- Confirm all examples are synthetic.
- Confirm no screenshots include private content.
- Confirm no new feature changes the default local-first data flow.
