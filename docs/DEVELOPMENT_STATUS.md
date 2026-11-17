# Development status — checkbox master tracker

**Canonical roadmap: 7 phases. Updated:** 2026-11-17 WAT. Owner: Vephla Reporting Agent project. Repository: `kingbasco/Vephla-Report-Agent`.

## How to interpret checkboxes

- `[x]` = deliverable is present and the relevant evidence or verification is recorded.
- `[ ]` = unbuilt, incomplete, or unverified; **do not infer completion from a file merely existing**.
- A checked subtask does not mean its entire phase is complete.
- Label milestones as **CODE**, **TEST**, **CLOUD**, **MANUAL TEST**, or **REQUIRES REVIEW** as applicable.
- Every completion update should include a commit SHA / run URL / Cloudflare verification in `docs/CHANGELOG.md`.
- **Current focus: Phase 2.** Phases 1 and 3 have completed scaffolding items but also unresolved acceptance checks. No automatic daily reporting yet.

## Phase overview

| Phase | Area | Honest current status |
|---|---|---|
| 1 | Cloudflare project, isolation and D1 | Base deployed; end-to-end Worker and access verification outstanding |
| 2 | Google Docs integration and charter extraction | Parser code exists; independent Worker OAuth missing |
| 3 | Status intelligence and truthful report generation | Model and generator scaffolded; acceptance tests still required |
| 4 | Google Form automation | One external browser test successful; **Worker integration not implemented** |
| 5 | Scheduling, retries and deduplication | Not implemented |
| 6 | Detailed email, dashboard, administration | Not implemented |
| 7 | End-to-end QA and authorised launch | Not started |

## Phase 1 — Foundation, security and infrastructure

- [x] **CLOUD** Select Primary Cloudflare account; do not use unrelated business applications.
- [x] **CLOUD** Create dedicated `vephla-report-agent-test` Worker.
- [x] **CLOUD** Create dedicated `vephla-report-agent-test-db` D1 database.
- [x] **CLOUD** Create `task_status` and `report_runs` tables with constraints and uniqueness (see migration).
- [x] **CLOUD** Bind `DB` and private `ADMIN_TOKEN` to test Worker.
- [x] **CLOUD** Verify no Cron Triggers and workers.dev / preview exposure disabled at initial rollout.
- [x] **CODE** Put test-only Doc/Form IDs, WAT timezone and `NIL` evidence policy in config.
- [x] **CODE** Build Worker endpoints (`/health`, `/config`, `/preview`, `/status`, `/runs`) with bearer token for non-health endpoints.
- [x] **CODE** Add source, D1 migration, tests and CI to GitHub `main`.
- [x] **TEST** Five Node tests and source safety checks passed in GitHub CI on 2026-11-17 before documentation change.
- [x] **CODE** CI executes checks on `main`; separate deployment workflow is manual only.
- [ ] **TEST/CLOUD** Verify the **repository source and uploaded Cloudflare Worker are equivalent**; current upload predates GitHub source refactor.
- [ ] **TEST/CLOUD** Exercise live `/health` and protected `/config` through a safely authenticated internal route without enabling unrestricted public access.
- [ ] **SECURITY** Review API authentication and access control for future protected preview route; ensure secret rotation and audit practice.
- [ ] **REQUIRES REVIEW** Confirm deployment flow's GitHub Environment, scoped secrets and least privilege before using manual deploy.
- [ ] **DOCS** Record deploy commit SHA and runtime verification results in a dated release entry.

**Phase 1 acceptance:** isolated database + Worker verified reachable securely, source/deployed parity confirmed, CI passing, no production/cross-project access.

## Phase 2 — Google Docs reading and charter extraction (**NEXT**)

