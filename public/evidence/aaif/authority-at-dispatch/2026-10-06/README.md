# Proofable — Authority-at-Dispatch Evidence

Proofable's implementation evidence for the authority/effect comparison associated with
[AAIF Identity & Trust issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13).

**Run.** Live production hosted MCP, protocol revision `f92faf39a4bae480cca3e5c07ce2c95d6ab68411`, run
`authority-suite-epoch-f92faf39a4ba`. Executed by an ordinary non-admin Pro review tenant (`admin:false`) with
the dedicated agent `proofable-authority-review` under an explicit pinned delegation per case.
The post-revocation ordering case was re-observed on the same pinned revision.

## Results

| Scenario | Result |
| --- | --- |
| Binding veto / action outside delegated authority | **SUPPORTED** — unauthorized execution is denied before executor assignment |
| Revoked authority / stale grant | **SUPPORTED** — revoked authority is denied while the never-revoked control remains accepted |
| Remote authority unavailable | **NOT APPLICABLE TO CURRENT PATH** — Proofable evaluates current authority state locally at dispatch and has no remote authorization dependency on this path |
| Revocation after dispatch | **SUPPORTED** — the dispatch decision, the later revocation, the resulting effect/outcome, and the refusal of the next dispatch are separately attributable |

**Protocol boundary:** authority → decision → dispatch → effect/outcome → receipt.

**Revocation after dispatch.** One grant is dispatched under, revoked while the action is in flight, and
then used for the next dispatch. The earlier action was allowed at dispatch and its effect was already
committed and read back at the platform; the next dispatch under the same revoked grant was refused with
a reason. When authorization was refused is therefore reported separately from whether the prior action
had already committed an effect. Revocation latency is **not measured** in this run.

The result is a portable proof/receipt of the protocol decision and outcome; disclosure controls
which fields are shared. Where Proofable does not independently observe a target-side effect, the
record states `platform_observed_only`.

**Evidence scope:** author-operated; independent reproduction not yet claimed.

This is implementation evidence for the comparison in #13 — not AAIF certification or WG
conformance.

## Files

| File | Role |
| --- | --- |
| `README.md` | this summary |
| `manifest.json` | machine-readable manifest: revision, run, custody, results, disclosure |
| `authority-effect-results.md` | results under the shared authority/effect contract |
| `authority-effect-results.json` | machine-readable results |
| `trace.jsonl` | one sanitized record per supporting case (6 records) |
| `SHA256SUMS` | SHA-256 for the five payload files beside it |

`SHA256SUMS` covers every payload file in this directory except itself. Verify with
`sha256sum -c SHA256SUMS`.

Disclosure controls which fields of the Proofable record are shared; non-public fields are not
required to evaluate these results.
