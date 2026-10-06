# Proofable — matched four-case results (shared authority/effect contract)

Proofable's implementation-owned records for Vlad's four matched cases, expressed under the shared
contract ([`probityai/agent-evidence-observer`](https://github.com/probityai/agent-evidence-observer)
`fb8cabc5c9c54459743497f2325bfef49b137a1a`, `interop/authority-unreachable-2026-10-03/CONTRACT.md`).
Deployed revision: `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`. Custody: **SELF** (author-operated). This is not a
joint/independently-operated run, and it is not WG conformance.

| Case | Decision | Dispatch | Observed effect | Terminal | Status |
| --- | --- | --- | --- | --- | --- |
| binding_veto | DENY | attempted (refused pre-executor) | none_no_executor (none) | failed | PARTIALLY_OBSERVED |
| revoked_stale | DENY | revoked: no job; never-revoked control: dispatched | none_no_executor (none) | unknown | SUPPORTED_AND_OBSERVED |
| unreachable | unknown | not attempted (no remote dependency) | unknown (none) | unknown | NOT_DEMONSTRATED |
| post_dispatch_revoke | ALLOW | dispatched, then revoked in flight | observed_at_platform (platform_observed_only) | completed | PARTIALLY_OBSERVED |

## Boundary kept explicit

**decision → dispatch → committed effect → terminal outcome → receipt/evidence.** In Proofable these
are distinct states; collapsing them would hide the failure modes this test exists to expose.

### Case 3 — authority/verifier unreachable (resolved, not demonstrated)

Proofable's dispatch authority reads the **local proof store**, not a remote authority/verifier
service. The engine has a modeled fail-closed gateway branch (`gatewayReachable=false` →
`GATEWAY_UNREACHABLE` → `DENY`), but that is an engine input, not a live remote dependency, so there
is no live outage on this path to exercise. A genuine remote-authority-unreachable comparison needs a
real remote status source in the peer harness — the joint-run item. Reported **NOT_APPLICABLE** to the
current architecture, not inferred as passing.

### Target-side effect evidence

No task return is used as proof of a committed effect. Where only Proofable platform state exists, the
record states `platform_observed_only`. No independent target-side readback is claimed.
