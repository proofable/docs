# Proofable — four-case implementation export (shared authority/effect contract)

Proofable's implementation-owned records for Vlad's four cases, expressed under the shared
contract ([`probityai/agent-evidence-observer`](https://github.com/probityai/agent-evidence-observer)
`fb8cabc5c9c54459743497f2325bfef49b137a1a`, `interop/authority-unreachable-2026-10-03/CONTRACT.md`).
Deployed revision: `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`. Custody: **SELF** (author-operated). This is not a
joint/independently-operated run, and it is not WG conformance.

| Case | Decision | Dispatch | Observed effect | Terminal | Status |
| --- | --- | --- | --- | --- | --- |
| binding_veto | DENY | attempted (refused pre-executor) | none_no_executor (none) | failed | PARTIALLY_OBSERVED |
| revoked_stale | DENY | revoked: no job; never-revoked control: dispatched | none_no_executor (none) | unknown | SUPPORTED_AND_OBSERVED |
| unreachable | not_applicable_current_path | not attempted (no remote dependency) | not_applicable | n/a | NOT_APPLICABLE_CURRENT_PATH |
| post_dispatch_revoke | ALLOW | dispatched, then revoked in flight | observed_at_platform (platform_observed_only) | completed | PARTIALLY_OBSERVED |

## Boundary kept explicit

**decision → dispatch → committed effect → terminal outcome → receipt/evidence.** In Proofable these
are distinct states; collapsing them would hide the failure modes this test exists to expose.

### Case 3 — NOT_APPLICABLE_CURRENT_PATH

Proofable evaluates authority from current local authority state at dispatch. The current path has no
remote authority/verifier dependency to make unavailable. A remote-authority outage remains a separate
joint comparison and is not inferred as passing.

### Target-side effect evidence

No task return is used as proof of a committed effect. Where only Proofable platform state exists, the
record states `platform_observed_only`. No independent target-side readback is claimed.
