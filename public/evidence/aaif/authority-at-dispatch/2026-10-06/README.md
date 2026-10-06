# Proofable — Authority-at-Dispatch evidence package

Proofable's implementation-owned export for the shared authority/effect contract associated with
[AAIF Identity & Trust issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13). This is a
sanitized public evidence projection. It is **not** AAIF certification, WG conformance, and **not**
the separately-proposed joint/independently-operated run.

**Run.** Live production hosted MCP, protocol revision
`f92faf39a4bae480cca3e5c07ce2c95d6ab68411`, run `four-case-run-f92faf39a4ba`. Executed by an
**ordinary non-admin Pro review tenant** (`admin:false`) with the dedicated agent
`proofable-authority-review` under an explicit pinned delegation per case. Custody is **SELF**
(author-operated); independent reproduction remains pending.

## Four-case results

| Case | Result |
| --- | --- |
| Binding veto | PARTIALLY_OBSERVED — dispatch refused before executor assignment; no protected effect observed |
| Revoked authority + stale evidence | SUPPORTED_AND_OBSERVED — revoked authority denied; never-revoked control accepted |
| Authority/verifier unreachable | NOT_APPLICABLE_CURRENT_PATH — Proofable evaluates current local authority state at dispatch; there is no remote authority dependency on this path |
| Revocation after dispatch | PARTIALLY_OBSERVED — allowed at dispatch, revoked in flight, effect observed at the Proofable platform boundary |

**Boundary kept explicit:** decision → dispatch → committed effect → terminal outcome →
receipt/evidence. These are distinct states in Proofable. Where Proofable does not independently
observe a target-side effect, the record explicitly says `platform_observed_only`.

## Files (this directory)

| File | Role |
| --- | --- |
| `README.md` | this summary |
| `manifest.json` | machine-readable projection: pins revision, run, custody, claims |
| `proofable-row.md` | the issue #13 implementation row |
| `matched-four-case-results.md` | four-case export under the shared authority/effect contract |
| `matched-four-case.json` | machine-readable four-case records |
| `vlad-four-case-mapping.md` | case-by-case mapping against the shared contract |
| `trace.jsonl` | one sanitized record per case (8 records) |
| `SHA256SUMS` | SHA-256 for the seven payload files beside it |

`SHA256SUMS` covers every payload file in this directory except itself. Verify with
`sha256sum -c SHA256SUMS`.

## What is not published

Raw operational receipts, raw proof bodies, delegation policy contents, prompts and job payloads, and
private runner/engine internals remain **private** (`receipt_visibility: private` in the manifest).
The public package is a deterministic sanitized projection: pinned revision, machine-readable records,
and SHA-256 checksums, sufficient to reproduce the claim without exposing the underlying private data.
