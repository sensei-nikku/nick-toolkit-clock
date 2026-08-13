# Clock + Stopwatch

A dependency-free, client-side clock and stopwatch intended for static hosting, including GitHub Pages.

## Features

- Live local clock and date
- 12-hour and 24-hour display
- Optional seconds
- Stopwatch with start, pause, resume, reset, and laps
- Keyboard shortcuts: `Space`, `L`, and `R`
- Responsive layout
- Browser-local display preferences
- No cookies, analytics, accounts, API calls, external fonts, CDNs, or third-party runtime JavaScript

## Security model

This is deliberately a small static application.

The browser-facing code:

- makes no network requests;
- contains no secrets or credentials;
- accepts no arbitrary text input;
- uses no `innerHTML`, `eval`, `Function`, `document.write`, or dynamic script creation;
- creates dynamic UI through `textContent` and DOM nodes;
- allow-lists values loaded from `localStorage`;
- uses a restrictive Content Security Policy;
- blocks outbound connections with `connect-src 'none'`;
- has no forms, object embeds, frames, workers, remote fonts, or media.

The repository includes automated tests that reject several common DOM-XSS/code-injection sinks and unsafe CSP relaxations.

## Repository layout

```text
site/                   Files actually published to GitHub Pages
tests/                  Dependency-free unit and security checks
.github/workflows/      CI and Pages deployment
.github/dependabot.yml  GitHub Actions update checks
hosting/                Stronger header examples for later self-hosting
SECURITY.md             Vulnerability reporting policy
```

## Publish with GitHub Pages

1. Create a repository and copy these files into it.
2. Push to the `main` branch.
3. In **Settings → Pages**, set the publishing source to **GitHub Actions**.
4. The included `Deploy GitHub Pages` workflow validates, tests, and publishes only the `site/` directory.
5. In **Settings → Pages**, enable **Enforce HTTPS** when the option is available.
6. Protect `main` with a ruleset/branch protection rule and require the `CI / validate` check before merge.

The deployment workflow grants read-only repository access to the build job. Only the final deployment job receives the `pages: write` and `id-token: write` permissions required for GitHub Pages.

## Local use

A module script is used, so serve `site/` through a local HTTP server rather than opening `index.html` with a `file://` URL.

For example:

```bash
cd site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tests

No package installation is required.

```bash
python3 tests/validate.py
node --test tests/*.test.mjs
node --check site/app.js
node --check site/time.js
```

## GitHub repository hardening

Recommended repository settings:

- protect the default branch;
- require pull requests for changes to protected branches if multiple people have write access;
- require the CI check before merge;
- keep default `GITHUB_TOKEN` permissions read-only;
- allow only the GitHub-authored Actions used by this repository, if practical;
- enable private vulnerability reporting for a public repository;
- enable Dependabot for GitHub Actions updates.

For stronger GitHub Actions supply-chain hardening, GitHub recommends pinning Actions to full-length commit SHAs. The workflow currently uses current major-version tags for GitHub-authored Pages Actions so the repository remains easy to update; a security-sensitive deployment can replace those tags with verified full commit SHAs.

## Moving to a personal server later

GitHub Pages is appropriate for this app because it contains no sensitive transactions or private data. When moving the app to a server you control, use the examples in `hosting/` to send CSP and related controls as HTTP response headers. Response headers provide protections that a meta CSP cannot provide, including `frame-ancestors`.

## License

No license is included. Add the license you want before granting reuse or contribution rights.
