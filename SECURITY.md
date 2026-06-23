# Security Policy

Agent Tempo is a local-first candidate project. It is not designed to store sensitive data.

## Supported Scope

Security reports should focus on the public repository, local app behavior, privacy leakage in examples, and accidental secret exposure.

## Reporting

Please do not open a public issue with secrets, customer data, private prompts, screenshots containing sensitive content, or local machine paths.

If no private reporting channel is listed for this candidate repository, open a minimal public issue that says a security concern exists and ask the maintainer for a private contact path. Keep the public issue free of sensitive details.

## Sensitive Data

Do not put the following into Agent Tempo or its issue tracker:

- API keys, passwords, tokens, or private certificates.
- Customer records.
- Full private conversations.
- Private local paths or workspace names.
- Internal operating instructions.

## Maintainer Response

For a credible report, maintainers should:

1. Confirm receipt.
2. Reproduce the issue with synthetic data.
3. Patch the issue without adding unrelated features.
4. Run `node scripts/privacy-scan.js`.
5. Document any privacy-boundary change.

## Non-Scope

Agent Tempo does not claim to be a secure vault, enterprise collaboration suite, or compliance system. Browser storage is not encrypted by this app.
