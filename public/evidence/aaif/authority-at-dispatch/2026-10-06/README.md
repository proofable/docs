# Proofable authority-at-dispatch evidence (f92faf39a4ba)

Bounded implementation assertions ran through Proofable's **live production hosted MCP service** on
protocol revision `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`. These are Proofable's own implementation probes, not
the WG's proposed conformance cases and not Vlad's four matched cases. The execution principal was an
**ordinary non-admin Pro review tenant** (`admin:false`, so the Admin/CUSTOM job-ownership bypass does
not apply), operating the dedicated agent `proofable-authority-review` under a controller-signed allow-list
delegation. Every job pinned an explicit `delegationQHash`; each assertion varies only the
delegation/job state. The founder/admin profile was not the execution principal.

| Assertion | Observed production behavior | Observed matches expected |
| --- | --- | --- |
| Hosted allow | Granted authority: the job completed and returned `REVIEW_OK`. | yes |
| Binding veto | A grant omitting `run_command` was refused isolated execution before an executor was assigned. | yes |
| Approval reachable | The job parked at `waiting_approval`, an authenticated decision was accepted, then it completed. | yes |
| Approval unavailable | The job parked, was cancelled without approval, and a late approval was refused (`JOB_APPROVAL_STATE_CHANGED`). | yes |
| Revoke before dispatch | A delegation revoked before dispatch returned `DELEGATION_PROOF_DENIED`; no job was created. | yes |
| Expiry before dispatch | A delegation past its expiry returned `DELEGATION_PROOF_DENIED`; no job was created. | yes |
| Stale authority | A revoked grant replayed was denied on every attempt; no job was created. | yes |
| Post-dispatch revoke | A grant revoked while the job was in flight: the in-flight job completed and its platform-observed effect was read back. | yes |

Where the product produced a terminal receipt, it was read back as verified and private. The
[manifest](manifest.json) pins the production revision and the private-source hashes; the
[public trace](trace.jsonl) holds one sanitized record per case; [checksums](SHA256SUMS) cover this
packet.

This is author-operated implementation evidence. It is **not** AAIF certification or conformance, not
a matched AAIF experiment, and not independently reproduced. The effect boundary is observed at the
platform (job terminal state), not by an independent target-side byte, and a denied dispatch
persists no pre-dispatch signed decision record (a named product gap in the standards
reconciliation, not an omission here). Relevant to
[AAIF Identity & Trust WG issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13).
