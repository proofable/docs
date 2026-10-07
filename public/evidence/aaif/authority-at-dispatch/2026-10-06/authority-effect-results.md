# Proofable — Authority-at-Dispatch Results

Proofable's implementation records for the four scenarios, expressed under the shared authority/effect
contract ([`probityai/agent-evidence-observer`](https://github.com/probityai/agent-evidence-observer)
`fb8cabc5c9c54459743497f2325bfef49b137a1a`, `interop/authority-unreachable-2026-10-03/CONTRACT.md`).
Deployed revision `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`; environment: live production hosted MCP. Custody: **SELF** (author-operated).

| Scenario | Decision | Dispatch | Effect/outcome | Protocol record | Result |
| --- | --- | --- | --- | --- | --- |
| binding_veto | DENY (`JOB_AUTHORITY_DENIED`) | refused before executor assignment | none — no effect could commit | recorded | **SUPPORTED** |
| revoked_stale | revoked: DENY (`DELEGATION_PROOF_DENIED`); never-revoked control: ALLOW | revoked: no job created; control: dispatched | none | recorded | **SUPPORTED** |
| unreachable | NOT APPLICABLE TO CURRENT PATH | not attempted | not applicable | not applicable | **NOT APPLICABLE TO CURRENT PATH** |
| post_dispatch_revoke | ALLOW at dispatch; next dispatch after revocation: DENY (`DELEGATION_PROOF_DENIED`) | dispatched; revocation occurred in flight; next dispatch refused | the earlier action's effect was already committed and remains observed at the platform | recorded | **SUPPORTED** |

## Protocol boundary

**authority → decision → dispatch → effect/outcome → receipt.** In Proofable these are distinct
states; collapsing them would treat a failed task as evidence that no effect committed, or a later
denial as retroactively preventing an earlier effect.

## Revocation after dispatch — when the refusal happened, separately from the prior effect

One grant is dispatched under, revoked while the action is in flight, and then used for the next
dispatch. The two questions stay separate:

- the earlier action was **allowed at dispatch** and its effect was already committed and read back at the platform (`observed_at_platform`);
- the **next dispatch** under the same revoked grant was **refused** with reason (`DELEGATION_PROOF_DENIED`).

Recorded times — dispatch `2026-10-07T03:28:50.629Z`, revocation `2026-10-07T03:29:06.064Z`
(status at revocation `running`, observed in flight `true`),
earlier action outcome `2026-10-07T03:30:39.203Z`, next dispatch `2026-10-07T03:30:44.969Z`.

Revocation latency is **not measured** in this run and is not claimed.

## Remote authority unavailable (NOT APPLICABLE TO CURRENT PATH)

Proofable evaluates dispatch authority from its own current authority state; this path has no remote
authority dependency to make unavailable. A genuine comparison requires a path with a real remote
authority dependency, which is a separate joint comparison, and is not inferred as passing.

## Evidence scope

Author-operated; independent reproduction not yet claimed. Revocation latency is not measured.

## Reader appraisal

- **Trace:** recompute SHA-256 of `trace.jsonl` and compare against `manifest.json` → `public_trace.sha256`.
- **Record:** the underlying Proofable proof/receipt is a CAIP-380 envelope. An independent reader can verify such an envelope offline with `verifyPortableProofEnvelope` from the public **Apache-2.0** `@proofable/sdk` — the signature is checked without a call to Proofable.
- **Policy identity:** the policy version (`authority-policy.v1`) identifies the policy; a canonical policy digest is not emitted by the deployed system.

## Public references

- SDK: `@proofable/sdk` (Apache-2.0) · MCP: `proofable/mcp` · Docs: `docs.proofable.me`
- Portable Proof profile: [CAIP-380](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-380.md)

## Known limitations of this run

- Custody is author-operated; there is no independent peer witness or target-side effect byte.
- Revocation latency is not measured in this run; the freshness rule is delegation expiry, revocation and supersession (this path is not root-based, so root age is not applicable).
- The public trace is a sanitized projection of the Proofable records, not the raw records themselves.
