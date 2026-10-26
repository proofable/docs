# Authority at dispatch

Proofable's records for eight permission cases run on the live service. The plain summary, with a
link to every record, is at
[docs.proofable.me/use-cases/authority-at-dispatch](https://docs.proofable.me/use-cases/authority-at-dispatch).

| Folder | What it is |
| --- | --- |
| [`2026-10-24-served/`](./2026-10-24-served/) | **Current run.** Eight cases on revision `61724c9f4`, 17 signed records, checksums, and a result for each case |
| [`2026-10-24-fetch-route/`](./2026-10-24-fetch-route/) | One job on the fetch route: the call, the raw response, the signed decision and receipt, and an offline checker |
| [`reproduce/`](./reproduce/) | Run the same cases under your own account |
| [`action/`](./action/) | The same run as a GitHub Action, which writes a `trustharness.report/v1` report |
| [`2026-10-08-eight-case/`](./2026-10-08-eight-case/) | Earlier run at revision `e1217327a`: 15 signed records and an offline checker |

To check the current run:

```sh
cd 2026-10-24-served
sha256sum -c SHA256SUMS
cd ../reproduce
node aad.mjs verify ../2026-10-24-served
```

The October 8 packet has its own pin. Run `npm install @proofable/sdk@0.1.6` inside
`2026-10-08-eight-case/`, then `node verify-portable-proofs.mjs`.

Earlier packets stay where they were:
[`9851059`](https://github.com/proofable/docs/tree/9851059900e29ba701bb0f4df2bf89a2107f430c/public/evidence/aaif/authority-at-dispatch/2026-10-08)
and [`3a45f02`](https://github.com/proofable/docs/tree/3a45f026fd0c06b9d1d411c053597584b6b1c3dc/public/evidence/aaif/authority-at-dispatch/2026-10-06).
