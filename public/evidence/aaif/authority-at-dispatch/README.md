# Authority at dispatch

Proofable's records for eight permission cases run on the live service. The plain summary, with a
link to every record, is at
[docs.proofable.me/use-cases/authority-at-dispatch](https://docs.proofable.me/use-cases/authority-at-dispatch).

| Folder | What it is |
| --- | --- |
| [`2026-10-08-eight-case/`](./2026-10-08-eight-case/) | The results, 15 signed records, checksums, and an offline verifier |
| [`reproduce/`](./reproduce/) | Run the same cases under your own account |

```sh
cd 2026-10-08-eight-case
sha256sum -c SHA256SUMS
npm install @proofable/sdk@0.1.6
node verify-portable-proofs.mjs
```

Earlier packets stay at their commits:
[`9851059`](https://github.com/proofable/docs/tree/9851059900e29ba701bb0f4df2bf89a2107f430c/public/evidence/aaif/authority-at-dispatch/2026-10-08)
and [`3a45f02`](https://github.com/proofable/docs/tree/3a45f026fd0c06b9d1d411c053597584b6b1c3dc/public/evidence/aaif/authority-at-dispatch/2026-10-06).
