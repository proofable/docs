# Authority at dispatch

Proofable's records for eight permission cases run on the live service. The plain summary, with a
link to every record, is at
[docs.proofable.me/benchmark](https://docs.proofable.me/benchmark#agents-only-do-what-you-allowed).

| Folder | What it is |
| --- | --- |
| [`2026-11-02-suite/`](./2026-11-02-suite/) | **Latest published run, 2 November.** Eight cases on revision `327e50de3`, 8 of 8, 15 signed records. A permission revoked while its job was running stopped that job with a typed reason 18 seconds later, and the next dispatch was refused |
| [`2026-11-01-suite-c1/`](./2026-11-01-suite-c1/) | Previous run, 1 November, corrected 2 November. Its post-revocation record calls the outcome a refusal at the executor's tool call; the job record shows the running attempt stalled and was refused when it was retried, so that case is not supported by its own records. The 2 November run records the stop itself |
| [`2026-11-01-suite/`](./2026-11-01-suite/) | The same run as first published, retained and hash-pinned. Corrected by `2026-11-01-suite-c1/` — wording and grading scope only |
| [`2026-10-24-served/`](./2026-10-24-served/) | Previous run, 24 October. Eight cases on revision `61724c9f4`, 17 signed records, checksums, and a result for each case |
| [`2026-10-24-fetch-route/`](./2026-10-24-fetch-route/) | One job on the fetch route: the call, the raw response, the signed decision and receipt, and an offline checker |
| [`reproduce/`](./reproduce/) | Run the same cases under your own account |
| [`action/`](./action/) | The same run as a GitHub Action, which writes a `trustharness.report/v1` report |
| [`2026-10-08-eight-case/`](./2026-10-08-eight-case/) | Earlier run at revision `e1217327a`: 15 signed records and an offline checker |

To check the latest published run:

```sh
cd 2026-11-02-suite
sha256sum -c SHA256SUMS
cd ../reproduce
node aad.mjs verify ../2026-11-02-suite
node aad.mjs report ../2026-11-02-suite
node aad.mjs controls ../2026-11-02-suite
```

`verify` recomputes every checksum, the trace digest and all 15 disclosed envelopes offline. It counts the
trace rows and computes the coverage from them: each of the eight cases must appear exactly once, and a case
passes only when its row says so, every record it cites verifies, and each record is the one the case needs
from its own run: the receipt of its own job, and the decision under its own permission with the outcome the
case states. No record or job may be cited by two cases. A count or coverage the manifest declares that differs
from that computation fails. `report` prints the typed cost and the grading scope from the sealed records. Both
read the older packets too, which carry one file per case. Both 1 November packets fail `verify` on
`post_dispatch_revoke`: the job record does not show the refusal the case states, as the table above says.

`controls` checks the verifier itself. It alters a copy of the packet in eight ways: a case removed, removed
again with the record count changed to match, a case duplicated, a verdict flipped, a cited record removed, every
citation stripped from a passing case, two passing cases swapping their job receipts, and two swapping their
decisions. It re-seals every digest so the integrity checks pass, and requires `verify` to reject each one while
accepting the unaltered copy. In the last three every record is still genuine and verified, so only the binding
to the case's own run can reject them. The packet is never touched.

## The acceptance criterion

A packet is accepted, on the same bytes, only when both commands pass:

- `verify` passes: every checksum, the trace digest and all disclosed envelopes recompute offline, each of the
  eight cases appears exactly once, and each record a case cites is the one its own run produced.
- `controls` passes: `verify` rejects all eight re-sealed alterations and accepts the unaltered packet.

Either one failing is a rejection of the packet, not a note on it. This kit is held to that criterion, and we
propose the same control set as the criterion for a packet in this comparison, so a reviewer applies one rule to
any implementation's packet rather than arguing each packet's shape.

To check the October 8 packet, run `npm install @proofable/sdk@0.1.10` inside
`2026-10-08-eight-case/`, then `node verify-portable-proofs.mjs`.

Earlier packets stay where they were:
[`9851059`](https://github.com/proofable/docs/tree/9851059900e29ba701bb0f4df2bf89a2107f430c/public/evidence/aaif/authority-at-dispatch/2026-10-08)
and [`3a45f02`](https://github.com/proofable/docs/tree/3a45f026fd0c06b9d1d411c053597584b6b1c3dc/public/evidence/aaif/authority-at-dispatch/2026-10-06).
