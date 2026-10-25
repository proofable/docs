// Offline checks for this packet. No account and no network.
//   npm install ethers@6
//   node verify.mjs
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';

const here = dirname(fileURLToPath(import.meta.url));
const text = (f) => readFileSync(join(here, f), 'utf8');
const json = (f) => JSON.parse(text(f));

const request = json('2-request-arguments.json');
const createResponse = JSON.parse(
  text('3-create-response.txt').split('\n').find((line) => line.startsWith('data: ')).slice(6),
).result.structuredContent;
const decision = json('4-dispatch-decision.json').data.proofs[0].portableProof;
const receipt = json('6-terminal-receipt.json').data.proofs[0].portableProof;
const decisionContent = JSON.parse(decision.data.content);
const receiptContent = JSON.parse(receipt.data.content);

let failed = 0;
const report = (label, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'MATCH   ' : 'NO MATCH'} ${label}${detail ? `  ${detail}` : ''}`);
};

// CAIP-380 canonical JSON: keys sorted, no whitespace.
const canonical = (v) => v === null || typeof v !== 'object' ? JSON.stringify(v)
  : Array.isArray(v) ? `[${v.map(canonical).join(',')}]`
  : `{${Object.keys(v).map((k) => k.normalize('NFC')).sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;

// 1. Each envelope: the EIP-191 signature recovers to its walletAddress, and the qHash recomputes.
for (const [name, env] of [['dispatch decision', decision], ['terminal receipt', receipt]]) {
  const message = [
    'Portable Proof Verification Request',
    `Wallet: ${env.walletAddress}`,
    `Chain: ${env.chainId}`,
    `Verifiers: ${env.verifierIds.join(',')}`,
    `Data: ${canonical(env.data)}`,
    `Timestamp: ${env.signedTimestamp}`,
  ].join('\n').normalize('NFC');
  const signer = ethers.verifyMessage(message, env.signature);
  report(`${name}: signature recovers to ${env.walletAddress}`,
    signer.toLowerCase() === env.walletAddress.toLowerCase(), `recovered ${signer}`);
  const subset = { did: env.did, verifierIds: env.verifierIds, data: env.data,
    signedTimestamp: env.signedTimestamp, chainId: env.chainId };
  const qHash = `0x${createHash('shake256', { outputLength: 32 }).update(canonical(subset)).digest('hex')}`;
  report(`${name}: qHash recomputes`, qHash.toLowerCase() === env.qHash.toLowerCase(), qHash);
}

// 2. argsDigest: SHA-256 over a fixed projection of the request, in this key order.
//    Fields outside the projection (runNowFirst, the criteria alias) are not committed.
const argsDigest = (fields) => createHash('sha256').update(JSON.stringify({
  agentId: fields.agentId,
  agentWallet: fields.agentWallet.toLowerCase(),
  prompt: fields.prompt,
  runtime: fields.runtime ?? null,
  requiresJobApproval: fields.requiresJobApproval === true,
  acceptance: { criterion: fields.acceptance.criterion, mode: fields.acceptance.mode },
})).digest('hex');

report('argsDigest from the request arguments', argsDigest(request) === decisionContent.argsDigest,
  decisionContent.argsDigest);

// 3. The same digest from the fields the signed receipt carries. The receipt does not carry
//    runtime or requiresJobApproval, so their absent-request defaults (null, false) are used.
report('argsDigest from the terminal receipt fields', argsDigest(receiptContent) === decisionContent.argsDigest);

// 4. The ties that rest on the unsigned create response.
report('create response decision qHash equals the decision envelope',
  createResponse.authorityDecisionQHash === decision.qHash);
report('create response jobId equals the jobId inside the signed receipt',
  createResponse.jobId === receiptContent.jobId, receiptContent.jobId);
console.log(`decision jobId field: ${JSON.stringify(decisionContent.jobId)} (recorded before the job exists)`);

process.exitCode = failed ? 1 : 0;
