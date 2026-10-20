// Time what it costs a stranger to reuse a finished, signed result instead of redoing the work.
// Reads the record by its id with no account, then verifies its signature offline, ten times each.
//
//   npm install
//   node reuse-check.mjs                 # the published receipt on the evidence page
//   node reuse-check.mjs 0x<qHash>       # any disclosed record
//
// No model runs and no account is used, so a reused check costs zero AI tokens.
import { verifyPortableProofEnvelope } from '@proofable/sdk';

const API = 'https://api.proofable.me';
const DEFAULT_RECEIPT = '0xcf67dcc3cc9c203136daf9905a422601652fd76cce437e2cbf56967e3a8117e6';
const RUNS = 10;
const qHash = String(process.argv[2] || DEFAULT_RECEIPT).toLowerCase();
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

const readMs = [];
let record = null;
for (let i = 0; i < RUNS; i += 1) {
  const t0 = performance.now();
  const res = await fetch(`${API}/api/v1/proofs/${qHash}?includePortableProof=1`, { headers: { accept: 'application/json' } });
  const body = await res.json().catch(() => null);
  readMs.push(performance.now() - t0);
  record = body?.data?.portableProof || record;
}
if (!record) {
  console.error(`${qHash} has no disclosed signed record, so it cannot be checked without an account.`);
  process.exit(1);
}

const verifyMs = [];
let valid = false;
for (let i = 0; i < RUNS; i += 1) {
  const t0 = performance.now();
  valid = (await verifyPortableProofEnvelope(record))?.valid === true;
  verifyMs.push(performance.now() - t0);
}

console.log(`Record ${qHash}`);
console.log(`Signature valid offline: ${valid ? 'yes' : 'no'}`);
console.log(`Read by id, no account: ${median(readMs).toFixed(0)} ms median over ${RUNS}`);
console.log(`Verify offline: ${median(verifyMs).toFixed(1)} ms median over ${RUNS}`);
console.log('AI tokens used: 0');
if (!valid) process.exitCode = 1;
