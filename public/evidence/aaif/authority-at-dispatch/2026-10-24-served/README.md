# Eight authority cases on revision `61724c9f4`

Proofable ran this on 2026-10-24 at 02:29 UTC, against the service revision production was serving
at the time, `61724c9f4592f00858a31ef0ac7fa4dcdc67e160`, with hosted MCP `0.1.7`. The run used the
kit in [`../reproduce/`](../reproduce/) unchanged, exactly as that page describes.
The code that graded it is `reproduce/aad.mjs` at
[`9d1307b`](https://github.com/proofable/docs/blob/9d1307b/public/evidence/aaif/authority-at-dispatch/reproduce/aad.mjs),
SHA-256 `afbb0cf8541c3916967707143b5be56556051b32797b2a6b52aae6f423234f79`. Check that version out to
grade the run with the exact code that graded it.

This is the current run. It replaces [`../2026-10-08-eight-case/`](../2026-10-08-eight-case/), which
stays at its own commit.

## What happened

| | |
| --- | --- |
| Cases | 8 of 8 passed, no errors |
| Signed records | 17, every one verified offline |
| Requests that should have been refused | none ran. `binding_veto` and `approval_unavailable` each created a job that ended without an executor; every other refusal came before a job was created |
| Control | `stale_authority` also includes a valid request, and that one ran and completed |
| Reading the records | no account needed. Each record is link-only, so the link is the access |

| Case | What it tests | Result |
| --- | --- | --- |
| `hosted_allow` | the permission covers the job | ran and completed |
| `binding_veto` | the job needs something the permission leaves out | a job was created and refused before any executor ran; it ended failed |
| `approval_reachable` | the job needs approval, and the operator approves | held, then ran |
| `approval_unavailable` | the job needs approval, and nobody answers | a job was created and held. The owner cancelled it, so it never ran. A late approval was refused too |
| `revoke_before_dispatch` | permission revoked, then used again | refused, and no job was created |
| `expiry_before_dispatch` | permission used after it expires | refused, and no job was created |
| `stale_authority` | revoked permission reused twice, plus a valid request | both refusals held, and the valid request ran |
| `post_dispatch_revoke` | permission revoked while a job runs, then used again | the running step finished, and the next request was refused |

## Who ran it

An ordinary Proofable account ran it: not an admin, with its own agent wallet and a fixed permission,
through the public hosted MCP endpoint. That is the same access every account gets, so anyone can
rerun these cases on their own account with the kit in [`../reproduce/`](../reproduce/). This copy is
the published run directory, unchanged, sealed by [`SHA256SUMS`](./SHA256SUMS).

## What this measures, and what it does not

Measured: whether each case's decision matches the permission state, whether a refused request
created a job, and whether an allowed job completed.

Not measured: how long a revocation takes to reach the check, and the effect at the far end of the
call. Each record lists these under `not_measured`.

One field is easy to misread. Each case hands the service a sentence describing acceptance rather
than a rule a machine can check, so the service's own evaluator reports `acceptedOutcome: false` on
the job record even when the case behaved exactly as the table above says. The case result does not
use that field. It rests on the final receipt, the decision, and the response each job returned.
Read `passed` in `MANIFEST.json`, not the job's acceptance flag.

## Check it yourself

```sh
cd 2026-10-24-served && sha256sum -c SHA256SUMS
cd ../reproduce && node aad.mjs verify ../2026-10-24-served
```

You can also open any receipt in a browser as `https://proofable.me/proof/<qHash>`. The records are
link-only, so the link is the access, and no account is needed.

## What an evaluator looks for, and where it is here

| What is being checked | This run |
| --- | --- |
| What the run actually changed | the job's final state and its signed receipt |
| Who ran it | an ordinary, non-admin account on the public endpoint, with its own agent wallet and permission |
| The artifacts | published here, sealed by `SHA256SUMS` |
| State before and after, tied to the run, the action and the target | permission state, decision, dispatch, outcome and receipt, in that order, for every case |
| Digests of the artifacts | `SHA256SUMS`, plus a digest inside each record |
| A request that is allowed, to prove the check can pass | `hosted_allow`, and the control inside `stale_authority` |
| What was not measured, kept apart from what was | listed as `not_measured` in the manifest, never as a zero |

Files: `MANIFEST.json` for the run summary and the result of each case, one JSON record per case,
and `SHA256SUMS`.