- [x] **CODE** Implement tab-aware parsing for the `NOVEMBER CHARTERS` tab.
- [x] **CODE** Implement date and Task 1–4 section separation.
- [x] **TEST** Basic sample parser tests exist.
- [ ] **AUTH** Choose Google Docs OAuth integration with least privilege and consent for the dedicated Worker.
- [ ] **AUTH** Implement secure long-lived refresh / rotation; no hard-coded access token and no tokens in Git.
- [ ] **AUTH** Ensure OAuth client is allowed to read **only intended duplicate material** as far as Google authorization permits.
- [ ] **CLOUD** Configure secrets for Google Docs API access on isolated test Worker.
- [ ] **TEST/CLOUD** Authenticated read of duplicate Google Doc **from Worker**, not merely ChatGPT connector.
- [ ] **TEST** Verify exact Nov 17 Task 2 extraction against actual duplicate charter; headings, nested tables, links and repeated dates handled.
- [ ] **TEST** Confirm other dates and all four tasks, empty sections, future dates and malformed docs fail safely.
- [ ] **TEST** Confirm expired/revoked OAuth errors are visible and do not trigger bogus reports.
- [ ] **TEST/CLOUD** Generate a protected, successful Worker report preview using the duplicate Doc.
- [ ] **DOCS** Record OAuth access model and test results; exclude tokens from logs.

**Phase 2 acceptance:** Worker reads duplicate charter securely, parses expected task groups and generates an authenticated preview without sending anything.

## Phase 3 — Task-status intelligence and report generator

- [x] **CODE** Define `completed`, `in-progress`, `blocked`, `unverified`.
- [x] **CODE** Default unstated task statuses to **unverified**.
- [x] **CODE** Support explicit `/status` updates persisted in D1.
- [x] **CODE** Generate report preview with `NIL`, source date, slot and statuses.
- [x] **TEST** Basic test cases for defaults, explicit completed status, dates and labels.
- [ ] **DESIGN** Distinguish activity groups from nested instructions, headings, and actual deliverables.
- [ ] **DESIGN** Add source references, task IDs, and stability across charter edits; avoid status-by-index drift.
- [ ] **TEST** Handle split/incomplete/moved tasks, duplicates, holiday/weekend rules, previous-workday reporting.
- [ ] **TEST** Treat “Project Uni Flex brief reviewed” as a review, not full design/prototype completion.
- [ ] **TEST** Verify reports do not turn unverified items into completed actions, and do not invent links.
- [ ] **TEST** Establish report format suitable for form character limits and WAT period.
- [ ] **SECURITY** Avoid publishing staff information/complete reports in public logs.

**Phase 3 acceptance:** deterministic, accurate reports grounded in charter plus explicitly confirmed statuses, with unverified assignments marked appropriately.

## Phase 4 — Authenticated Google Form submissions (**DUPLICATE ONLY**)

- [x] **MANUAL TEST** A single Nov 17, 2026 synthetic Clock-In 2 submission to **duplicate Form** was confirmed by Google and seen by user.
- [ ] **ARCHITECTURE** Decide supported, maintained respondent submission method; Google Docs read access alone does not submit Google Forms.
- [ ] **AUTH** Secure reusable authorised browser or suitable supported integration; manage session expiry.
- [ ] **CODE** Implement mapping of exact radio/dropdown/date/time/text fields, including `NIL` evidence.
- [ ] **CODE** Validate every field and use actual trusted WAT submission time; never silently backdate.
- [ ] **CODE** Add **dry-run / no-submit** preview and explicit test-only submission guard.
- [ ] **CODE** Capture confirmation and submission metadata; ambiguous results must not be retried blindly.
- [ ] **TEST** Verify all four slot formats with synthetic responses to duplicate only.
- [ ] **TEST** Test expired sessions, UI changes, required-field errors and Google response throttling.
- [ ] **REQUIRES APPROVAL** Separate opt-in needed before enabling **duplicate-only** Worker submissions.

**Phase 4 acceptance:** authorised integration submits accurate synthetic duplicate-form responses with explicit confirmation, audit trail and no unknown or repeated sends.

## Phase 5 — Schedule, deduplication, retries, monitoring

