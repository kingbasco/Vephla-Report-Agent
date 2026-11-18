# START HERE — Vephla Reporting Agent

> **Purpose:** Single-entry handoff for a new ChatGPT conversation or developer. **Last reviewed:** 2026-11-18 (WAT). Read this first, then `docs/DEVELOPMENT_STATUS.md`, `docs/ARCHITECTURE.md`, and the latest commit/CI before changing anything.

## One-minute context

This is a proposed fully automated workday reporting agent for Vephla Group. Each workday, it should read the daily charter from a Google Doc, identify Tasks 1–4, write honest progress reports, and eventually submit four Google Form clock-ins. A more detailed end-of-day email may follow. **User's final policy:** fully automatic submissions, **unverified statuses explicitly labelled**, evidence field always **`NIL`**, Africa/Lagos (WAT). Automation must not fabricate completion, proof links, time worked, or past clock-in times.

**Current state:** Phase 2 refresh/parser implementation and initial Phase 3 identity protections are coded and tested (23 automated tests). User reports completed OAuth consent; **all three Worker secret bindings were confirmed present on 2026-11-18**, but credential validity and live token exchange are unverified. Protected Worker invocation and live Google Docs read remain blocked. A protected test plan is available in `docs/PHASE2_RUNTIME_TEST.md`; the connected Cloudflare management API cannot invoke a disabled-route Worker directly. Phase 2 is not complete. Existing infrastructure is reused. Tested code `e28a27572abcd309797281cf11798995f354b1a9` is deployed; downloaded module matched the built artifact. Deployment `40ebe480-3cc7-41c4-bedd-c2f04818ed7f`, version `a0367b43-7283-422b-a623-99674969ab55`; CI [passed](https://github.com/kingbasco/Vephla-Report-Agent/actions/runs/44177004763). Later docs-only commits are not deployment changes. Main pushes run CI, not deployments. No form sender, email delivery, Cron or public URL has been enabled.

## Project pointers

- Source: https://github.com/kingbasco/Vephla-Report-Agent (branch: `main`)
- Primary Cloudflare account: account labelled **Primary** in connected Cloudflare app
- Worker: `vephla-report-agent-test` — workers.dev access OFF; preview URLs OFF; no custom route configured
- Database: `vephla-report-agent-test-db`; D1 binding `DB`
- Duplicate Google Doc: https://docs.google.com/document/d/14lqjOS0Q1_luNPUID2tlhgb0FJS0DfZGxtb6xmb0vPU/edit
- Duplicate Doc tab: `NOVEMBER CHARTERS` / `t.henz7cnke67i`
- Duplicate Google Form: https://docs.google.com/forms/d/e/1FAIpQLSf_9sFMCHhyT5JfxQv0UGRH6jPwOWeJ4nKqoPxDCdsuCVfQDw/viewform
- **Do not copy these IDs into production configuration** without explicit authorization and testing.
- `src/config.mjs` contains allowed **test** Doc/Form IDs, `MODE=test-preview-only`, `EVIDENCE=NIL`.

## Evidence from earlier testing

- On 2026-11-17, **one** synthetic test submission to the **duplicate** Form produced Google's visible `Your response has been recorded.` confirmation; user separately confirmed seeing the response. That test used external authenticated browser automation, **not** the Cloudflare Worker. It was labelled `AUTOMATION TEST - NOT REAL STAFF`, Clock-In 2 / Nov 17. Time-of-clock-in field was reported as 12:14 but was **not independently verified as the real submission time**, so future implementations must use a trusted WAT timestamp.
- Read-only browser inspection showed a Google account session, but **browser sign-in does not grant the Worker an OAuth token**.
- Nov 17 Task 2 (8 AM–noon) five **user-confirmed activity groups**: COO/HR remarks review; interns' and executives' charters; Vephla University activity check; Project Uni Flex brief review (not UI/prototype completion); Design Directorate II update. Individual deliverables and evidence unverified. Form evidence remains `NIL`.
- GitHub CI passed on 2026-11-17 for commit `d3083a35` and earlier commits; rerun/recheck it at the current HEAD before assuming today's docs-only commits passed.
- The Worker and D1 were created via Cloudflare; database tables: `task_status`, `report_runs`. At verification there were **zero Cron Triggers**, workers.dev **disabled**, no Google Docs access token, and no email/form-sending code.

## Current deliverable vs desired system

**Exists:** refresh-token Docs reader adapter; recursive tab/table parser with context and fail-closed ambiguity checks; WAT preview selection; SHA-256 assignment identities and additive status schema; report/status API; 23 automated tests; locked CI build and manual gated deploy; previous duplicate-only browser form proof-of-concept.

**Not delivered:** live authenticated Google Docs reading inside Worker; validated real Worker `/preview`; reliable Google Form submission from Worker; daily scheduler; persisted send deduplication; cPanel SMTP; UI dashboard; production credentials; end-to-end launch.

## Next exact task — finish Phase 2 external acceptance

First read `docs/PHASE2_RUNTIME_TEST.md`. Confirm Google OAuth consent scope/account, then establish a **protected** Worker invocation (no public workers.dev, previews or Cron) to test `/health`, `/config`, and `/preview`. The three secret bindings already exist; do not request token values in chat. Current latest observed Worker deployment `daa867b9-27a5-4edc-9700-8404022c0039` / version `e57606f0-e364-4371-81ed-0eed79f98350` follows secrets configuration; this does not prove OAuth success.

1. Confirm the consented Google reader identity and least-privilege scope are appropriate. User reports OAuth token generated; binding presence does not prove a working grant. The implemented read-only Docs scope is account-wide; prefer a dedicated identity with duplicate-only Viewer access.
2. Three Worker secret **names/types are already configured and confirmed**: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`. Do **not** request them in chat. Verify the real refresh request through secure Worker execution, rather than inspecting credential values.
3. Establish an authorized internal/protected invocation path without public workers.dev. Test `/health`, bearer-protected `/config`, and `/preview?date=2026-11-17&slot=2` independently from the Worker. Confirm real Google API read and D1, redacted failures, source links and Unverified/NIL output.
4. `0002_task_identity.sql` is already applied and verified on the existing D1: old `task_status` preserved, new statuses use `task_status_v2`. Status API now takes `taskId`, not index. Confirm exact identity and changed-source behaviour live.
5. Connector read plus local actual-source validation passed for Nov 17 Task 2 (33 source lines; 22 assignment/substep entries, 11 context/instruction lines). It is not proof of Worker OAuth. Test other source dates/layouts and revoked consent before checking cloud acceptance.
6. Then proceed with remaining Phase 3 acceptance. Task 1 previous-day semantics, first clock-in 8 vs 9 and final-clock/holiday decisions must precede scheduling. Sending and Cron remain disabled until explicitly authorized.

## How to work in future chats

1. Open this file and `docs/DEVELOPMENT_STATUS.md` from **GitHub** (not memory alone).
2. Inspect code for features labelled `implemented`; verify Cloudflare actual deployment separately.
3. Proceed with **the first unchecked and unblocked task**, in order; respect the safety contract.
4. After each meaningful change: update checklist(s), `docs/CHANGELOG.md`, `docs/DECISIONS.md` if a decision changes, and this handoff's **Current state** / **Next exact task**.
5. Check tests and CI; record exact commit SHA and deploy ID/verification if relevant. Never infer that a green GitHub CI means Cloudflare code was deployed.
6. No GitHub repo recreation, no new accounts and no switching the Cloudflare account.

## Copy/paste prompt to resume from a new chat

> Continue building **kingbasco/Vephla-Report-Agent**. Start by reading `CONTINUE_HERE.md`, `docs/DEVELOPMENT_STATUS.md`, `docs/ARCHITECTURE.md`, and `docs/DECISIONS.md` from the `main` branch; inspect the latest commit and GitHub Actions. Continue from the first unchecked Phase 2 task, check recorded release and reconcile implementation/test/deployment status, and write progress back to GitHub. Use the existing **Primary** Cloudflare account, existing isolated Worker and D1. **Only the duplicate Google Doc and duplicate Google Form are authorized for development; never touch production. Do not enable form submission, email, public URLs, or scheduled triggers until I explicitly approve each.** Reports must clearly mark unverified work, and the evidence field must always be `NIL`. Do the work and update the checklists and changelog.

## Safety and authority notes

- Read/parse Google Docs is allowed only with authorized access; browser automation and Workers OAuth are different identities.
- Form submitters must use an approved, authorized Google account; never spoof attendance or falsely imply completion.
- Never expose `ADMIN_TOKEN`, OAuth client secrets, access/refresh tokens, Cloudflare API tokens or SMTP credentials in repository/docs/logs.
- The repository is **public** at the time this file was prepared: keep private staff data and production identifiers out of it.
- Last review timestamp reflects documentation, **not** a claim that runtime health was checked at that exact time.
