# Proofable — Authority-at-Dispatch Evidence

Proofable's implementation evidence for the authority/effect comparison associated with
[AAIF Identity & Trust issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13).

## Current evidence

| | |
| --- | --- |
| **Current packet** | [`2026-10-08/`](./2026-10-08/) — deployed revision `e1217327a1568b39d5153686b8085471b5329cde` |
| Evidence commit | [`proofable/docs` `bbd7ee6`](https://github.com/proofable/docs/tree/bbd7ee67b8d15557b032c8724cbbc4c4f0d14bce/public/evidence/aaif/authority-at-dispatch/2026-10-08) |
| Reviewer handoff | [`reviewer-handoff-2026-10-08/`](./reviewer-handoff-2026-10-08/) — minimal patches so the upstream reader implementations appraise this packet |
| Historical | [`2026-10-06/`](./2026-10-06/) — superseded; its trace digest could not match its own bytes |

## What each packet contains

Eight sanitized trace records, a machine-readable manifest, the results under the shared
authority/effect contract, the disclosed CAIP-380 portable envelopes, an offline verifier, and
`SHA256SUMS`. Every file is LF-only, and every digest is computed over the published bytes, so
`sha256sum -c SHA256SUMS` succeeds on the committed files.

## Reader path

1. Recompute the SHA-256 of `trace.jsonl` and compare with `manifest.json` → `public_trace.sha256`.
2. Verify every envelope offline: `node verify-portable-proofs.mjs` with `@proofable/sdk` installed.
3. Re-fetch and re-verify the pinned bytes with the peer readers using `reviewer-handoff-2026-10-08/`.

## Scope

Author-operated (SELF): the producer is the same organization as the reporter, and there is no
independent witness. This is implementation evidence for the #13 comparison — not AAIF certification,
WG conformance, an AARM rank, or independent target-side effect custody. Independent reproduction is
not claimed, and revocation latency is not measured.
