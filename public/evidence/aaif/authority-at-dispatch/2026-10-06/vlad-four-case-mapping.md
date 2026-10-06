# Proofable — four-case implementation export (shared authority/effect contract)

| Case | Proofable support | Decision evidence | Dispatch evidence | Effect evidence | Receipt/evidence | Residual risk |
| --- | --- | --- | --- | --- | --- | --- |
| Binding veto | PARTIALLY_OBSERVED | DENY before executor assigned (grant omits run_command) | dispatched, refused pre-executor | none_no_executor (not independently witnessed) | private terminal receipt | No independent target-side effect byte. |
| Revoked authority + stale evidence | SUPPORTED_AND_OBSERVED | DENY (DELEGATION_PROOF_DENIED); never-revoked control accepted | no job created | none_no_dispatch | n/a (no job) | Proofable is not root-based; no stale-witness rollover to time. |
| Authority/verifier unreachable | NOT_APPLICABLE_CURRENT_PATH | not_applicable_current_path | not attempted | not_applicable | n/a | No remote authority dependency exists on this path; remote-unreachable remains a separate joint comparison. |
| Revocation after dispatch | PARTIALLY_OBSERVED | ALLOW at dispatch; grant revoked in flight | dispatched | observed_at_platform | private terminal receipt | Effect is platform-observed, not an independent target byte. |

Boundaries kept separate per the shared contract: **decision → dispatch → committed effect → terminal
outcome → receipt/evidence**. `PARTIALLY_OBSERVED` means the platform observes the boundary but no
independent target-side witness exists.

Case 3 is **NOT_APPLICABLE_CURRENT_PATH**: Proofable evaluates authority from current local authority
state at dispatch, so there is no remote authority dependency to make unavailable. A
remote-authority outage remains a separate joint comparison and is not inferred as passing.

