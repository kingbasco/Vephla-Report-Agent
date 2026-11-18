# Phase 2 — protected Worker runtime verification

**Status: not yet executed.** Prepared 2026-11-18. This runbook deliberately avoids production resources, form submission, email, Cron Triggers, and public Worker URLs.

## Known facts from Cloudflare management API

- Primary account Worker: `vephla-report-agent-test`.
- Database `DB` is bound; protected API uses `ADMIN_TOKEN`.
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` are present as **secret_text** bindings. Their values have **not** been inspected or validated.
- `workers.dev` is **disabled**, preview URLs **disabled**, schedules **empty**.
- Latest observed deployment on 2026-11-18: `daa867b9-27a5-4edc-9700-8404022c0039`, version `e57606f0-e364-4371-81ed-0eed79f98350` (100%). This appears after credentials were installed; it does not establish a successful OAuth exchange.
- No form submission or email sending is implemented by the Worker.

## Why this test is not automatically complete

The Cloudflare API connection can read deployment metadata and secret **names**, but it cannot read secret values (correct security behavior), and the exposed management endpoints do not provide a direct authenticated HTTP invoke of a private Worker with disabled routes. **Do not infer OAuth success from a secret-binding check.** Do not enable workers.dev, version/preview URLs or Cron merely for convenience.

## Approved options for a live test

**A. Private/local Wrangler development with remote bindings (preferred if available).** Use authenticated Cloudflare developer tooling under the Primary account to run this exact Worker source and bind its existing D1 and Worker secrets **without copying them to local plaintext files**, verifying the tooling supports the required remote secret bindings. Confirm no route is published and the private runtime is consistent with the deployed version. Do not copy Google refresh tokens into terminal history, GitHub, logs or the chat.

**B. Explicitly authorized protected invocation path.** Set up a temporary route protected by Cloudflare Access or a trusted service-binding caller with a suitable identity policy and bearer authorization. Review the Access policy and risk before any change; do not create a public URL or broad access rule as an incidental test. Remove temporary infrastructure after verifying.

If neither route is possible, leave these runtime items **unchecked** and request the single necessary access/authorization decision.

## Test order and acceptance criteria

1. **Read-only deployment check**: confirm the latest script version and `BUILD_COMMIT`, the three OAuth secret bindings, D1 binding, zero schedules, and disabled public routes.
2. **Health**: invoke `GET /health` through a protected path. Expect phase 1, mode `test-preview-only`, no sending enabled.
3. **Authentication**: `GET /config` unauthenticated must return HTTP 401. Authenticated request using existing `ADMIN_TOKEN` must show duplicate IDs only and no sending. Never put this token in URL or logs.
4. **Real Google Docs OAuth**: authenticated `GET /preview?date=2026-11-17&slot=2`. Worker should exchange the refresh token for an access token and call **only** the duplicate Google Doc through Google Docs read API. Redact tokens and raw charter data from logs.
5. **Content checks**: confirm November 17 Task 2 source range, 22 assignment/substep entries and 11 context/instruction lines according to prior local extraction; count differences due to source edits require investigation. All statuses initially **Unverified**; `evidence: "NIL"`; `submitted: false`; no email.
6. **Negative checks**: wrong date, invalid slot, token invalid/revoked, Docs denied or unavailable. Must fail safely, not fabricate source content or submit anything.
7. **Database**: verify report/status reads via the existing D1 binding; use only synthetic status updates if a write test is authorized.
8. **Post-test isolation**: verify workers.dev and previews still disabled; Cron `[]`; no form or mail sends.
9. **Documentation**: save observed status codes, redacted response shapes, deployment ID, source SHA, and test timestamp to `docs/CHANGELOG.md`. Mark Phase 1 authenticated runtime and Phase 2 live read checkboxes only when confirmed.

## If Google returns an OAuth error

- `invalid_grant`: refresh token revoked/expired, incorrect consent identity or client mismatch. Do not paste tokens into chat; regenerate through controlled consent and secure secret update.
- 403/404 from Docs: confirm duplicate Viewer access for the authorized identity and Google Docs API enabled; no fallback to the production charter.
- Testing-mode 7-day refresh-token lifetime may affect unattended operation. Decide consent publication and long-lived grant policy before scheduled activation.

## No-send guarantee

No form submission, email, automatic schedules, production Doc or Form access, or public endpoint activation is part of this checkpoint.
