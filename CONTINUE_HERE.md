# START HERE — Vephla Reporting Agent

> **Purpose:** Single-entry handoff for a new ChatGPT conversation or developer. **Last reviewed:** 2026-11-17 (WAT). Read this first, then `docs/DEVELOPMENT_STATUS.md`, `docs/ARCHITECTURE.md`, and the latest commit/CI before changing anything.

## One-minute context

This is a proposed fully automated workday reporting agent for Vephla Group. Each workday, it should read the daily charter from a Google Doc, identify Tasks 1–4, write honest progress reports, and eventually submit four Google Form clock-ins. A more detailed end-of-day email may follow. **User's final policy:** fully automatic submissions, **unverified statuses explicitly labelled**, evidence field always **`NIL`**, Africa/Lagos (WAT). Automation must not fabricate completion, proof links, time worked, or past clock-in times.

**Current state:** Phase 1 Cloudflare infrastructure deployed; Phase 2 (independent Google Docs auth) is next. GitHub stores source and docs, but pushing to `main` does **not** deploy. The deployed Worker and repository are separate snapshots until manually reconciled/deployed. The original company Google Doc, Google Form, and mail recipients remain **out of scope** for tests and must not be accessed for writes.

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

**Exists:** source files, test document parser, report generator, status update API, D1 schema, safe scheduled handler, CI validation and manual gated deployment workflow, duplicate-only browser form submission proof-of-concept.

**Not delivered:** live authenticated Google Docs reading inside Worker; validated real Worker `/preview`; reliable Google Form submission from Worker; daily scheduler; persisted send deduplication; cPanel SMTP; UI dashboard; production credentials; end-to-end launch.

## Next exact task — Phase 2

1. Check `docs/DEVELOPMENT_STATUS.md` for the unchecked items, review last GitHub commit and recent CI.
2. Decide the **least-privileged independent Google Docs OAuth** approach for the isolated Worker. Auth must work across runs and refresh tokens without manually copying short-lived access tokens; no tokens committed to Git.
3. Confirm it can only read the **duplicate** Doc; test November tab selection and the 2026-11-17 Task 2 range, including paragraphs in tables.
4. Compare the parsed items to the duplicate charter; avoid treating headings, reminders, and assignments as automatically completed.
5. Verify secure test-only API access, run `/preview?date=2026-11-17&slot=2` with all activities initially **unverified**, log observed results and update checklist.
6. Keep all form submissions, email delivery, Cron, production URLs and public workers.dev **disabled**. Get explicit approval before enabling sending, even on the duplicate when the next phase introduces it.

## How to work in future chats

1. Open this file and `docs/DEVELOPMENT_STATUS.md` from **GitHub** (not memory alone).
2. Inspect code for features labelled `implemented`; verify Cloudflare actual deployment separately.
3. Proceed with **the first unchecked and unblocked task**, in order; respect the safety contract.
4. After each meaningful change: update checklist(s), `docs/CHANGELOG.md`, `docs/DECISIONS.md` if a decision changes, and this handoff's **Current state** / **Next exact task**.
5. Check tests and CI; record exact commit SHA and deploy ID/verification if relevant. Never infer that a green GitHub CI means Cloudflare code was deployed.
6. No GitHub repo recreation, no new accounts and no switching the Cloudflare account.

## Copy/paste prompt to resume from a new chat

> Continue building **kingbasco/Vephla-Report-Agent**. Start by reading `CONTINUE_HERE.md`, `docs/DEVELOPMENT_STATUS.md`, `docs/ARCHITECTURE.md`, and `docs/DECISIONS.md` from the `main` branch; inspect the latest commit and GitHub Actions. Continue from the first unchecked Phase 2 task, reconcile implementation/test/deployment status, and write progress back to GitHub. Use the existing **Primary** Cloudflare account, existing isolated Worker and D1. **Only the duplicate Google Doc and duplicate Google Form are authorized for development; never touch production. Do not enable form submission, email, public URLs, or scheduled triggers until I explicitly approve each.** Reports must clearly mark unverified work, and the evidence field must always be `NIL`. Do the work and update the checklists and changelog.

## Safety and authority notes

- Read/parse Google Docs is allowed only with authorized access; browser automation and Workers OAuth are different identities.
- Form submitters must use an approved, authorized Google account; never spoof attendance or falsely imply completion.
- Never expose `ADMIN_TOKEN`, OAuth client secrets, access/refresh tokens, Cloudflare API tokens or SMTP credentials in repository/docs/logs.
- The repository is **public** at the time this file was prepared: keep private staff data and production identifiers out of it.
- Last review timestamp reflects documentation, **not** a claim that runtime health was checked at that exact time.
