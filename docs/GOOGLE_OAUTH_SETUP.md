# Independent test reader — OAuth setup and recovery

## Implemented access model

The Worker exchanges `GOOGLE_OAUTH_REFRESH_TOKEN` with Google's fixed token endpoint using `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`. It requests the immutable duplicate Doc only, via GET with tab content. No browser session or ChatGPT connector credentials are reused. The legacy `GOOGLE_DOCS_ACCESS_TOKEN` binding is no longer accepted.

The intended consent is **only** `https://www.googleapis.com/auth/documents.readonly`. This is read-only but **account-wide for Docs**, not a Google-enforced single-file grant. The code enforces the duplicate ID, and requires the token endpoint to return exactly that scope (missing/broader scope metadata fails closed). This is not a substitute for provider-level isolation. Prefer an approved dedicated Google identity with Viewer access only to the duplicate. Do not authorize an account with production material until that scope consequence has been reviewed.

Google's `drive.file` scope narrows file access but also permits modifications to selected files and requires a file selection authorization flow. It is not silently substituted. A service-account Viewer restricted to the duplicate is another viable option, but is not provisioned or supported by this refresh-token adapter yet.

## Remaining setup gate

1. Select an authorized Google Cloud project and reader identity. Enable Google Docs API; do not enable billing or paid services.
2. Configure an OAuth client and consent with only the read-only Docs scope. Obtain offline consent through an authorized redirect using `access_type=offline`, CSRF state validation and a confidential code exchange. No public callback is implemented in this Worker yet. Do not paste authorization codes, client secrets or tokens into chat, GitHub, URLs in documentation, or logs.
3. Install the three named values as **secret text bindings** on the existing `vephla-report-agent-test` Worker, through a secure account surface. A Cloudflare connector can set known secrets but cannot invent a Google OAuth client or user consent.
4. Confirm consent lifetime: external apps in Google's Testing status generally issue refresh tokens expiring in seven days for these scopes. Do not promise unattended operation indefinitely until the app's consent/publishing policy is resolved.
5. Set up an approved internal service binding or protected route to test `/health`, authenticated `/config`, and `/preview?date=2026-11-17&slot=2`. Keep workers.dev, preview URLs and Cron disabled. No unrestricted URL is required by the code.
6. Confirm the actual Worker reads the duplicate, exercises D1, and returns Unverified assignments and `NIL`. Record commit, deployment ID and observations. A connector read plus a mocked Worker test does not satisfy this gate.

## Refresh, rotation and failure behaviour

- Access tokens live only in isolate memory, expire 60 seconds early and are refreshed after a cold start; concurrent requests share an in-flight exchange.
- Changing any OAuth secret invalidates the local cached credential tuple on the next request. Redeploy/restart as needed to discard old isolates; revoke the old grant through Google when rotating.
- A Docs 401 permits one refresh and one read retry; no loop or submission retry occurs.
- Invalid/revoked consent returns `google_reauthorization_required` (503), not a fixture report. Network failures and 403/404 errors are separately identified without echoing upstream bodies.
- If Google returns a changed refresh token, processing stops with `google_credential_rotation_required`. It must be securely installed before another attempt. The adapter does not write new secrets to the Cloudflare management API.
- Never copy raw charter text or token responses into public CI logs. Unit tests use synthetic credentials and documents only.

## References

- [Google Docs scopes](https://developers.google.com/workspace/docs/api/auth)
- [Web-server OAuth and offline refresh](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Refresh-token expiry conditions](https://developers.google.com/identity/protocols/oauth2#expiration)
