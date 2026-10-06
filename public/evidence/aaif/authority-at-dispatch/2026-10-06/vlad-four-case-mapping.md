# Proofable ↔ Vlad's four matched cases

| Case | Proofable support | Decision evidence | Dispatch evidence | Effect evidence | Receipt/evidence | Residual risk |
| --- | --- | --- | --- | --- | --- | --- |
| Binding veto | PARTIALLY_OBSERVED | DENY before executor assigned (grant omits run_command) | dispatched, refused pre-executor | none_no_executor (not independently witnessed) | private terminal receipt | No independent target-side effect byte. |
| Revoked authority + stale evidence | SUPPORTED_AND_OBSERVED | DENY (DELEGATION_PROOF_DENIED); never-revoked control accepted | no job created | none_no_dispatch | n/a (no job) | Proofable is not root-based; no stale-witness rollover to time. |
| Authority/verifier unreachable | NOT_DEMONSTRATED | unknown | unknown | unknown | n/a | Fail-closed branch exists but the case is not exercised live; intended for the matched run. |
| Revocation after dispatch | PARTIALLY_OBSERVED | ALLOW at dispatch; grant revoked in flight | dispatched | observed_at_platform | private terminal receipt | Effect is platform-observed, not an independent target byte. |

Boundaries kept separate per Vlad's contract: **decision → dispatch → committed effect → terminal
outcome → receipt/evidence**. `PARTIALLY_OBSERVED` means the platform observes the boundary but no
independent target-side witness exists. `NOT_DEMONSTRATED` (authority unreachable) is reported as
`unknown`, not as a pass.
