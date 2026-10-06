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
| Authority/verifier unreachable | not applicable to this path | not attempted | not_applicable | n/a | NOT_APPLICABLE (see note) |
| Revocation after dispatch | ALLOW at dispatch; revoked in flight | dispatched | observed_at_platform | completed | PARTIALLY_OBSERVED |

**Authority / freshness.** Controller-signed allow-list delegation evaluated at dispatch from current
proof state; freshness is delegation expiry, revocation and supersession. Proofable is **not**
root-based, so root heights / root age are `not_applicable` rather than unknown.

**Unreachable-authority note.** Proofable's dispatch authority reads the **local** proof store, not a
remote authority/verifier service. The engine has a modeled fail-closed gateway branch
(`gatewayReachable=false` → `GATEWAY_UNREACHABLE` → `DENY`), but that is an engine input, not a live
remote dependency, so there is no live outage on this path to exercise. A genuine remote-unreachable
comparison needs the peer harness with a real remote status source — the joint-run item. Reported
`NOT_APPLICABLE` to the current architecture, not inferred as passing.

**Committed-effect evidence level:** platform terminal state (`platform_observed_only`). There is no
independent target-side effect byte, and a denied dispatch persists no pre-dispatch signed decision
record (named gap R5). Custody is SELF: author-operated, no independent peer witness. This is
implementation-owned evidence — not AAIF certification or WG conformance, not an independently
operated run.
