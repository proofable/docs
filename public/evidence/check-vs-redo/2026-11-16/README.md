# Check vs redo, 2026-11-16

90 agent jobs: what it takes to run each one again, against checking the signed receipt it left.

| | Redo the job | Check the receipt offline | Read by id + check |
| --- | --- | --- | --- |
| Time, median | 21.9 s | 4.1 ms | 201 ms |
| AI tokens, median | 15,743 | 0 | 0 |
| Cost, median | $0.0108 | $0.00000027 | $0.0000036 |

Per job, median (p10 to p90):

- Offline check: **4,584x faster** (872x to 16,341x), **39,382x cheaper** (12,791x to 95,369x)
- Read by id over the network, then check: **47x faster** (7.3x to 344x), **1,482x cheaper** (279x to 7,612x). No job in the run was faster to redo than to check (lowest 1.3x).

## What ran

- 15 pinned tasks in four kinds: structured extraction from a fixed document, review of a public source file at a commit, a question answered from a published RFC, and a two-source comparison ([tasks.json](tasks.json)).
- Two models, three runs of every task on each: DeepSeek V4.1 Flash (Proofable hosted Advanced) and Gemini 3.8 Flash. 90 jobs, every one completed with a signed receipt that verifies offline.
- Seven runs on a third model, GLM-5.3 Flash (Proofable hosted Default), are listed under `allModels` and `byModelAll` and kept out of the headline: it took 55 s to 50 minutes per job, so a full set did not fit the run, and it only raises the ratios.
- Redo time and tokens are the job runtime's own record. Redo cost is those tokens at each model's list price on the date above ([prices](check-vs-redo.json), key `prices`). Check cost is compute only: AWS Lambda x86 at $0.0000166667 per GB-second, 1 GB, plus $0.20 per million requests.
- Offline check: `verifyPortableProofEnvelope` from `@proofable/sdk` 0.1.13, ten times per receipt, on an Intel i9-9900K. Read by id: no account, five times per receipt, one request every 1.6 s.
- The answers are not graded for quality. Each answer contains its task's key fact (90 of 90); this run measures what a later party pays to reuse a finished result.

## Check it yourself

Every receipt is listed in [receipts.txt](receipts.txt), and its signed envelope is saved in [receipts/](receipts/).

```sh
npm install
node check.mjs              # read each receipt by id, then verify it offline
node check.mjs --offline    # verify the saved envelopes only, no network
```

Every row, including per-job timings, tokens and costs, is in [check-vs-redo.json](check-vs-redo.json).
