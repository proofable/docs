# Working-group eight-case conformance mapping — Proofable

Maps the **current** Proofable implementation onto the working group's **eight proposed conformance
cases** (Sparsh / Hiroshi / Marc). This is a **separate artifact** from Proofable's own bounded
implementation assertions and from Vlad's four matched cases. It is **not** a conformance claim:
`NOT_DEMONSTRATED` rows are genuine gaps, stated as such.

Status: **1 DEMONSTRATED · 3 PARTIAL · 4 NOT_DEMONSTRATED**

| # | WG case | Status |
| --- | --- | --- |
| 1 | Delegator authority revoked after downstream delegation | **NOT_DEMONSTRATED** |
| 2 | Valid delegation used for the wrong object or action | **PARTIAL** |
| 3 | Stale revocation information | **PARTIAL** |
| 4 | Human / escalation authority unavailable | **DEMONSTRATED** |
| 5 | Authority amplified through multi-hop delegation | **NOT_DEMONSTRATED** |
| 6 | Identity valid while effective authority is expired or invalid | **PARTIAL** |
| 7 | Delegation chain becomes a surveillance graph | **NOT_DEMONSTRATED** |
| 8 | Erroneous or disputed revocation, with contest and recovery evidence | **NOT_DEMONSTRATED** |

---

## 1. Delegator authority revoked after downstream delegation

- **Expected invariant.** Revoking a delegator's authority invalidates every downstream delegation derived from it.
- **Failure condition.** A downstream delegate still acts after its delegator's authority is revoked.
- **Observable evidence.** A downstream chain exists; revoke the delegator; the downstream delegate is then refused.
- **Proofable evidence.** Proofable has no sub-delegation chain. revoke_before_dispatch revokes a single controller→agent delegation and denies dispatch, but there is no downstream delegation to invalidate.
- **Missing to advance.** A sub-delegation model (delegate-of-a-delegate) — a product capability Proofable does not have.
- **Status.** **NOT_DEMONSTRATED**
- **Residual risk / trade-off.** Proofable cannot be compared on this case until it implements multi-level delegation; reporting DEMONSTRATED would be false.

## 2. Valid delegation used for the wrong object or action

- **Expected invariant.** A valid delegation permits only the specific action (and object) it names.
- **Failure condition.** A delegate performs an action or targets an object outside its delegated scope while the delegation is otherwise valid.
- **Observable evidence.** An in-scope grant is used for an out-of-scope action/object and is refused at the enforcement point.
- **Proofable evidence.** binding_veto: an active grant that omits run_command is refused isolated execution before an executor is assigned (JOB_AUTHORITY_DENIED). This proves ACTION-scope enforcement. Object/byte binding (the exact media, packaging or destination) is not proven.
- **Missing to advance.** A per-object/per-byte binding assertion (e.g. a delegated destination or content hash enforced at dispatch).
- **Status.** **PARTIAL**
- **Residual risk / trade-off.** Scope is per-action, not per-object; a same-action/different-object misuse is not covered by current evidence.

## 3. Stale revocation information

- **Expected invariant.** A relying party acting on stale revocation state cannot authorize an action whose authority has since been revoked.
- **Failure condition.** A revoked delegation is accepted because the consumer read a stale revocation state.
- **Observable evidence.** A revoked grant replayed against a consumer that re-reads state is denied; the read is at the enforcement point, not cached.
- **Proofable evidence.** stale_authority: a revoked grant replayed twice is denied both times (DELEGATION_PROOF_DENIED), no job created. Proofable re-evaluates authority at dispatch from current proof state, so it does not act on stale revocation state — but there is no explicit max-age window or a consumer-held-stale-state assertion.
- **Missing to advance.** A documented maximum tolerable age for revocation state, and an assertion that a deliberately stale consumer is refused.
- **Status.** **PARTIAL**
- **Residual risk / trade-off.** Freshness is "evaluated at dispatch" by construction; the WG may require an explicit window rather than a structural guarantee.

## 4. Human / escalation authority unavailable

