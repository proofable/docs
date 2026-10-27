// Read-only MCP probe: discovery, lists and public sign-in metadata, never a tool call.
// Usage: node probe.mjs <https url>   Prints one JSON object.
import tls from 'node:tls';
const url = new URL(process.argv[2]);
const log = [];
const out = { url: url.href, at: new Date().toISOString(), log };
const ZW = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/u;
const PHRASES = /ignore (all |any |the )?(previous|prior|above)|do not (tell|mention|inform|show)|without (telling|informing)|<\/?important>|before (using|calling) (this|any) tool|system prompt|~\/\.ssh|id_rsa|\.env\b|mcp\.json|<!--|[A-Za-z0-9+/=]{200,}/i;
let sid = null;
async function req(method, target, body, extra = {}) {
  if (log.length >= 20) return null;
  const headers = { accept: 'application/json, text/event-stream', ...extra };
  if (body) headers['content-type'] = 'application/json';
  if (sid) headers['mcp-session-id'] = sid;
  try {
    const r = await fetch(target, { method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(20000) });
    const text = await r.text();
    if (r.headers.get('mcp-session-id')) sid = r.headers.get('mcp-session-id');
    const line = text.split('\n').find((l) => l.startsWith('data:'));
    let json = null;
    try { json = JSON.parse(line ? line.slice(5) : text); } catch {}
    log.push({ method: body?.method || method, url: target, status: r.status });
    return { status: r.status, auth: r.headers.get('www-authenticate'), json };
  } catch (e) {
    log.push({ method: body?.method || method, url: target, error: String(e.cause?.code || e.message) });
    return null;
  }
}
const rpc = (id, method, params = {}, extra = {}) => req('POST', url.href, { jsonrpc: '2.0', id, method, params }, extra);
out.tls = await new Promise((done) => {
  const s = tls.connect({ host: url.hostname, port: Number(url.port) || 443, servername: url.hostname, timeout: 15000 }, () => {
    const c = s.getPeerCertificate();
    done({ authorized: s.authorized, error: s.authorizationError || null, subject: c.subject?.CN, issuer: c.issuer?.O, validTo: c.valid_to });
    s.end();
  });
  s.on('error', (e) => done({ authorized: false, error: String(e.code || e.message) }));
});
const client = { name: 'proofable-mcp-benchmark', version: '1' };
const d = await rpc(1, 'server/discover', { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': client, 'io.modelcontextprotocol/clientCapabilities': {} } }, { 'mcp-method': 'server/discover', 'mcp-protocol-version': '2026-07-28' });
out.discover = d && { status: d.status, result: d.json?.result || null, error: d.json?.error || null };
const i = await rpc(2, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: client });
out.initialize = i && { status: i.status, protocolVersion: i.json?.result?.protocolVersion || null, serverInfo: i.json?.result?.serverInfo || null, capabilities: i.json?.result?.capabilities || null, error: i.json?.error || null };
const challenge = [d, i].find((r) => r?.status === 401);
// Lists over the current revision when the server speaks it (no session, the envelope on every
// request), else over the 2025-11-25 session that initialize opened.
const current = d?.status === 200 && (d.json?.result?.supportedVersions || []).includes('2026-07-28');
const session = i?.status === 200 && i.json?.result;
if (current || session) {
  let params = () => ({});
  let headers = () => ({ 'mcp-protocol-version': i.json.result.protocolVersion });
  if (current) {
    sid = null;
    params = () => ({ _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': client, 'io.modelcontextprotocol/clientCapabilities': {} } });
    headers = (method) => ({ 'mcp-method': method, 'mcp-protocol-version': '2026-07-28' });
  } else {
    await req('POST', url.href, { jsonrpc: '2.0', method: 'notifications/initialized' }, headers());
  }
  out.listedOver = current ? '2026-07-28' : i.json.result.protocolVersion;
  for (const [key, method] of [['tools', 'tools/list'], ['prompts', 'prompts/list'], ['resources', 'resources/list']]) {
    const items = [];
    let cursor;
    let status = null;
    for (let page = 0; page < 3; page += 1) {
      const r = await rpc(10 + page, method, { ...params(), ...(cursor ? { cursor } : {}) }, headers(method));
      status = r?.status ?? null;
      if (!r?.json?.result) break;
      items.push(...(r.json.result[key] || []));
      cursor = r.json.result.nextCursor;
      if (!cursor) break;
    }
    out[key] = { status, items };
  }
  const tools = out.tools.items;
  const names = tools.map((t) => t.name);
  out.schemaProblems = tools.filter((t) => !t.name || t.inputSchema?.type !== 'object').map((t) => t.name || '(unnamed)');
  out.duplicateNames = names.filter((n, k) => names.indexOf(n) !== k);
  // Server instructions reach the model too, so they are read like any description.
  const instructions = [d?.json?.result?.instructions, i?.json?.result?.instructions]
    .filter(Boolean).map((text) => ({ name: '(server instructions)', description: text }));
  out.poisoningHits = [...tools, ...out.prompts.items, ...out.resources.items, ...instructions].flatMap((t) => {
    const text = [t.description, t.title, JSON.stringify(t.inputSchema || {})].filter(Boolean).join(' ');
    const hit = text.match(PHRASES) || (ZW.test(text) ? ['hidden character'] : null);
    return hit ? [{ name: t.name || t.uri, match: hit[0].slice(0, 80), text: String(t.description || '').slice(0, 200) }] : [];
  });
  out.annotations = tools.map((t) => ({ name: t.name, readOnly: t.annotations?.readOnlyHint ?? null, destructive: t.annotations?.destructiveHint ?? null }));
}
if (challenge) {
  out.challenge = challenge.auth;
  const named = /resource_metadata="([^"]+)"/.exec(challenge.auth || '')?.[1];
  const prmUrl = named || `${url.origin}/.well-known/oauth-protected-resource${url.pathname === '/' ? '' : url.pathname}`;
  const prm = await req('GET', prmUrl);
  out.resourceMetadata = prm && { url: prmUrl, named: Boolean(named), status: prm.status, doc: prm.json };
  const as = prm?.json?.authorization_servers?.[0];
  if (as) {
    const a = new URL(as);
    const path = a.pathname === '/' ? '' : a.pathname;
    for (const wk of [`${a.origin}/.well-known/oauth-authorization-server${path}`, `${a.origin}/.well-known/openid-configuration${path}`]) {
      const r = await req('GET', wk);
      if (r?.status === 200 && r.json) {
        const m = r.json;
        out.authServer = { url: wk, issuer: m.issuer, pkce: m.code_challenge_methods_supported || null, cimd: m.client_id_metadata_document_supported ?? null, registration: Boolean(m.registration_endpoint), issParameter: m.authorization_response_iss_parameter_supported ?? null };
        break;
      }
    }
  }
}
console.log(JSON.stringify(out, null, 1));
