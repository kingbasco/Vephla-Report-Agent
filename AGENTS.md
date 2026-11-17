# Agent instructions — Vephla Reporting Agent

The canonical handoff is [CONTINUE_HERE.md](CONTINUE_HERE.md). **Read it before changes.** Then read [docs/DEVELOPMENT_STATUS.md](docs/DEVELOPMENT_STATUS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [docs/DECISIONS.md](docs/DECISIONS.md).

## Do not skip this process

1. Check actual `main` HEAD, recent CI results and Cloudflare deployed state. CI green ≠ deployed.
2. Select a scoped unfinished task from the checkbox roadmap; work in phase order where feasible.
3. Respect immutable development boundaries: **duplicate Google Doc only, duplicate Google Form only; Evidence = `NIL`; unknown statuses = unverified**.
4. **No production assets, automatic form submission, emails, Cron schedules, public Worker URL, or production credential changes without explicit authorization.** A future plan for fully automatic reporting is not an authorization to activate it now.
5. Do not fabricate completion, verification links or clock-in timestamps. Browser sign-in ≠ independent Worker OAuth.
6. Run `npm test && npm run check && npm run safety`. If changing bundling/deployment, run `npm run build` too.
7. Update the checkbox in `docs/DEVELOPMENT_STATUS.md` **only when verified**. Add a detailed entry to `docs/CHANGELOG.md` and update `CONTINUE_HERE.md` to identify the next task. Record CI run SHA and Cloudflare verification where relevant.
8. Avoid secrets, personal work records and production information in this **public repository**.

**Current focus: Phase 2 Google Docs OAuth and a verified Worker preview of the duplicate Nov 17 Task 2.** Test-only Cloudflare Worker `vephla-report-agent-test` and D1 `vephla-report-agent-test-db` already exist in the Primary Cloudflare account. Do not recreate them.
