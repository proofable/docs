# Authority at dispatch: evidence

Proofable's records for the authority-at-dispatch comparison in
[AAIF Identity & Trust #13](https://github.com/aaif/wg-identity-and-trust/issues/13). The plain-language
summary, with a public link to every record, is at
[docs.proofable.me/use-cases/authority-at-dispatch](https://docs.proofable.me/use-cases/authority-at-dispatch).

| Folder | What it is |
| --- | --- |
| [`2026-10-08-eight-case/`](./2026-10-08-eight-case/) | All eight cases from the October 8, 2026 production run: results, trace, 15 signed records, checksums, and an offline verifier |
| [`reproduce/`](./reproduce/) | Run the same eight cases on the live service under your own account, then verify the records offline |

## Verify

```sh
cd 2026-10-08-eight-case
sha256sum -c SHA256SUMS
npm install @proofable/sdk@0.1.6
node verify-portable-proofs.mjs
```

## Earlier packets

The six-case packet from the same run, which the shared ProbityAI reader appraises, is at
[`9851059`](https://github.com/proofable/docs/tree/9851059900e29ba701bb0f4df2bf89a2107f430c/public/evidence/aaif/authority-at-dispatch/2026-10-08).
The October 6 packet, superseded because its trace digest did not match its bytes, is at
[`3a45f02`](https://github.com/proofable/docs/tree/3a45f026fd0c06b9d1d411c053597584b6b1c3dc/public/evidence/aaif/authority-at-dispatch/2026-10-06).

## Scope

Proofable ran these cases itself; no independent operator run is published yet. Revocation latency is
not measured. This is implementation evidence, not AAIF certification or AARM conformance.
