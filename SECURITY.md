# Security Policy

## Supported version

Security fixes are applied to the current `main` branch.

## Reporting a vulnerability

Do not publish exploit details in a public issue.

If GitHub private vulnerability reporting is enabled for this repository, use the repository's **Report a vulnerability** option.

If private vulnerability reporting is not enabled, open a public issue containing only a request for a private security contact. Do not include exploit steps, payloads, sensitive logs, or other vulnerability details in that issue.

## Scope

Relevant reports include:

- a way to execute attacker-controlled JavaScript in the page;
- a CSP bypass caused by this repository's code;
- an unexpected outbound network request;
- unsafe handling of browser storage;
- a deployment workflow that grants materially unnecessary privileges;
- a supply-chain issue in the GitHub Actions configuration.

The application intentionally has no authentication, backend, database, account system, payments, or server-side API.
