import { TEST_DOCUMENT_ID } from './config.mjs';

export const DOCS_SCOPE = 'https://www.googleapis.com/auth/documents.readonly';
export class DocsError extends Error {
  constructor(code, message, status = 503) { super(message); this.code = code; this.status = status; }
}
const fail = (code, message, status) => new DocsError(code, message, status);
// Cache belongs to a bindings object, never to a global user/token. Tokens are not persisted.
export function createDocumentReader({fetcher = fetch, now = Date.now} = {}) {
  const cache = new WeakMap();
  async function accessToken(env, force = false) {
    const names = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'GOOGLE_OAUTH_REFRESH_TOKEN'];
    if (names.some(name => typeof env[name] !== 'string' || !env[name].trim())) {
      throw fail('google_auth_not_configured', 'Independent Google OAuth credentials are not configured.');
    }
    const credentials = names.map(name => env[name]);
    let entry = cache.get(env);
    if (entry && !entry.credentials.every((value, i) => value === credentials[i])) entry = undefined;
    if (!force && entry?.token && entry.expires > now()) return entry.token;
    if (entry?.pending) return entry.pending;
    entry = {credentials};
    cache.set(env, entry);
    entry.pending = (async () => {
      let response;
      try {
        response = await fetcher('https://oauth2.googleapis.com/token', {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams({grant_type: 'refresh_token', client_id: credentials[0], client_secret: credentials[1], refresh_token: credentials[2]})
        });
      } catch { throw fail('google_oauth_unavailable', 'Google OAuth is unavailable; no report generated.'); }
      let data;
      try { data = await response.json(); } catch { throw fail('google_oauth_invalid_response', 'Google OAuth returned an invalid response.'); }
      if (!response.ok) {
        if (data.error === 'invalid_grant') throw fail('google_reauthorization_required', 'Google consent expired or was revoked. Reauthorize the test reader.');
        throw fail('google_oauth_failed', 'Google token refresh failed; check the test OAuth configuration.');
      }
      if (typeof data.scope !== 'string' || data.scope.trim() !== DOCS_SCOPE) {
        throw fail('google_scope_mismatch', 'OAuth grant must contain only the read-only Docs scope.');
      }
      if (data.refresh_token && data.refresh_token !== credentials[2]) {
        throw fail('google_credential_rotation_required', 'Refresh credential changed; rotate the Worker secret securely before retrying.');
      }
      if (typeof data.access_token !== 'string' || !data.access_token || data.token_type?.toLowerCase() !== 'bearer' || !Number.isFinite(data.expires_in) || data.expires_in <= 60) {
        throw fail('google_oauth_invalid_response', 'Google OAuth returned invalid token metadata.');
      }
      entry.token = data.access_token;
      entry.expires = now() + (data.expires_in - 60) * 1000;
      return entry.token;
    })();
    try { return await entry.pending; }
    finally { entry.pending = undefined; if (!entry.token) cache.delete(env); }
  }
  return async function readDocument(env) {
    // No caller-supplied URL/document ID can reach the network.
    const url = 'https://docs.googleapis.com/v1/documents/' + TEST_DOCUMENT_ID + '?includeTabsContent=true';
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await accessToken(env, attempt > 0);
      let response;
      try { response = await fetcher(url, {redirect: 'error', signal: AbortSignal.timeout(15000), headers: {Authorization: 'Bearer ' + token}}); }
      catch { throw fail('google_docs_unavailable', 'Google Docs is unavailable; no report generated.'); }
      if (response.status === 401 && attempt === 0) { cache.delete(env); continue; }
      if (!response.ok) {
        const code = response.status === 403 ? 'google_document_access_denied' : response.status === 404 ? 'google_document_not_found' : 'google_docs_failed';
        throw fail(code, 'Duplicate charter read failed (HTTP ' + response.status + '); no report generated.');
      }
      let doc;
      try { doc = await response.json(); } catch { throw fail('google_document_invalid', 'Google Docs returned invalid document data.'); }
      if (doc.documentId !== TEST_DOCUMENT_ID || !Array.isArray(doc.tabs)) throw fail('google_document_invalid', 'Unexpected duplicate charter identity or structure.');
      return doc;
    }
  };
}
export const readDocument = createDocumentReader();
