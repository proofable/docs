# Proofable — Authority-at-Dispatch evidence package

Proofable's implementation-owned export for the shared authority/effect contract associated with
[AAIF Identity & Trust issue #13](https://github.com/aaif/wg-identity-and-trust/issues/13).

**One protocol, one proof, one receipt — disclosure controls what fields are shown.** These records
are the deployed Proofable protocol's own output, shared at a public-safe disclosure level. This is
not a second evidence system, and it is **not** AAIF certification, WG conformance, or the
separately-proposed joint/independently-operated run.

**Run.** Live production hosted MCP, protocol revision
`f92faf39a4bae480cca3e5c07ce2c95d6ab68411`, run `four-case-run-f92faf39a4ba`. Executed by an
**ordinary non-admin Pro review tenant** (`admin:false`) with the dedicated agent
`proofable-authority-review` under an explicit pinned delegation per case. Custody is **SELF**
(author-operated).

## Four-case results

| Case | Proofable result |
| --- | --- |
| Binding veto | **SUPPORTED** — unauthorized execution is denied before executor assignment |
| Revoked authority / stale grant | **SUPPORTED** — revoked authority is denied while the valid control remains accepted |
| Remote authority unreachable | **NOT APPLICABLE TO CURRENT PATH** — dispatch authority is evaluated from Proofable's current authority state rather than a remote authorization dependency |
| Revocation after dispatch | **SUPPORTED** — dispatch, subsequent revocation, resulting effect/outcome, and receipt remain separate and attributable |

**Protocol boundary:** authority → decision → dispatch → effect/outcome → receipt. These are distinct
states in Proofable; collapsing them would treat a failed task as evidence that no effect committed,
or a later denial as retroactively preventing an earlier effect.

**Evidence scope:** Proofable protocol records decision, dispatch, effect state, terminal outcome, and
receipt. This run was author-operated and has not yet been independently reproduced. External
target-side witnessing was not part of this run.

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

## Disclosure

Visibility controls disclosure, not the artifact. The public package is the minimum public-safe
representation of the actual Proofable proof/receipt, plus the revision and hashes needed to verify
it. Raw operational receipts, raw proof bodies, delegation policy contents, prompts and job payloads,
and private runner/engine internals remain undisclosed (`receipt_visibility: private` in the
manifest).