- **Expected invariant.** When the escalation authority is unreachable, the default is to block; only an explicitly pre-authorized fallback may proceed.
- **Failure condition.** An action proceeds because the escalation authority could not be reached.
- **Observable evidence.** With the escalation authority unavailable, a refusal is recorded, no protected effect commits, and the action can resume after reconnection.
- **Proofable evidence.** approval_unavailable: the job parks at waiting_approval, is cancelled without approval, and a late approve is refused (JOB_APPROVAL_STATE_CHANGED) with no executor — the lapsed approval did not execute the action. The authority engine also has a fail-closed gateway branch (GATEWAY_UNREACHABLE → DENY).
- **Missing to advance.** The REMOTE-authority-unreachable variant (verifier/authority timeout, not a human approval window) is not exercised live; the 24h approval timeout is unit-tested only.
- **Status.** **DEMONSTRATED**
- **Residual risk / trade-off.** The human-unavailable half is demonstrated; the remote-authority-unreachable half is `unknown` and is exactly the matched-run case.

## 5. Authority amplified through multi-hop delegation

- **Expected invariant.** Each delegation hop attenuates authority; no hop can amplify (widen) the authority it received.
- **Failure condition.** A downstream delegation grants more than its upstream delegation held.
- **Observable evidence.** A chain of delegations where every hop is a subset of the previous, and a widening hop is refused.
- **Proofable evidence.** No multi-hop delegation exists. The engine distinguishes an ABSENT allowedActions (unscoped controller path) from a PRESENT-but-EMPTY one (scoped to nothing), but no attenuation chain is exercised.
- **Missing to advance.** A sub-delegation model with a per-hop attenuation invariant.
- **Status.** **NOT_DEMONSTRATED**
- **Residual risk / trade-off.** This is the same missing capability as case 1; not testable without a delegation chain.

## 6. Identity valid while effective authority is expired or invalid

- **Expected invariant.** Identity/authentication can remain valid while effective authority is expired, and the expired authority alone blocks the action.
- **Failure condition.** An action proceeds on the strength of a still-valid identity after the authority has expired.
- **Observable evidence.** Identity proof still active; delegation expired; the action is refused.
- **Proofable evidence.** expiry_before_dispatch: a delegation past its expiry is denied (DELEGATION_PROOF_DENIED), no job created. The agent-identity proof remains active in the same run, but the record does not explicitly co-assert identity validity alongside the expiry denial.
- **Missing to advance.** An explicit co-assertion in one record: identity valid AND authority expired AND action refused.
- **Status.** **PARTIAL**
- **Residual risk / trade-off.** The separation is structurally true (identity and delegation are separate proofs), but the evidence does not yet state both facts in a single record.

## 7. Delegation chain becomes a surveillance graph

- **Expected invariant.** A delegation chain does not expose linkability that turns it into a surveillance graph.
- **Failure condition.** The delegation structure reveals the human principal or links otherwise-separate subjects.
- **Observable evidence.** A privacy/linkability analysis over the delegation chain and its recorded provenance.
- **Proofable evidence.** Nothing in the current assertions tests privacy or linkability exposure. Proofable's model is the opposite of a hidden-principal rail: proofs are portable and offchain by default and state what was verified (private proof BODIES are protected, but the delegation names a controller wallet).
- **Missing to advance.** A linkability/privacy analysis and, if required, a hidden-principal or unlinkability mechanism Proofable does not implement.
- **Status.** **NOT_DEMONSTRATED**
- **Residual risk / trade-off.** This case is not a fit for Proofable's design; the honest position is N/A-to-NOT_DEMONSTRATED rather than a claimed pass.

## 8. Erroneous or disputed revocation, with contest and recovery evidence

- **Expected invariant.** A revocation that is disputed can be contested, resolved, and — if erroneous — the authority restored, with evidence for each transition.
- **Failure condition.** An erroneous revocation is permanent with no contest or restoration path, or a restoration leaves no evidence.
- **Observable evidence.** Contest → resolution outcome → restoration/confirmation, each recorded.
- **Proofable evidence.** Revocation metadata exists (proofs are revocable and excluded once revoked), but there is no contest → outcome → restoration workflow, and no record shape for it.
- **Missing to advance.** A dispute/contest and restoration workflow with transition evidence.
- **Status.** **NOT_DEMONSTRATED**
- **Residual risk / trade-off.** A genuine product gap; building it is out of scope for this evidence task.

---

Proofable's own implementation assertions (a different set) are frozen and reported separately.
Vlad's four matched cases are also separate. No conformance or certification is claimed.
