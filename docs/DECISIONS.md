# Decisions and operating constraints

Last reviewed: **2026-11-17**, WAT. Update this log when a user explicitly changes a product decision; do not silently override.

| ID | Decision | Source/context | Status |
|---|---|---|---|
| D-001 | There are **7 development phases**, beginning with Cloudflare foundation and ending in controlled production launch. | Approved development roadmap | Active |
| D-002 | Use **Cloudflare Worker + D1** on **Primary** account. Keep separate from other projects. | User explicitly selected Primary account | Active |
| D-003 | Store code and ongoing documentation in `kingbasco/Vephla-Report-Agent` on `main`. | User supplied repository; source uploaded | Active |
| D-004 | Use the **duplicate** Google Doc and duplicate Google Form throughout development. No production writes. | Explicit instruction | Hard boundary |
| D-005 | Report task statuses as `completed`, `in-progress`, `blocked`, `unverified`. Unknown work is **unverified**. | User chose full automation with unverified statuses explicitly marked | Active |
| D-006 | Evidence / Upload Verifications is **exactly `NIL`** for every report unless user revises this requirement. | Explicit repeated instruction | Active |
| D-007 | Final intended behavior is **fully automatic submissions**, but no production submission is authorized yet. Testing and rollout require separate approvals. | User selected fully automatic mode | Product goal, not live |
| D-008 | A single synthetic Nov 17 midday duplicate-form submission succeeded through browser automation; it does **not** establish Cloudflare integration. | Browser confirmation + user confirmation | Verified external test |
| D-009 | The first reporting time has a mismatch: charter says 8 AM; Google Form says 9 AM WAT. Do not automate before policy decision. | Inspected sources | Open |
| D-010 | Clock-in time must be the **actual time**, not a fabricated or retrospectively backdated timestamp. | Integrity requirement and past test discrepancy | Active |
| D-011 | Email delivery is planned for end of day, subject to authorised mailbox, recipients, and independent rollout approval. | Original reporting concept | Not implemented |
| D-012 | GitHub Actions CI on push; deployment remains **manual**, with protected `vephla-test` environment and scoped secrets. | Safest implementation of source control | Active |
| D-013 | Unrestricted public Worker access, Cron Triggers, form sending and email sending remain disabled while foundation is under development. | Explicit user safety instructions | Active |
| D-014 | Work may continue in a new chat; `CONTINUE_HERE.md` plus checkbox status is the canonical handoff. | User request | Active |

## Open decisions requiring user approval later

- First clock-in: align 8 AM charter vs 9 AM Form; determine whether report is about previous day's work.
- Fourth clock-in: fixed schedule vs manual “End My Day” (evening classes may extend work).
- Exact fields/identity of legitimate respondent and recipients for future production.
- Choice of reliable Google Docs OAuth flow and browser/form submission platform.
- How to monitor and alert on failures, ambiguous sends and missing status confirmations.
- Whether to add a protected dashboard domain and sign-in; do not expose Worker publicly as a workaround.
- Specific switch-over criteria, acceptance test evidence and written production approval.

## Non-decisions

- Having a Google session in the ChatGPT browser is **not** proof that the deployed Worker has access.
- One successful duplicate-form response is **not** proof of 4× daily scheduling.
- A passing GitHub CI run is **not** proof of live Cloudflare deployment.
- Listing a charter assignment is **not** proof of task completion.
