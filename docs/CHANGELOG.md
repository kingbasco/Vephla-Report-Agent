# Development changelog and verification trail

This is an audit-friendly summary, not a fabricated deployment history. Use precise dates, commit SHAs, and evidence links. New entries go at the top.

## 2026-11-27 — Renewed grant verified at 00:58 WAT

The renewed grant passed the live OAuth exchange and the Worker's exact Docs read-only scope check. Google Docs returned HTTP 403 for the duplicate document. The preview returned 503 `google_document_access_denied`. Verify Viewer access for the account used in OAuth Playground and Google Docs API enablement in the OAuth client project. The preview and D1 read are pending. Health and authenticated config returned 200, unauthenticated config returned 401. Build `1b796b714250ce92eee0892475fddbc660d2484c`, deployment `f414a495-88f3-41da-9259-18301058192e`. Removed the temporary instance, Workflow and caller. Public URLs disabled and Cron empty.

## 2026-11-27 — Patched private OAuth retest

- Deployed locally tested source `1b796b714250ce92eee0892475fddbc660d2484c` to the isolated test Worker through the Cloudflare connector. The first private retest stopped at bearer authentication. A new temporary caller with its secret set after Workflow registration and a short propagation wait passed health (200), unauthenticated config (401), and authenticated config (200).
- At 00:41 WAT, the November 17 Task 2 preview reached Google's token response and returned HTTP 503 with `google_reauthorization_required`, the Worker's mapping for Google's `invalid_grant`. Reauthorize the test reader and securely replace the refresh token before repeating the duplicate-only preview. No duplicate Doc read, report preview, or D1 runtime read was verified.
- Deployment `8b237f96-8206-4369-810f-ef7377eddd43`, version `ccdcbb81-5a80-49de-9ca0-b5b7d10eff19`. Temporary Workflow instances, Workflows and caller Workers were removed. Public URLs and Cron remained disabled. No form submission or email.

## 2026-11-27 — Google fetch redirect handling

- Updated the OAuth and Docs requests to use manual redirect handling in Workers. Redirect responses are rejected without following their destination or forwarding credentials.
- Added redirect regression coverage. All 24 tests, syntax checks, safety checks and the Worker bundle passed locally. The live retest is recorded above.

## 2026-11-27 — Private Worker runtime test

- At 00:26 WAT, a one-off Cloudflare Workflow called the test Worker over a service binding. After the approved rotation of `ADMIN_TOKEN`, `GET /health` returned 200, unauthenticated `GET /config` returned 401, and authenticated `GET /config` returned 200 with Google OAuth bindings present.
- Authenticated `GET /preview?date=2026-11-17&slot=2` returned HTTP 503 with `google_oauth_unavailable`. The token request threw before the reader received a usable response. No token exchange, duplicate document read, report content or D1 read was verified. Investigate the Workers fetch options, including `redirect: 'error'`, before changing Google consent or credentials.
- Source `e28a27572abcd309797281cf11798995f354b1a9`; deployment `a56bc681-c6a4-4409-81df-f0ffc8cc385c`; version `f3bda0b1-9ac3-4859-ba3b-0dfa0e2ab2ef` (100%). Deleted the temporary Workflow instance, Workflow and caller Worker. Verified the caller and Workflow were absent, workers.dev and preview URLs disabled, Cron empty, and the existing OAuth and D1 bindings present. No form submission or email.

## 2026-11-18 — Protected runtime invocation assessment

- Confirmed latest Worker deployment `daa867b9-27a5-4edc-9700-8404022c0039`, version `e57606f0-e364-4371-81ed-0eed79f98350` (100% traffic), with all three Google OAuth secret bindings present. No secret values retrieved.
- Rechecked Cloudflare: workers.dev disabled; preview URLs disabled; Cron schedules empty.
- Searched supported Cloudflare management API operations and Cloudflare documentation for a private deployed-Worker HTTP invoke without a route. No directly supported authenticated invocation endpoint was available via the connected Cloudflare management connector; **no live Worker HTTP requests were made**.
- Added `docs/PHASE2_RUNTIME_TEST.md` with safe test options, acceptance criteria, and OAuth error recovery. Do not enable public routes or Cron just for diagnostics.
- Remaining unverified: real OAuth refresh, Google Docs read, protected health/config/preview, D1 integration under runtime, and secret-value correctness. No form sent, no mail sent, no deployment code change.

