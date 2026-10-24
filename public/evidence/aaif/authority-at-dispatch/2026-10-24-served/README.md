# Eight authority cases on revision `61724c9f4`

Run 2026-10-24T02:29Z UTC by Proofable, on the service revision production was serving at the time:
`61724c9f4592f00858a31ef0ac7fa4dcdc67e160`, hosted MCP `0.1.7`. The kit that drove it is
[`../reproduce/`](../reproduce/), run as the page documents, with no local modification, at kit
version `aad-kit/1` as it stands in this tree.

This packet replaces [`../2026-10-08-eight-case/`](../2026-10-08-eight-case/) as the current run.
That packet stays at its commit as history.

## Result

| | |
| --- | --- |
| Cases | 8 of 8 pass, zero errors |
| Signed envelopes | 17, all verified offline |
| Denials | every case that must refuse, refused before a job existed |
| Controls | `stale_authority` includes a fresh valid control that ran and completed |
| Records | unlisted, readable by anyone with the link, no account needed |

| Case | What it exercises | Outcome |
| --- | --- | --- |
| `hosted_allow` | permission covers the job | ran, completed |
| `binding_veto` | the job needs an action the permission leaves out | refused before dispatch |
| `approval_reachable` | the job needs approval and the operator approves | held, then ran |
| `approval_unavailable` | the job needs approval and nobody answers | never ran; a late approval was refused |
| `revoke_before_dispatch` | permission revoked, then used | refused; no job created |
| `expiry_before_dispatch` | permission used after it expires | refused; no job created |
| `stale_authority` | revoked permission reused twice, plus a valid control | both refused; the control ran |
| `post_dispatch_revoke` | permission revoked while a job runs, then used again | the running step finished; the next dispatch was refused |

## Who ran it, and what that is worth

The operator is Proofable. Custody is `SELF`: the agent wallet and the run records were produced on
the operator's machine, by the operator's account, with no independent witness present.

- Independent witness of the committed effect: **none**. Effects are recorded as the service observed
  them at the job boundary.
- Relationship of the observer to the implementation: the observer is the implementation.
- Artifact custody: the operator holds the run directory; this copy is published unmodified and its
  digests are in [`SHA256SUMS`](./SHA256SUMS).

An outside observer would add what this run cannot: a readback taken at a target the operator does not
control. The fetch route supports that (see the dispatch-only packet on the AgenTrust thread); the
eight cases here do not use it.

## What is measured, and what is not

Measured: whether each case's authority decision matches the permission state, whether a refused case
created a job, and whether the job that was allowed completed.

Not measured, and named as such in every record: revocation latency (how long a revocation takes to
reach the check), and the committed effect at the target.

One field reads differently than it looks. These cases hand the service a free-text acceptance
sentence, not a machine-checkable criterion, so the service's own acceptance evaluator reports
`acceptedOutcome: false` on the job record even when the case behaved exactly as the table says. The
case verdict does not use that flag: it rests on the terminal receipt, the authority decision, and the
response each job returned. Read `passed` in `MANIFEST.json`, not the job's acceptance flag.

## Grade it yourself

```sh
cd 2026-10-24-served && sha256sum -c SHA256SUMS
cd ../reproduce && node aad.mjs verify ../2026-10-24-served
```

Or open any `receipt.qHash` in a browser as `https://proofable.me/proof/<qHash>`; the records are
unlisted, so the link is the access, and verification needs no account.

## Fields a working group grades on

| Field | This packet |
| --- | --- |
| committed effect | the job terminal state and its signed receipt |
| independent effect witness | none (self-observed) |
| observer identity and its relationship to the run operator | Proofable, the implementation and the operator |
| artifact custody | operator; published copy sealed by `SHA256SUMS` |
| before/after state bound to run, action and target | permission state, decision, dispatch, outcome, receipt, in that order, per case |
| artifact digests | `SHA256SUMS`, plus each envelope's own digest |
| permitted positive control | `stale_authority` control and `hosted_allow` |
| missing evidence kept distinct from measurements not performed | `not_measured` in the manifest, never a zero |

Files: `MANIFEST.json` (run summary and per-case verdicts), one JSON record per case, `SHA256SUMS`.
