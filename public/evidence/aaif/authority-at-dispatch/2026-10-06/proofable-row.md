# Proofable — issue #13 implementation row

**Implementation:** Proofable — evaluates delegated authority at dispatch and produces a verifiable
protocol receipt that keeps the authorization decision, dispatch, resulting effect/outcome, and
receipt evidence distinct.

**Revision:** `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`.
**Environment:** live production hosted MCP. **Principal:** ordinary non-admin Pro review tenant
(`admin:false`). **Agent:** `proofable-authority-review` under an explicit pinned delegation per case.
**Custody:** SELF (author-operated).

## Four-case results

| Case | Proofable result |
| --- | --- |
| Binding veto | **SUPPORTED** — unauthorized execution is denied before executor assignment |
| Revoked authority / stale grant | **SUPPORTED** — revoked authority is denied while the valid control remains accepted |
| Remote authority unreachable | **NOT APPLICABLE TO CURRENT PATH** — dispatch authority is evaluated from Proofable's current authority state rather than a remote authorization dependency |
| Revocation after dispatch | **SUPPORTED** — dispatch, subsequent revocation, resulting effect/outcome, and receipt remain separate and attributable |

**Protocol boundary:** authority → decision → dispatch → effect/outcome → receipt. These are distinct
states; collapsing them would treat a failed task as evidence that no effect committed, or a later
denial as retroactively preventing an earlier effect.

**Evidence scope:** Proofable protocol records decision, dispatch, effect state, terminal outcome, and
receipt. This run was author-operated and has not yet been independently reproduced. External
target-side witnessing was not part of this run.

This is implementation-owned evidence for the comparison in #13 — not AAIF certification or WG
conformance.
