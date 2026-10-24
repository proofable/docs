#!/usr/bin/env node
/**
 * Build a `trustharness.report/v1` report from one sealed authority-at-dispatch run.
 *
 * This reads only what the kit wrote. It measures nothing itself and copies no
 * comparison figure: cost and performance rows are null with a reason until
 * something measured them, and the evidence page stays the owner of every
 * comparison number.
 *
 *   node report.mjs <run-dir> [--verify-log verify.log] [--source <repo-url>]
 *                              [--out proofable-report.json] [--summary report.md]
 *
 * Exit codes: 0 report written, 1 the run directory is unusable.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const NOT_MEASURED = [
  'revocation latency (how long a revocation takes to reach the check)',
  'target-side committed effect (effects are recorded as the service observed them)',
  'model cost per correct outcome (no paired arm ran in this report)',
  'false-refusal rate (no benign twin ran in this report)',
];

const COST_ROWS = [
  {
    metric: 'authority decision overhead',
    value: null,
    unit: 'ms/decision',
    reason: 'Not measured in this run. The kit records decisions and effects, not per-decision latency.',
  },
  {
    metric: 'cost per correct outcome (receipt check vs redo)',
    value: null,
    unit: 'USD',
    reason: 'No paired arm ran here. The money comparison is a separate suite with its own run record.',
  },
  {
    metric: 'offline verification latency',
    value: null,
    unit: 'ms',
    reason: 'The verify step reports pass/fail, not a timed median.',
  },
];

function parseArgs(argv) {
  const out = { runDir: '', verifyLog: '', source: '', out: '', summary: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      i += 1;
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === '--verify-log') out.verifyLog = next();
    else if (a === '--source') out.source = next();
    else if (a === '--out') out.out = next();
    else if (a === '--summary') out.summary = next();
    else if (!a.startsWith('--') && !out.runDir) out.runDir = a;
    else throw new Error(`unknown argument ${a}`);
  }
  return out;
}

/** Parse `aad.mjs verify` stdout: `<case> <PASS|FAIL> <n>/<m> envelopes`. */
function parseVerifyLog(path) {
  if (!path || !existsSync(path)) return { checksums: null, perCase: new Map() };
  const perCase = new Map();
  let failures = 0;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^(\S+)\s+(PASS|FAIL|MISSING)\s+(\d+)\/(\d+) envelopes\s*$/);
    if (m) {
      perCase.set(m[1], { outcome: m[2], envelopes: Number(m[3]), total: Number(m[4]) });
      if (m[2] !== 'PASS') failures += 1;
      continue;
    }
    if (/^\d+ failure\(s\)$/.test(line.trim())) failures = Math.max(failures, 1);
  }
  return { checksums: failures === 0 && perCase.size > 0 ? 'pass' : 'fail', perCase };
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function build(args) {
  const runDir = resolve(args.runDir);
  const manifestPath = join(runDir, 'MANIFEST.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`No MANIFEST.json in ${runDir}. Pass the runs/<run-id> directory the kit sealed.`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schema !== 'proofable-aad-run-manifest/v1') {
    throw new Error(`Unexpected manifest schema ${JSON.stringify(manifest.schema)}; expected proofable-aad-run-manifest/v1.`);
  }

  const expected = Array.isArray(manifest.expected_cases) ? manifest.expected_cases : [];
  const manifestRows = new Map(
    (Array.isArray(manifest.cases) ? manifest.cases : []).map((row) => [String(row.case), row]),
  );
  const errorFiles = new Set(
    (Array.isArray(manifest.errors) ? manifest.errors : []).map((name) => String(name).replace(/\.error\.json$/, '')),
  );
  const verify = parseVerifyLog(args.verifyLog);

  const cases = expected.map((name) => {
    const row = manifestRows.get(name);
    const verified = verify.perCase.get(name);
    const evidenceFile = join(runDir, `${name}.json`);
    const record = existsSync(evidenceFile) ? JSON.parse(readFileSync(evidenceFile, 'utf8')) : null;
    let outcome = 'not-run';
    if (errorFiles.has(name)) outcome = 'error';
    else if (row) outcome = row.passed ? 'pass' : 'fail';
    if (verified && verified.outcome !== 'PASS' && outcome === 'pass') {
      // The seal disagreed with the verdict: the stricter reading wins.
      outcome = 'fail';
    }
    return {
      case: name,
      outcome,
      job_id: row?.jobId ? String(row.jobId) : null,
      evidence: record?.receipt?.qHash ? String(record.receipt.qHash) : (existsSync(evidenceFile) ? basename(evidenceFile) : null),
      note: verified ? `${verified.envelopes}/${verified.total} envelopes verified offline` : null,
    };
  });

  const passed = cases.filter((c) => c.outcome === 'pass').length;
  const failed = cases.filter((c) => c.outcome === 'fail' || c.outcome === 'error').length;
  const total = cases.length;

  const envelopesVerified = [...verify.perCase.values()].reduce((sum, row) => sum + row.envelopes, 0);
  const envelopesTotal = [...verify.perCase.values()].reduce((sum, row) => sum + row.total, 0);

  const assets = new Map();
  for (const name of readdirSync(runDir).sort()) {
    if (!/\.(json|md|SHA256SUMS)$/.test(name) && !name.endsWith('SHA256SUMS')) continue;
    assets.set(name, sha256(readFileSync(join(runDir, name))));
  }

  const seen = new Set();
  const notMeasured = [];
  for (const row of [
    ...(Array.isArray(manifest.not_measured) ? manifest.not_measured : []),
    ...NOT_MEASURED,
  ]) {
    const key = String(row).toLowerCase().split('(')[0].trim();
    if (seen.has(key)) continue;
    seen.add(key);
    notMeasured.push(String(row));
  }

  return {
    schema: 'trustharness.report/v1',
    arm: 'self-run',
    generated_at: new Date().toISOString(),
    instrument: {
      kit: manifest.schema,
      kit_url: 'https://docs.proofable.me/evidence',
      kit_commit: String(process.env.PROOFABLE_KIT_COMMIT || '').trim() || null,
      run_id: manifest.run_id ? String(manifest.run_id) : null,
    },
    subject: {
      operator: String(process.env.AAD_OPERATOR || manifest.custody || '').trim() || 'unknown',
      agent_id: manifest.agentId ? String(manifest.agentId) : null,
      agent_wallet: manifest.agentWallet ? String(manifest.agentWallet) : null,
      controller: String(manifest.delegationRoot || '').split(':').pop() || null,
      product_revision: manifest.product_revision ? String(manifest.product_revision) : null,
      source: args.source || null,
    },
    authority: {
      cases,
      passed,
      total,
      unauthorized_actions_through: failed,
    },
    integrity: {
      checksums: verify.checksums || 'fail',
      envelopes_verified: Number.isFinite(envelopesVerified) ? envelopesVerified : null,
      envelopes_total: Number.isFinite(envelopesTotal) ? envelopesTotal : null,
    },
    cost: COST_ROWS,
    gaps: [],
    not_measured: notMeasured,
    limits: [
      'One run on the operator\'s own account: a sample, not a rate.',
      'Measures the decision the service returned for each case and whether a record verified offline; not the target system\'s committed effect.',
      'Self-run: the operator drove the run. An independent rerun is the next tier, not this one.',
      'Scope and comparison figures live on the evidence page; this report does not restate them.',
    ],
    evidence_url: 'https://docs.proofable.me/evidence',
    assets: Object.fromEntries(assets),
  };
}

