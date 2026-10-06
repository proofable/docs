# Proofable — four-case implementation export (case mapping)

| Case | Proofable result | Decision | Dispatch | Effect/outcome | Receipt | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Binding veto | **SUPPORTED** | DENY before executor assignment (grant omits `run_command`) | refused pre-executor | none | private terminal receipt | Unauthorized execution is denied. |
| Revoked authority / stale grant | **SUPPORTED** | revoked: DENY (`DELEGATION_PROOF_DENIED`); never-revoked control: ALLOW | revoked: no job; control: dispatched | none | private terminal receipt (control) | Revoked authority is denied while the valid control remains accepted. |
| Remote authority unreachable | **NOT APPLICABLE TO CURRENT PATH** | not applicable | not attempted | not applicable | n/a | Dispatch authority is evaluated from Proofable's current authority state; no remote authorization dependency on this path. |
| Revocation after dispatch | **SUPPORTED** | ALLOW at dispatch | dispatched; revoked in flight | attributable to the original dispatch | private terminal receipt | Dispatch, subsequent revocation, effect/outcome, and receipt remain separate and attributable. |

**Protocol boundary:** authority → decision → dispatch → effect/outcome → receipt.

**Evidence scope:** Proofable protocol records decision, dispatch, effect state, terminal outcome, and
receipt. This run was author-operated and has not yet been independently reproduced. External
target-side witnessing was not part of this run.
