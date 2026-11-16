// Check every receipt from this run yourself, with no account.
//
//   npm install
//   node check.mjs              # read each receipt by id (5 times), then verify its signature offline (10 times)
//   node check.mjs --offline    # verify the saved envelopes in receipts/ only; no network at all
//
// No model runs, so a check costs zero AI tokens. Prints the median time per receipt and across all of them.
import { readFileSync } from 'node:fs';
import { verifyPortableProofEnvelope } from '@proofable/sdk';

const API = 'https://api.proofable.me';
const offline = process.argv.includes('--offline');
const receipts = readFileSync(new URL('./receipts.txt', import.meta.url), 'utf8').split(/\s+/).filter((q) => /^0x[0-9a-f]{64}$/.test(q));
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

const readMedians = [];
const verifyMedians = [];
let invalid = 0;
for (const qHash of receipts) {
  let envelope = null;
  const readMs = [];
  if (offline) {
    envelope = JSON.parse(readFileSync(new URL(`./receipts/${qHash}.json`, import.meta.url), 'utf8'));
  } else {
    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      const res = await fetch(`${API}/api/v1/proofs/${qHash}?includePortableProof=1`, { headers: { accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      readMs.push(performance.now() - t0);
      envelope = body?.data?.portableProof || envelope;
    }
  }
  if (!envelope) {
    console.log(`${qHash}  no disclosed record`);
    invalid += 1;
    continue;
  }
  const verifyMs = [];
  let valid = true;
  for (let i = 0; i < 10; i += 1) {
    const t0 = performance.now();
    valid = (await verifyPortableProofEnvelope(envelope))?.valid === true && valid;
    verifyMs.push(performance.now() - t0);
  }
  if (!valid) invalid += 1;
  verifyMedians.push(median(verifyMs));
  if (readMs.length) readMedians.push(median(readMs));
  console.log(`${qHash}  valid=${valid ? 'yes' : 'NO'}  ${readMs.length ? `read ${median(readMs).toFixed(0)} ms  ` : ''}verify ${median(verifyMs).toFixed(2)} ms`);
}

console.log(`\n${receipts.length} receipts, ${receipts.length - invalid} valid`);
if (readMedians.length) console.log(`Read by id, no account: ${median(readMedians).toFixed(0)} ms median`);
console.log(`Verify offline: ${median(verifyMedians).toFixed(2)} ms median`);
console.log('AI tokens used: 0');
if (invalid) process.exitCode = 1;
