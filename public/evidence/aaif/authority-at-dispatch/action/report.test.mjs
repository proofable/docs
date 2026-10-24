/**
 * Smoke test for the report builder: a fixture run directory shaped exactly like
 * the kit's output, so the parser can be exercised without paying for a run.
 *
 * The fixture is a test input, never a result: it is written to a temp directory,
 * labelled `Fixture Org`, and its `product_revision` is `fixture-rev`.
 *
 *   node --test action/report.test.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const reportScript = join(here, 'report.mjs');
const CASES = [
  'hosted_allow',
  'binding_veto',
  'approval_reachable',
  'approval_unavailable',
  'revoke_before_dispatch',
  'expiry_before_dispatch',
  'stale_authority',
  'post_dispatch_revoke',
];

function buildFixture({ failing = [] } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'proofable-report-'));
  const dir = join(root, 'runs', 'fixture-run');
  mkdirSync(dir, { recursive: true });
  const identity = {
    run_id: 'fixture-run',
    operator: 'Fixture Org',
    custody: 'OPERATOR: Fixture Org',
    product_revision: 'fixture-rev',
    mcp_url: 'https://mcp.proofable.me/mcp',
    delegationRoot: 'did:pkh:eip155:8453:0x1111111111111111111111111111111111111111',
    agentId: 'aaif-authority-review',
    agentWallet: '0x2222222222222222222222222222222222222222',
  };
  const rows = [];
  for (const [i, name] of CASES.entries()) {
    const passed = !failing.includes(name);
    const record = {
      schema: 'proofable-aaif-authority-suite/v1',
      case: name,
      ...identity,
      passed,
      jobId: `job_${i}`,
      receipt: { qHash: `0x${String(i).repeat(64)}` },
    };
    writeFileSync(join(dir, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`);
    rows.push({ case: name, passed, jobId: `job_${i}`, grant: null });
  }
  const manifest = {
    schema: 'proofable-aad-run-manifest/v1',
    kit: 'fixture',
    ...identity,
    expected_cases: CASES,
    cases: rows,
    errors: [],
    passed_count: rows.filter((r) => r.passed).length,
    not_measured: ['revocation latency', 'target-side committed effect'],
  };
  writeFileSync(join(dir, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const files = [...CASES.map((c) => `${c}.json`), 'MANIFEST.json'].sort();
  writeFileSync(
    join(dir, 'SHA256SUMS'),
    `${files.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`).join('\n')}\n`,
  );
  const verifyLog = join(root, 'verify.log');
  writeFileSync(
    verifyLog,
    `${CASES.map((c) => `${c.padEnd(24)} ${failing.includes(c) ? 'FAIL' : 'PASS'}     2/2 envelopes`).join('\n')}\n\nall checks pass\n`,
  );
  return { root, dir, verifyLog };
}

function runReport(args) {
  try {
    const stdout = execFileSync(process.execPath, [reportScript, ...args], { encoding: 'utf8' });
    return { status: 0, stdout };
  } catch (error) {
    return { status: error.status, stdout: `${error.stdout || ''}${error.stderr || ''}` };
  }
}

test('a clean run reports eight passes with seals verified', () => {
  const { root, dir, verifyLog } = buildFixture();
  const out = join(root, 'report.json');
  const result = runReport([dir, '--verify-log', verifyLog, '--out', out, '--summary', join(root, 'report.md')]);
  assert.equal(result.status, 0);
  const report = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(report.schema, 'trustharness.report/v1');
  assert.equal(report.arm, 'self-run');
  assert.equal(report.authority.passed, 8);
  assert.equal(report.authority.total, 8);
  assert.equal(report.authority.unauthorized_actions_through, 0);
  assert.equal(report.integrity.checksums, 'pass');
  assert.equal(report.integrity.envelopes_verified, 16);
  // Nothing measured cost, so every cost row is null with a reason.
  for (const row of report.cost) {
    assert.equal(row.value, null);
    assert.ok(row.reason, `${row.metric} needs a reason`);
  }
  assert.ok(report.not_measured.length >= 2);
  assert.ok(!/48 of 48|48\/48/.test(JSON.stringify(report.cost)), 'the report must not carry a comparison figure');
});

test('a failing case is counted as one that got through and fails the build', () => {
  const { root, dir, verifyLog } = buildFixture({ failing: ['binding_veto'] });
  const out = join(root, 'report.json');
  const result = runReport([dir, '--verify-log', verifyLog, '--out', out]);
  assert.equal(result.status, 2);
  const report = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(report.authority.passed, 7);
  assert.equal(report.authority.unauthorized_actions_through, 1);
  assert.equal(report.authority.cases.find((c) => c.case === 'binding_veto').outcome, 'fail');
  assert.equal(report.integrity.checksums, 'fail');
});

test('a directory without a sealed manifest is refused, not guessed', () => {
  const { root } = buildFixture();
  const result = runReport([join(root, 'runs'), '--out', join(root, 'nope.json')]);
  assert.equal(result.status, 1);
  assert.match(result.stdout + '', /MANIFEST\.json/);
});