- [ ] **DESIGN** Reconcile charter 8 AM vs Google Form 9 AM; confirm scheduling policy.
- [ ] **DESIGN** Define clock-in times for 9 AM, noon, 3 PM, end-of-workday and weekends/holidays in WAT.
- [ ] **DESIGN** Agree whether final clock-in is scheduled or manually signalled on late-lecture days.
- [ ] **CODE** Add schedule-safe queue/workflow and idempotency key per date + slot + environment.
- [ ] **CODE** Create “pending → sending → confirmed / uncertain / failed” audit states; prevent double sending.
- [ ] **CODE** Reconcile submission after timeout when outcome unknown; no blind retries.
- [ ] **CODE** Add backoff, error alerts, pause/resume and emergency stop.
- [ ] **TEST** Dry-run 4 slots without any form submissions.
- [ ] **TEST** Clock skew, daylight assumptions, weekends, repeated Cron invocation and outage recovery.
- [ ] **REQUIRES APPROVAL** Enable Cron for **duplicate test only**, then independently approve any production activation.

**Phase 5 acceptance:** scheduled operations run safely with zero duplicate submissions, recoverable state and explicit environment controls.

## Phase 6 — End-of-day email and reporting dashboard

- [ ] **DESIGN** Final end-of-day detailed report format and recipient/CC policy.
- [ ] **DESIGN** Confirm the official cPanel mailbox/provider and allowed sender; obtain credentials securely.
- [ ] **CODE** Generate consolidated Tasks 1–4 summary, completed/in-progress/blocked/unverified breakdown.
- [ ] **CODE** Configure SMTP or provider adapter securely with restricted credentials.
- [ ] **CODE** Add email preview, no-send dry run, delivery logs, retry rules and suppression.
- [ ] **CODE** Build protected dashboard with today's charter, statuses, 4 slots and report previews.
- [ ] **CODE** Add submission history, search/filter, retry review, account sign-in, manual overrides and logout.
- [ ] **TEST** Deliver to designated **test mailbox** with approval; verify content and delivery.
- [ ] **TEST** Responsiveness, accessibility, authentication, data privacy and error recovery.
- [ ] **REQUIRES APPROVAL** Enable actual email sending separately from form sending.

**Phase 6 acceptance:** usable private dashboard and authorised test email delivery with accurate summaries and complete logs.

## Phase 7 — Final QA, rollout and operating handover

- [ ] **QA** Review all code, secrets, CI, deployment isolation and data minimization.
- [ ] **QA** Repeat all four reporting scenarios on duplicate assets with realistic unverified statuses.
- [ ] **QA** Validate actual source vs deployed code and database migration status.
- [ ] **QA** Verify successful and failed submissions, duplicate detection, alerts, email and cron.
- [ ] **QA** Verify WAT timestamps and correct reporting day in real schedule.
- [ ] **OPS** Write runbook, incident recovery, credential rotation, rollback and backup.
- [ ] **OPS** Establish source control releases, deployment checks and monitoring dashboard.
- [ ] **REQUIRES APPROVAL** Obtain explicit separate approval for using original production Doc and Form.
- [ ] **REQUIRES APPROVAL** Obtain explicit separate approval before production email delivery / automation.
- [ ] **LAUNCH** Run supervised production acceptance; record evidence of success and stakeholder signoff.
- [ ] **DOCS** Finalize handoff, architecture diagrams and operational ownership.

**Phase 7 acceptance:** signed-off system operating safely, with documented rollback, audit history and clear ownership.

## Current blockers / next checklist action

**First actionable unchecked item:** Phase 2 → **Choose and implement independent Google Docs OAuth**, then verify real Worker read of the duplicate charter. Phase 1 parity/reachability checks remain open and should be included in the next deployment work.

## Update protocol

After implementing a checkbox: mark `[x]` only if the relevant check actually passed; add proof to `docs/CHANGELOG.md`; update `CONTINUE_HERE.md` and the README summary. Unknown items stay unchecked. This document is the **authoritative granular checklist**.
