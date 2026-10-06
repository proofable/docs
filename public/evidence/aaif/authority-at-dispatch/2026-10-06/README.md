# Proofable — AAIF #13 evidence package

**This package contains Proofable's implementation-owned evidence for the proposed matched
authority-at-dispatch experiment associated with AAIF Identity & Trust issue #13. It does not
represent AAIF certification, WG conformance, or the separate proposed eight-case matrix.**

What was run: Proofable's bounded authority-at-dispatch implementation assertions, plus the matched
four-case export, through its **live production hosted MCP service** on the pinned revision
`f92faf39a4bae480cca3e5c07ce2c95d6ab68411`, executed by an **ordinary non-admin Pro review tenant** with a dedicated agent and an
explicit pinned delegation per job.

What is claimed: implementation evidence with the boundaries decision → dispatch → committed effect →
terminal outcome → receipt/evidence kept separate, and every unavailable field marked. Custody is
**SELF** (author-operated).

What is **not** claimed: AAIF certification or conformance, WG conformance, an independent
peer-operated run, an independent target-side effect witness, or independent reproduction.

Files: `proofable-row.md` (issue #13 row) · `matched-four-case-results.md` (shared-contract four-case
export) · `manifest.json` · `trace.jsonl` (sha256 `409e025c4ca0e2a60fa82b1d7a29eba5509d906a567c27c3090f859175e14d11`) · `checksums.txt` · `REPRODUCE.md` ·
`reply-to-vlad.md` · `implementation-assertions.md` · `vlad-four-case-mapping.md`.

Two evidence sets, never conflated. (1) Proofable's own bounded implementation assertions
(`implementation-assertions.md`) — native implementation evidence. (2) Vlad's four matched cases
(`vlad-four-case-mapping.md` and `matched-four-case-results.md`) — the shared-contract export for the
matched run. The working group's separately-proposed multi-case matrix is **not** part of this package;
it is not adopted and is not evidence for #13.
