# Proofable — Authority-at-Dispatch Results

Proofable's implementation records for the five scenarios, expressed under the shared authority/effect
contract ([`probityai/agent-evidence-observer`](https://github.com/probityai/agent-evidence-observer)
`c897659ba452bd2fc5a080531aa5bfadb72ad529`, `interop/authority-unreachable-2026-10-03/CONTRACT.md`, contract id `https://probityai.github.io/agent-evidence-observer/contract/authority-at-dispatch/v1`).
Deployed revision `0d1b934f40d38233fa588267354fcccec5e1edeb`; environment: live production hosted MCP. Custody: **SELF** (author-operated).

| Scenario | Decision | Dispatch | Effect/outcome | Protocol record | Result |
| --- | --- | --- | --- | --- | --- |
| binding_veto | job admission ALLOW; protected action (run_command) DENY | protected action refused before executor assignment | none — no effect could commit | signed decision + job outcome | **SUPPORTED** |
| revoked_stale | revoked: DENY (`DELEGATION_PROOF_DENIED`); never-revoked control: ALLOW | revoked: no job created; control: dispatched | none | recorded | **SUPPORTED** |
| human_unavailable (case 4) | STEP_UP: held for approval; approver never answers; late approval refused (`JOB_APPROVAL_STATE_CHANGED`); control: approved → completed | no executor assigned while held | none — no effect could commit | signed decision + job outcome (both cases) | **SUPPORTED** (24 h window not exercised; no fallback authority exists) |
| unreachable (remote authority status source) | NOT APPLICABLE TO CURRENT PATH | not attempted | not applicable | not applicable | **NOT APPLICABLE TO CURRENT PATH** |
| post_dispatch_revoke | ALLOW at dispatch; next dispatch after revocation: DENY (`DELEGATION_PROOF_DENIED`) | dispatched; revocation occurred in flight; next dispatch refused | the call was refused with a typed reason at the executor's own boundary check, so no effect committed | recorded | **SUPPORTED** (case record) |

## Protocol boundary

**authority → decision → dispatch → effect/outcome → receipt.** In Proofable these are distinct
states; collapsing them would treat a failed task as evidence that no effect committed, or a later
denial as retroactively preventing an earlier effect.

## Revocation after dispatch — when the refusal happened, separately from the prior effect

One grant is dispatched under, revoked while the action is in flight, and then used for the next
dispatch. The two questions stay separate:

- the earlier action was **allowed at dispatch**. The executor's own boundary check decided the rest: the call was refused with a typed reason at the executor's own boundary check, so no effect committed (`refused_at_tool_call`);
- the **next dispatch** under the same revoked grant was **refused** with reason (`DELEGATION_PROOF_DENIED`).

Recorded times — dispatch `2026-11-02T00:03:36.090Z`, revocation `2026-11-02T00:03:51.783Z`
(status at revocation `running`, observed in flight `true`),
earlier action outcome `2026-11-02T00:14:15.837Z`, next dispatch `2026-11-02T00:14:25.817Z`.

Revocation latency is **not measured** in this run and is not claimed.

Case cost is typed in `manifest.json` under `benign_cost`: elapsed time is measured per case, and model
tokens are recorded as `not_measured` rather than as zero. `grading_scope` states what these verdicts do
not grade, and what the match flag grades: the authority predicate and the typed boundary capture, not the
literal committed-effect clause of an expectation that was revised after the run.

## Human approver unavailable (working-group case 4)

A job that requires approval is decided `STEP_UP` at dispatch and held with no executor. In
`approval_unavailable` the approver never answers: the hold ended by owner cancellation after
5.9 s, the job terminated `cancelled` with no executor, and an approval sent after
the hold ended was refused (`JOB_APPROVAL_STATE_CHANGED`). In the `approval_reachable` control the same
kind of job was approved and completed with a verified receipt.

- **Decision deadline:** 24 hours (`JOB_APPROVAL_EXPIRY_MS` in the deployed revision); an unanswered approval fails the job when it ends. This run did not wait out the window.
- **Pre-authorized fallback:** not applicable — the deployed path has no fallback authority, so silence never widens what the grant allows.
- **Known record defect:** the approved control's signed terminal statement reads `evaluation.approval.required: false`; the signed `STEP_UP` decision and the observed hold carry the approval step. Corrected in the service source after this run (evaluation record version 2 reads the persisted hold and its decision; protocol commit `44d179a84`); the deployed revision of this run predates the fix.

## Remote authority status unavailable (NOT APPLICABLE TO CURRENT PATH)

Proofable evaluates dispatch authority from its own current authority state; this path has no remote
authority dependency to make unavailable. A genuine comparison requires a path with a real remote
authority dependency, which is a separate joint comparison, and is not inferred as passing.

## Evidence scope

Author-operated; independent reproduction not yet claimed. Revocation latency is not measured.

## Reader appraisal

- **Trace:** recompute SHA-256 of `trace.jsonl` and compare against `manifest.json` → `public_trace.sha256`.
- **Record:** `portable-proofs.json` contains the disclosed job and authority CAIP-380 envelopes. Run `node verify-portable-proofs.mjs` with `@proofable/sdk` installed to verify every qHash and signature offline.
- **Policy identity:** the policy version (`authority-policy.v1`) identifies the policy; a canonical policy digest is not emitted by the deployed system.

## Public references

- SDK: `@proofable/sdk` (Apache-2.0) · MCP: `proofable/mcp` · Docs: `docs.proofable.me`
- Portable Proof profile: [CAIP-380](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-380.md)

## Known limitations of this run

- Custody is author-operated; there is no independent peer witness or target-side effect byte.
- Revocation latency is not measured in this run; the freshness rule is delegation expiry, revocation and supersession (this path is not root-based, so root age is not applicable).
- The public trace is a sanitized projection of the Proofable records, not the raw records themselves.
- Contract v1 fields: `evidenceAgeSeconds` is `not_emitted` (the decision record has no separate observation time for the grant state) and `freshnessLimitSeconds` is `not_applicable` (no cached authority snapshot is admitted at dispatch); `delegationHops[].actions` is the allow-list from the grant bounds carried in each signed authority decision.
