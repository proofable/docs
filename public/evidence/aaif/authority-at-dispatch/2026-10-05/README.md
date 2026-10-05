# Proofable authority-at-dispatch evidence (17f17630166b)

On 5 October 2026, eight bounded assertions ran through Proofable's **live production hosted MCP
service** on protocol revision `17f17630166b1018804a5fca5bc485b6812580aa`. The execution principal was an
**ordinary non-admin Pro review tenant** (`admin:false`, so the Admin/CUSTOM job-ownership bypass
does not apply), operating the dedicated agent `proofable-authority-review` under a controller-signed
allow-list delegation. Every job pinned an explicit `delegationQHash`; each case varies only the
delegation/job state. The founder/admin profile was not the execution principal.

| Assertion | Observed production behavior | Result |
| --- | --- | --- |
| Hosted allow | Granted authority: the job completed and returned `REVIEW_OK`. | PASS |
| Binding veto | A grant omitting `run_command` was refused isolated execution before an executor was assigned. | PASS |
| Approval reachable | The job parked at `waiting_approval`, an authenticated decision was accepted, then it completed. | PASS |
| Approval unavailable | The job parked, was cancelled without approval, and a late approval was refused (`JOB_APPROVAL_STATE_CHANGED`). | PASS |
| Revoke before dispatch | A delegation revoked before dispatch returned `DELEGATION_PROOF_DENIED`; no job was created. | PASS |
| Expiry before dispatch | A delegation past its expiry returned `DELEGATION_PROOF_DENIED`; no job was created. | PASS |
| Stale authority | A revoked grant replayed was denied on every attempt; no job was created. | PASS |
| Post-dispatch revoke | A grant revoked while the job was in flight: the in-flight job completed and its committed effect was read back. | PASS |

Where the product produced a terminal receipt, it was read back as verified and private. The
deterministic review of the immutable private records is **8/8 PASS**. The
[manifest](manifest.json) pins the production revision and the private-source hashes; the
[public trace](trace.jsonl) holds one sanitized record per case; [checksums](SHA256SUMS) cover this
packet.

The operator ran and evaluated these checks. The denial cases intentionally produced no signed
decision record (that is a named product gap in the standards reconciliation, not an omission
here). This is bounded implementation evidence relevant to
[AAIF Identity & Trust WG issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13). It is
not AAIF certification, AARM conformance, or an AgentGovBench leaderboard result.
