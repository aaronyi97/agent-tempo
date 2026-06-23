# Contributing

Thanks for helping improve Agent Tempo.

The project is intentionally small: a local-first bilingual web app for human-agent collaboration rhythm. Please keep changes inside that boundary.

## Ground Rules

- Keep the default app local-first.
- Do not add telemetry, hosted auth, cloud sync, or model-provider calls without an explicit product-boundary discussion.
- Keep user-facing copy bilingual when practical.
- Use synthetic examples only.
- Do not include real local paths, private workspace names, customer data, private prompts, or secrets.
- Run the privacy scanner before submitting changes.

## Development Checks

Run:

```bash
npm test
node scripts/privacy-scan.js
```

If a change affects the product boundary, update both English and Chinese docs where relevant.

## Pull Request Checklist

- The change serves the local-first rhythm tool.
- Docs are updated if behavior or boundary changed.
- Examples and fixtures are synthetic.
- No sensitive data appears in code, docs, screenshots, or issue text.
- `node scripts/privacy-scan.js` passes.

## Issue Guidelines

When filing issues:

- Describe the behavior with synthetic examples.
- Do not paste private conversations or customer data.
- Do not include secrets.
- Avoid screenshots unless they contain only safe demo content.

## Scope Discipline

Good contributions make the daily rhythm loop clearer. Large additions such as cloud accounts, team administration, agent execution, or CRM features should start as a product-boundary proposal before code.
