# GitHub Publication

Initial repository target: `https://github.com/symmetrysolutions1/Symmetry.git`.

## Visibility

Keep the repository private during pre-audit hardening. Contract source deployed to a public chain will still be published through the explorer. Consider making the full monorepo public only after the security model, license, contribution policy, and customer-data boundaries are approved.

## Authentication

Preferred method: authenticate GitHub CLI or Git Credential Manager through the browser while signed in as `symmetrysolutions1`. Never paste a GitHub token into chat, source files, `.env.example`, terminal history, or documentation.

If a token is unavoidable, use a fine-grained token restricted to the single `Symmetry` repository, with the shortest practical expiration and only the permissions needed to push repository contents and workflows.

## Before first push

- rotate every private key or API key previously shared in chat
- verify `.env` is ignored
- confirm generated artifacts, broadcasts, caches, runtime event logs, and provider receipts are ignored
- run the full Stage 4 validation
- configure commit identity for the project account
- initialize Git locally only after reviewing the complete file inventory
- commit to `main`, add `origin`, and push
- enable branch protection, required CI checks, secret scanning, and Dependabot
