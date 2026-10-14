# Proofable — Authority-at-Dispatch Evidence

Proofable's implementation evidence for the authority/effect comparison associated with
[AAIF Identity & Trust issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13).

## Current evidence

| | |
| --- | --- |
| **Current packet** | [`2026-10-08-eight-case/`](./2026-10-08-eight-case/) — all eight cases of run `aaif-e1217327a-20261008`, deployed revision `e1217327a1568b39d5153686b8085471b5329cde`, with the contract v1 trace fields |
| **Reproduce it** | [`reproduce/`](./reproduce/) — run the same cases against the live hosted service under your own Proofable account, then verify the records offline |
| Reviewer handoff | [`reviewer-handoff-2026-10-14/`](./reviewer-handoff-2026-10-14/) — one-line reader patch so the ProbityAI reader accepts a packet with more than 11 envelopes |
| Previous packet | [`2026-10-08/`](./2026-10-08/) at [`proofable/docs` `9851059`](https://github.com/proofable/docs/tree/9851059900e29ba701bb0f4df2bf89a2107f430c/public/evidence/aaif/authority-at-dispatch/2026-10-08) — same run, six of the eight cases; unchanged |
| Historical | [`2026-10-06/`](./2026-10-06/) — superseded; its trace digest could not match its own bytes |

## What the current packet adds

The previous packet published six of the eight suite cases and reported only the remote-authority
variant of "authority unavailable", as not applicable. The current packet adds the two approval cases,
which are the working group's case 4 (human approver unavailable) and its control:

- `approval_unavailable`: the job is decided `STEP_UP` at dispatch and held with no executor; nobody
  approves; the hold ends without execution; an approval sent afterwards is refused
  (`JOB_APPROVAL_STATE_CHANGED`).
- `approval_reachable`: the same kind of job is approved and completes with a verified receipt.

Every trace record also carries `contractId`, `evidenceAgeSeconds`, `freshnessLimitSeconds`,
`delegationRoot` and `delegationHops` from contract v1 (ProbityAI `c897659`). Eight trace records,
15 disclosed CAIP-380 envelopes, LF-only bytes, and `SHA256SUMS` computed over the published bytes.

## Reader path

1. `sha256sum -c SHA256SUMS` in the packet directory.
2. Verify every envelope offline: `node verify-portable-proofs.mjs` with `@proofable/sdk` installed.
3. Run the ProbityAI reader (`implementation_records.read_proofable`) with the one-line patch in
   `reviewer-handoff-2026-10-14/`.
4. Reproduce the cases yourself with `reproduce/`.

## Scope

The packets are author-operated (SELF): the producer is the same organization as the reporter, and
there is no independent witness. A run made with `reproduce/` is custodied by its operator. This is
implementation evidence for the #13 comparison — not AAIF certification, WG conformance, an AARM rank,
or independent target-side effect custody. Revocation latency is not measured.
