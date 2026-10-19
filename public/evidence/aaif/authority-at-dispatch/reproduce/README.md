# Run the authority-at-dispatch cases yourself

This kit runs Proofable's eight permission cases against the live service, then verifies every
record offline.

## What you need

- Node.js 20 or later
- An access key (`npk_…`). Reviewers: ask and we send one, valid for 30 days. It belongs to a
  Proofable test account; the agent wallet and the run folder are created on your machine. Keep the
  key out of chat and version control.

## Run it

```sh
npm install
export PROOFABLE_ACCESS_KEY=npk_...
export AAD_OPERATOR="Your Organization"

node aad.mjs setup        # creates a local agent wallet and registers your review agent
node aad.mjs run          # all eight cases, about 6 to 8 minutes
node aad.mjs verify runs/<run-id>
```

`verify` needs no network and no account. Run one case with `node aad.mjs run <case>`; list them
with `node aad.mjs cases`.

## The cases

| Case | What it does | Expected |
| --- | --- | --- |
| `hosted_allow` | Permission covers the job | Runs and completes |
| `binding_veto` | The job needs an action the permission leaves out | Refused before it runs |
| `approval_reachable` | The job needs approval and you approve | Held, then runs |
| `approval_unavailable` | The job needs approval and nobody answers | Never runs; a late approval is refused |
| `revoke_before_dispatch` | Permission revoked, then used | Refused; no job created |
| `expiry_before_dispatch` | Permission used after it expires | Refused; no job created |
| `stale_authority` | Revoked permission reused twice, plus a valid control | Both refused; the control runs |
| `post_dispatch_revoke` | Permission revoked while a job runs, then used again | The running step finishes; the next is refused |

## Not measured

How long a revocation takes to reach the check, and the effect at the target: effects are recorded
as the service observed them.

## Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `PROOFABLE_ACCESS_KEY` | required | your access key |
| `AAD_OPERATOR` | required | your name or organization, recorded in every record |
| `AAD_AGENT_ID` | `aaif-authority-review` | review agent id; give each reviewer sharing an account their own |
| `AAD_RUN_ID` | `aad-<timestamp>` | run folder name |
| `AAD_APPROVAL_HOLD_MS` | `0` | how long an approval stays unanswered before the hold ends |
| `AAD_REVOKE_AFTER_MS` | `12000` | delay before the mid-job revocation |
