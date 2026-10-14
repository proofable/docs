# Reviewer handoff — 2026-10-14

## `probityai-envelope-count.patch` — ProbityAI `agent-evidence-observer`

Tested against `main` at `f9fd4a1` (contract v1, `c897659`, included).

`read_proofable` requires the envelope count to equal the literal `11`, which was the count in the
`2026-10-08` packet. The check already requires the trace qHash set, the manifest references and the
envelope file to be exactly equal with no duplicates, so the literal adds nothing except a failure on
any packet with a different number of cases. The patch drops the literal; no other check changes.

Results on `main` + patch (Python 3.13):

| Packet | Structural checks (13) | Signature check |
| --- | --- | --- |
| `2026-10-08-eight-case/` (15 envelopes) | 13 pass | not run here (`eth-account` unavailable); all 15 verify with `@proofable/sdk` |
| `2026-10-08/` at `9851059` (11 envelopes, the reader's pinned records) | 13 pass | not run here; passed in the reader's CI when PR #88 merged |

Without the patch, `2026-10-08-eight-case/` fails `proofable-envelope-count` (15 ≠ 11). Run the
reader's own signature check with `eth-account` installed before relying on it.