function summaryMarkdown(report) {
  const lines = [
    `## Proofable trust harness — ${report.authority.passed} of ${report.authority.total} authority cases passed`,
    '',
    `Arm: **self-run** · operator: **${report.subject.operator}** · revision: \`${report.subject.product_revision || 'unknown'}\` · run \`${report.instrument.run_id || 'unknown'}\``,
    '',
    '| Case | Outcome | Offline check |',
    '| --- | --- | --- |',
    ...report.authority.cases.map(
      (c) => `| \`${c.case}\` | ${c.outcome} | ${c.note || '—'} |`,
    ),
    '',
    `Sealed records: **${report.integrity.checksums}** · envelopes verified offline: **${report.integrity.envelopes_verified ?? '—'}/${report.integrity.envelopes_total ?? '—'}**`,
    '',
    'Not measured here:',
    ...report.not_measured.map((row) => `- ${row}`),
    '',
    `Comparisons and their scope: ${report.evidence_url}`,
  ];
  return `${lines.join('\n')}\n`;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (!args.runDir) throw new Error('usage: node report.mjs <run-dir> [--verify-log <file>] [--source <url>] [--out <file>] [--summary <file>]');
  const report = build(args);
  const outPath = args.out || 'proofable-report.json';
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (args.summary) {
    mkdirSync(dirname(resolve(args.summary)), { recursive: true });
    writeFileSync(args.summary, summaryMarkdown(report), 'utf8');
  }
  console.log(`report ${outPath}: ${report.authority.passed}/${report.authority.total} passed, seals ${report.integrity.checksums}`);
  process.exitCode = report.authority.passed === report.authority.total ? 0 : 2;
} catch (error) {
  console.error(`report failed: ${error?.message || error}`);
  process.exitCode = 1;
}
