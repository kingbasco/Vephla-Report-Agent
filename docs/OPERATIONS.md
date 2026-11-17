# Operations, testing and safety runbook

**Current environment:** isolated test-only Worker. There is intentionally **no public demo URL** and **no scheduled form submission**.

## Everyday developer workflow

1. Read `CONTINUE_HERE.md` and `docs/DEVELOPMENT_STATUS.md`.
2. Fetch latest `main`, inspect latest commit and Actions.
3. Make one small scoped change; do not change permitted Doc/Form IDs.
4. Execute:
   ```sh
   npm install
   npm test
   npm run check
   npm run safety
   npm run build
   ```
5. CI `Verify test-only reporting agent` should pass. Check for false-positive green runs when a workflow was skipped.
6. Manually verify runtime only when authorized, and compare to source. Do not assume push deployed.
7. Update checkbox, changelog, handoff and release evidence; link relevant commit/CI.

## API reference (protected Worker)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Non-sensitive test-mode health payload |
| GET | `/config` | Read test IDs and disabled send flags |
| GET | `/preview?date=2026-11-17&slot=2` | Parse test doc and assemble preview; currently blocked until Google OAuth |
| POST | `/status` | Body: `{"date":"2026-11-17","slot":2,"taskIndex":0,"status":"unverified"}` |
| GET | `/runs` | Query recorded run history |

Except `/health`, endpoints need `Authorization: Bearer <ADMIN_TOKEN>`. The Worker has no public URL, so these routes cannot currently be reached through workers.dev. **Never paste the token into chat/GitHub or URLs.**

## Database

- D1 name: `vephla-report-agent-test-db`.
- Migration: `migrations/0001_initial.sql`.
- Schema: `task_status` for explicit user-confirmed status; `report_runs` for basic reporting history.
- The existing schema is **not** a durable form-submission ledger; add idempotency tables before enabling any sending.
- Do not erase/reset even a test database without confirming the impact on existing draft status.

## Cloudflare deployment

- Source pushes do not deploy.
- Workflow `.github/workflows/deploy-test.yml` is **manual** and requires the GitHub Environment `vephla-test` plus restricted `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` secrets, which have **not** been verified as set.
- `scripts/deploy-test.mjs` refuses a different Cloudflare account, unexpected public Worker exposure, Cron Triggers, missing D1 or missing admin secret.
- A deployment should preserve the existing D1 and auth bindings, then recheck both. Review code and workflow before using them.
- Do not add Cron Triggers, public URL, routes, send capabilities or production Doc/Form IDs during Phase 2 unless separately authorized.

## Google authentication

- **Google Drive connector:** reads the duplicate Doc from ChatGPT, not the Worker.
- **Browser profile:** previously submitted a duplicate Google Form; session may expire and is not guaranteed available to Cloudflare.
- **Worker:** needs own Google OAuth; prefer refreshable least-privilege read-only Docs scope and restrict which document ID the code requests. Google auth grants do not imply respondent Form submission capability.
- Never store secrets, refresh tokens or email passwords in GitHub or plaintext logs.

## Testing strategy

1. Unit tests: parser, date/tab matching, unknown-status preservation, form schema validation, invalid source inputs.
2. Worker integration: dedicated authenticated test route, independent Google OAuth and duplicate charter read.
3. Form test: synthetic **duplicate** Form only, explicit approval, one submission per date/slot idempotency, watch response confirmation.
4. Time tests: Africa/Lagos WAT; actual clock-in time; no backdating; weekend and leave policies.
5. Reliability: expired OAuth, stale UI, ambiguous submit responses, network timeouts, attempts to submit twice.
6. Privacy: verify no personal staff data in public repo, logs, traces or analytics.
7. Release: production consent and explicit manual switch remain out of scope until Phase 7.

## Troubleshooting

- **403 on Docs API:** validate account permission, Google OAuth scopes, token freshness, and correct duplicate ID.
- **Charter day not found:** check `NOVEMBER CHARTERS` tab ID, text normalization and date-heading parsing; avoid inventing tasks.
- **Preview unreachable:** expected when workers.dev and public routes are disabled; don't blindly enable public access.
- **CI green but Worker unchanged:** expected — no push-to-deploy configured.
- **Form double-submission risk:** stop, inspect submission history; never retry an ambiguous result automatically.
- **Email fails:** email is not implemented yet; don't configure production recipients in tests.

## Continuity / maintenance checklist

- [ ] At each implementation checkpoint, synchronize `docs/DEVELOPMENT_STATUS.md`, `docs/CHANGELOG.md` and `CONTINUE_HERE.md`.
- [ ] On every deploy, record exact GitHub SHA and Cloudflare verification status.
- [ ] Review access tokens and least privilege before implementing the next phase.
- [ ] Stop any live write until explicit approval and confirmation that the target is a duplicate test asset.
