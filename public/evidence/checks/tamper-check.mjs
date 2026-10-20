// Forge every signed record in a packet ten different ways and check each copy offline.
// A genuine record must verify; every forged copy must be rejected.
//
//   npm install
//   node tamper-check.mjs                       # the 2026-10-08 production packet
//   node tamper-check.mjs path/to/portable-proofs.json
//
// No network and no account: verification uses only the public SDK and the record itself.
import { readFileSync } from 'node:fs';
import { verifyPortableProofEnvelope } from '@proofable/sdk';

const DEFAULT_PACKET = new URL('../aaif/authority-at-dispatch/2026-10-08-eight-case/portable-proofs.json', import.meta.url);
const source = process.argv[2] || DEFAULT_PACKET;
const records = JSON.parse(readFileSync(source, 'utf8'));

const otherAddress = '0x000000000000000000000000000000000000dEaD';
const flipHexChar = (s, at) => {
  const i = Math.min(Math.max(at, 2), s.length - 1);
  return s.slice(0, i) + (s[i].toLowerCase() === 'a' ? 'b' : 'a') + s.slice(i + 1);
};

// Each forgery changes one thing a reader would rely on.
const FORGERIES = {
  'edit the content': (r) => {
    if (typeof r.data?.content === 'string') r.data.content = r.data.content.replace(/[a-z]/, (m) => (m === 'z' ? 'y' : String.fromCharCode(m.charCodeAt(0) + 1)));
    else r.data = { ...r.data, injected: true };
  },
  'swap the owner': (r) => {
    r.data.owner = otherAddress;
  },
  'impersonate the signer': (r) => {
    r.walletAddress = otherAddress.toLowerCase();
    r.did = r.did.replace(/0x[0-9a-fA-F]{40}$/, otherAddress.toLowerCase());
  },
  'backdate the timestamp': (r) => {
    r.signedTimestamp -= 86_400_000;
  },
  'change the chain': (r) => {
    r.chainId = r.chainId === 1 ? 8453 : 1;
  },
  'upgrade the check type': (r) => {
    r.verifierIds = ['proof-of-human'];
  },
  'redirect the reference': (r) => {
    if (r.data?.reference?.id) r.data.reference.id = `${r.data.reference.id}-forged`;
    else r.data.reference = { type: 'url', id: 'https://example.invalid/forged' };
  },
  'flip one signature bit': (r) => {
    r.signature = flipHexChar(r.signature, 40);
  },
  'replay another record id': (r, other) => {
    r.qHash = other.qHash;
  },
  'transplant another signature': (r, other) => {
    r.signature = other.signature;
  },
};

const verifies = async (record) => {
  try {
    return (await verifyPortableProofEnvelope(record))?.valid === true;
  } catch {
    return false;
  }
};

let genuineAccepted = 0;
for (const r of records) if (await verifies(structuredClone(r))) genuineAccepted += 1;

const rows = [];
for (const [forgery, apply] of Object.entries(FORGERIES)) {
  let attempts = 0;
  let caught = 0;
  for (let i = 0; i < records.length; i += 1) {
    const original = records[i];
    const other = records.find((x) => x.qHash !== original.qHash && x.signature !== original.signature) || records[(i + 1) % records.length];
    const forged = structuredClone(original);
    apply(forged, other);
    if (JSON.stringify(forged) === JSON.stringify(original)) continue;
    attempts += 1;
    if (!(await verifies(forged))) caught += 1;
  }
  rows.push({ forgery, attempts, caught });
}

const attempts = rows.reduce((n, r) => n + r.attempts, 0);
const caught = rows.reduce((n, r) => n + r.caught, 0);

console.log(`Genuine records accepted: ${genuineAccepted} of ${records.length}`);
console.log('');
console.log('| Forgery | Copies | Caught |');
console.log('| --- | ---: | ---: |');
for (const r of rows) console.log(`| ${r.forgery} | ${r.attempts} | ${r.caught} |`);
console.log(`| **Total** | **${attempts}** | **${caught}** |`);

if (genuineAccepted !== records.length || caught !== attempts) process.exitCode = 1;
