# Vephla Reporting Agent

> **Project handover and development tracking:** [START HERE — continue in any new chat](CONTINUE_HERE.md) · [7-phase checkbox roadmap](docs/DEVELOPMENT_STATUS.md) · [Architecture](docs/ARCHITECTURE.md) · [Decisions](docs/DECISIONS.md) · [Changelog](docs/CHANGELOG.md) · [Operations](docs/OPERATIONS.md) · [Agent instructions](AGENTS.md)

**Current project position (2026-11-17 WAT):** Phase 1 infrastructure deployed but runtime/code-parity checks remain; Phase 2 Google Docs OAuth is the next feature. Source code is in GitHub; pushes to `main` run checks, **not deployments**. The test Worker cannot yet read the duplicate Google Doc independently and cannot submit forms or email.

**Cloudflare Workers + D1 — Test-only project**

A Vephla reporting automation foundation that reads an approved **duplicate** staff daily charter, generates scheduled-slot report previews and stores explicit task statuses. Unconfirmed activities are marked **Unverified**, and every evidence field uses `NIL`.

## Development status

| Phase | Scope | Status |
|---|---|---|
| 1 | Infrastructure, Worker, isolated D1 | Deployed to Primary Cloudflare account |
| 2 | Google Docs OAuth and live charter reader | Pending |
| 3 | Report generation and task statuses | Scaffolded |
| 4 | Form submission engine | Manual browser test passed separately; disabled in Worker |
| 5 | Scheduling and duplicate prevention | Pending |
| 6 | Email reports and dashboard | Pending |
| 7 | End-to-end testing and production approval | Pending |

The existing Cloudflare Worker is **`vephla-report-agent-test`**. The dedicated D1 database is **`vephla-report-agent-test-db`**. The Worker has no public workers.dev address and no Cron Triggers.

This repository contains the Phase 1 source, migrations, tests and CI workflow. **Pushing to `main` does not deploy code.** Production form access, form submissions and email delivery are not enabled.

## Development

Requires Node.js 20+.

```bash
npm install
npm test
npm run check
npm run safety
npm run build
```

## Source and test boundaries

- Google Doc: approved **duplicate** ID `14lqjOS0Q1_luNPUID2tlhgb0FJS0DfZGxtb6xmb0vPU`
- Google Form: approved **duplicate** ID `1FAIpQLSf_9sFMCHhyT5JfxQv0UGRH6jPwOWeJ4nKqoPxDCdsuCVfQDw`
- Evidence: `NIL`
- Time zone: `Africa/Lagos`
- Mode: `test-preview-only`

No credentials are committed. The project currently needs a Google Docs OAuth token lifecycle before the deployed Worker can independently read the test Doc. ChatGPT's connected Google Drive session does not automatically provide Cloudflare with OAuth access.

## Cloudflare API endpoints

- `GET /health`: public, non-sensitive health information (when access is enabled).
- `GET /config`: bearer-token protected configuration summary.
- `GET /preview?date=2026-11-17&slot=2`: bearer-token protected report preview.
- `POST /status`: bearer-token protected explicit task-status update.
- `GET /runs`: bearer-token protected run history.

All non-health endpoints require `Authorization: Bearer <ADMIN_TOKEN>`. The deployed Worker remains inaccessible via workers.dev until a protected access pathway is deliberately enabled.

## GitHub workflows

- **Verify test-only reporting agent:** runs tests and safety checks on commits to `main` and pull requests. Never deploys.
- **Deploy isolated TEST Worker:** manual `workflow_dispatch` only; also requires a GitHub Environment named `vephla-test`, plus restricted `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment secrets. The deployment script refuses the wrong account, an enabled public URL, unexpected Cron Triggers or an incorrect D1 binding. These prerequisites have **not** been configured here.

**Do not use this code for real work attendance or enable the production form without a separate approval and full end-to-end verification.**
