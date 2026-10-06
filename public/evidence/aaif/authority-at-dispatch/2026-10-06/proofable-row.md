# Proofable — issue #13 implementation row

**Implementation:** Proofable — evaluates delegated authority at dispatch and records the decision,
dispatch, committed effect, terminal outcome and receipt as **separate** states.
**Revision:** `f92faf39a4bae480cca3e5c07ce2c95d6ab68411` (live production hosted MCP). **Principal:** `0x0d4e513a3a7eb92bab65c97786c67b198d9dca15` — ordinary
non-admin Pro review tenant (`admin:false`). **Agent:** `proofable-authority-review` under a controller-signed
allow-list delegation; every job pins an explicit `delegationQHash`. **Custody:** SELF.

## Vlad's four matched cases

| Case | Decision | Dispatch | Committed effect | Terminal | Status |
| --- | --- | --- | --- | --- | --- |
| Binding veto | DENY (JOB_AUTHORITY_DENIED) | refused pre-executor | none_no_executor | failed | PARTIALLY_OBSERVED |
| Revoked authority + stale evidence | DENY (DELEGATION_PROOF_DENIED); control ALLOW | revoked: no job; control: dispatched | none_no_dispatch | n/a | SUPPORTED_AND_OBSERVED |
| Authority/verifier unreachable | not_applicable_current_path | not attempted | not_applicable | n/a | NOT_APPLICABLE_CURRENT_PATH |
| Revocation after dispatch | ALLOW at dispatch; revoked in flight | dispatched | observed_at_platform | completed | PARTIALLY_OBSERVED |

**Authority / freshness.** Controller-signed allow-list delegation evaluated at dispatch from current
proof state; freshness is delegation expiry, revocation and supersession. Proofable is **not**
root-based, so root heights / root age are `not_applicable` rather than unknown.

**Case 3 — NOT_APPLICABLE_CURRENT_PATH.** Proofable evaluates authority from current local authority
state at dispatch. The current path has no remote authority/verifier dependency to make unavailable.
A remote-authority outage remains a separate joint comparison and is not inferred as passing.

**Committed-effect evidence level:** platform terminal state (`platform_observed_only`). There is no
independent target-side effect byte, and a denied dispatch persists no pre-dispatch signed decision
record (named gap R5). Custody is SELF: author-operated, no independent peer witness. This is
implementation-owned evidence — not AAIF certification or WG conformance, not an independently
operated run.
