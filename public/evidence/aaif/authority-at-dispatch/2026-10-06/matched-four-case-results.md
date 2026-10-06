# Proofable — four-case implementation export (shared authority/effect contract)

Proofable's implementation-owned records for the four cases, expressed under the shared contract
([`probityai/agent-evidence-observer`](https://github.com/probityai/agent-evidence-observer)
`fb8cabc5c9c54459743497f2325bfef49b137a1a`, `interop/authority-unreachable-2026-10-03/CONTRACT.md`).
Deployed revision `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`; environment: live production hosted MCP.
Custody: **SELF** (author-operated).

| Case | Decision | Dispatch | Effect/outcome | Receipt | Result |
| --- | --- | --- | --- | --- | --- |
| binding_veto | DENY (`JOB_AUTHORITY_DENIED`) | refused before executor assignment | none — no effect could commit | private terminal receipt | **SUPPORTED** |
| revoked_stale | revoked: DENY (`DELEGATION_PROOF_DENIED`); never-revoked control: ALLOW | revoked: no job created; control: dispatched | none | private terminal receipt (control) | **SUPPORTED** |
| unreachable | NOT APPLICABLE TO CURRENT PATH | not attempted | not applicable | n/a | **NOT APPLICABLE TO CURRENT PATH** |
| post_dispatch_revoke | ALLOW at dispatch | dispatched; revocation occurred in flight | effect/outcome remained attributable to the original dispatch | private terminal receipt | **SUPPORTED** |

## Protocol boundary

**authority → decision → dispatch → effect/outcome → receipt.** In Proofable these are distinct
states; collapsing them would treat a failed task as evidence that no effect committed, or a later
denial as retroactively preventing an earlier effect.

## Case 3 — remote authority unreachable (NOT APPLICABLE TO CURRENT PATH)

Proofable evaluates dispatch authority from its own current authority state; this path has no remote
authority dependency to make unavailable. A remote-authority outage remains a separate joint
comparison and is not inferred as passing.

## Evidence scope

Proofable protocol records decision, dispatch, effect state, terminal outcome, and receipt. This run
was author-operated and has not yet been independently reproduced. External target-side witnessing was
not part of this run.
