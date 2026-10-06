# Proofable — issue #13 implementation row

**Implementation:** Proofable — evaluates delegated authority at dispatch and records decision,
execution/effect state, terminal outcome and receipt separately.
**Revision:** `f92faf39a4bae480cca3e5c07ce2c95d6ab68411` (live production hosted MCP). **Principal:** `0x0d4e513a3a7eb92bab65c97786c67b198d9dca15` — ordinary
non-admin Pro review tenant (`admin:false`). **Agent:** `proofable-authority-review` under a controller-signed
allow-list delegation; every job pins an explicit `delegationQHash`. **Custody:** SELF.

| Case | Dispatch decision | Dispatch | Committed effect | Task outcome | Receipt (private) |
| --- | --- | --- | --- | --- | --- |
| hosted_allow | ALLOW | dispatched | observed_at_platform | 0x9afe5eb5ff… |
| binding_veto | DENY (JOB_AUTHORITY_DENIED) | dispatched | none_no_executor | 0x11d0d791fa… |
| approval_reachable | STEP_UP | dispatched | observed_at_platform | 0xd2cc254414… |
| approval_unavailable | STEP_UP (Cancelled by owner) | dispatched | none_cancelled | 0x06ee384be0… |
| revoke_before_dispatch | DENY (DELEGATION_PROOF_DENIED) | no job | none_no_dispatch | — |
| expiry_before_dispatch | DENY (DELEGATION_PROOF_DENIED) | no job | none_no_dispatch | — |
| stale_authority | DENY (DELEGATION_PROOF_DENIED) | no job | none_no_dispatch | — |
| post_dispatch_revoke | ALLOW | dispatched | observed_at_platform | 0xdfda8a13f5… |

**Authority / freshness.** Authority is a controller-signed allow-list delegation evaluated at
dispatch from current proof state; freshness is delegation expiry, revocation and supersession.
Proofable is **not** root-based, so root heights / root age are `not_applicable` rather than unknown.

**Committed-effect evidence level:** platform terminal state (job record). There is no independent
target-side effect byte, and a denied dispatch persists no pre-dispatch signed decision record
(named gap R5). Custody is SELF: author-operated, no independent peer witness. This is bounded
implementation evidence — not AAIF certification or conformance, not a matched experiment, not
independently reproduced.