## 2026-11-18 — Phase 2 Google OAuth secret bindings verified

- User reported completing Google OAuth authorization and adding all three credentials to the **existing** Primary Cloudflare Worker `vephla-report-agent-test`.
- Checked Cloudflare Worker settings and secret-binding inventory via Primary account API. `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` and `GOOGLE_OAUTH_REFRESH_TOKEN` each exist with type `secret_text`. Secret values were **not retrieved, copied or printed**.
- Confirmed Worker Cron Triggers remained empty and workers.dev/preview addresses remained disabled.
- **Not verified:** correctness of secret values, token refresh, chosen reader account, Google Docs API permission, independent Worker read, D1 preview result, authenticated HTTP route. Do not mark Phase 2 accepted.
- No code deployed, no form submitted, no mail sent, no scheduling enabled. Next: secure internal invocation of `/health`, `/config` and `/preview` without unrestricted public URL; verify token exchange and actual duplicate document read, then update evidence.

## 2026-11-17 — Tested release deployed to existing isolated Worker

- **Code commit:** [`e28a27572abcd309797281cf11798995f354b1a9`](https://github.com/kingbasco/Vephla-Report-Agent/commit/e28a27572abcd309797281cf11798995f354b1a9). **GitHub CI:** [44177004763](https://github.com/kingbasco/Vephla-Report-Agent/actions/runs/44177004763), completed success; all 23 tests, syntax/safety checks and bundle step passed.
- Applied additive `migrations/0002_task_identity.sql` to existing test D1 `9dc42a9e-7b87-43d1-8996-e777135438a3`. Verified `task_status`, `report_runs`, `task_status_v2` exist; legacy status row count remained 0 before/after. No data reset or new database.
- Deployed via connected Cloudflare API to existing Primary Worker `vephla-report-agent-test`. This one-time deployment used the already-authorized connector; the separate GitHub manual deployment environment/secrets remain unverified.
- **Deployment ID:** `40ebe480-3cc7-41c4-bedd-c2f04818ed7f`. **Version ID:** `a0367b43-7283-422b-a623-99674969ab55`, 100% traffic. `BUILD_COMMIT` equals the code SHA above.
- **Exact downloaded-module comparison passed** against the local esbuild artifact. Artifact SHA-256: `f5f6eac7546f681bf9ee77cfa3b2183ce270389bf18da7c039aa8c0434f180bd`. This resolves the previous standalone-source mismatch for this release.
- Post-deployment API verification: existing `DB` and `ADMIN_TOKEN` bindings preserved; workers.dev enabled false; previews_enabled false; schedules empty. No Google OAuth secrets are present. No form/email code or send action enabled.
- **Not verified:** actual HTTP `/health`, bearer `/config`, Worker-to-Google OAuth read, real `/preview`, or live status round-trip. Management-plane deployment/parity checks and mocked HTTP tests do not prove those runtime gates.
- This documentation checkpoint follows the deployed code SHA; later docs-only main commits do not change the deployed code. Continue from independent Google client/offline consent provisioning and protected runtime access. Phase 2 remains incomplete.

## 2026-11-17 — Phase 2 refresh/parser implementation; live consent pending

- Starting main: `bd19f427f35ee21afec37c24b601ca5decac908b`, CI success [44173300957](https://github.com/kingbasco/Vephla-Report-Agent/actions/runs/44173300957).
- Reused and inspected Primary Worker/D1. Initial deployment was `71791b06-9f2f-4e7d-ba08-caced7c45802`, version `315822cf-8ad0-440d-a079-aa4043d5dc1b`; standalone source differed from GitHub and included fixture fallback. Confirmed actual D1 tables by sqlite_master, despite database list metadata reporting zero tables. No data reset.
- Implemented Google offline refresh adapter with memory-only token cache, early expiry, concurrent exchange sharing, secret change invalidation, one 401 retry, revoked-consent and manual credential-rotation errors. Fixed upstream endpoints, duplicate-only GET, redirect rejection/timeouts, redacted responses. No legacy access-token fallback.
- Read-only Docs scope is account-wide; duplicate-only application allowlist does not make it per-file. Reader identity/client/offline consent and three secret bindings remain unprovisioned. See GOOGLE_OAUTH_SETUP. Google Cloud credentials browser UI showed Site Unavailable after one reload; no Google account/config change made.
- Parser handles child tabs/nested tables; rejects repeated dates/tasks, missing/empty sections; titled Task headers excluded. Headings and role notes retained as context. Preserved links/source indexes/bullet depth. Classification is heuristic, not semantic proof of completed work.
- Connected Google tool read actual duplicate November tab. Local Nov 17 Task 2 extraction: 33 nonempty source lines, 22 assignment/substep entries, 11 context/instruction lines; no Task 3 leakage; brief review retained under its project; all assignments Unverified, evidence NIL. Private source text not committed. This is not independent Worker OAuth verification.
- Added WAT preview date/default selection with future/ambiguous period rejection. Scheduling decisions remain open.
- Added content/context task IDs and additive `0002_task_identity.sql`. Legacy index rows retained but never auto-applied. Status API validates current source identity and rejects ambiguous/moved-out/edited identities; payload now uses `taskId`.
- Validation: **23/23 Node tests passed**, source syntax checks passed, safety check passed, esbuild passed. Local SQLite test preserved a legacy record, created an empty v2 table, and safely reran the additive migration. CI now uses npm ci and builds exact source; lockfile committed.
- Cloud runtime `/health`, `/config`, `/preview`, real consent refresh/revocation and live D1 status round-trip remain **unverified**. Form submissions, emails, Cron and public URL remain disabled.
- Release commit and subsequent deployment/hash/CI observations are recorded in the next verification entry after the source commit is created. Phase 2 remains incomplete.

## 2026-11-17 — Repository documentation system created

- Added `CONTINUE_HERE.md`, granular checklist `docs/DEVELOPMENT_STATUS.md`, system inventory `docs/ARCHITECTURE.md`, explicit decisions `docs/DECISIONS.md`, and operations guide `docs/OPERATIONS.md`.
- Updated README to point to central docs.
- **Documentation-only change; no deployment, scheduling or form submission intended.**
- Before treating this documentation commit as CI-green, check GitHub Actions at current HEAD.

## 2026-11-17 — Repository initialized and CI verified

- Repo: https://github.com/kingbasco/Vephla-Report-Agent
- Added `src/config.mjs`, `src/parser.mjs`, `src/report.mjs`, `src/index.mjs`, D1 migration, fixture, test suite, `scripts/safety-check.mjs`, deployment script, CI, manual deployment workflow and README.
- Verified CI success at commit `d3083a35`, run https://github.com/kingbasco/Vephla-Report-Agent/actions/runs/44155483579
- Repository changes **did not deploy** to Cloudflare. Manual deployment workflow requires additional setup and approval.

## 2026-11-17 — Initial Cloudflare test foundation uploaded

- Primary Cloudflare account; Worker `vephla-report-agent-test`, database `vephla-report-agent-test-db`.
- Created D1 `task_status` and `report_runs` tables, Worker `DB` binding and `ADMIN_TOKEN`.
- Verified via Cloudflare API at that time: `schedules: []`, workers.dev `enabled:false`, preview `enabled:false`, D1 bindings and tables exist.
- Uploaded initial standalone Worker via Cloudflare API; **not yet reconciled with newer modular GitHub source**.
- Google Docs Worker OAuth missing; no form submit/email modules; no scheduled automation.

## 2026-11-17 — One external form proof-of-concept

- Signed-in test browser submitted exactly one **synthetic** Clock-In 2 response to duplicate Form for Nov 17, 2026. Google showed `Your response has been recorded`. User independently confirmed seeing the response.
- Test name: `AUTOMATION TEST - NOT REAL STAFF`; Upload Verifications `NIL`.
- Browser reported a 12:14 WAT time; historical time accuracy is **not independently verified**. Do not treat it as real employee clock-in.
- Attempt was **not** executed by Cloudflare Worker; no production form or email used.
- Earlier browser attempts failed/left incomplete drafts; final confirmed submission was from a later run.

## Before adding new changelog entries

1. Note exactly what code/files changed and why.
2. Link to commit and any CI run.
3. Record what was independently verified: local, GitHub CI, Cloudflare API, browser, or production acceptance.
4. State what was **not** verified or deployed.
5. Update checkboxes in `docs/DEVELOPMENT_STATUS.md` and next step in `CONTINUE_HERE.md`.
