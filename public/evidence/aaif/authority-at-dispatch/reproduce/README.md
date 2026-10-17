# Run the authority-at-dispatch cases yourself

This kit runs Proofable's eight permission cases against the live service under your own account,
then verifies every record offline. Everything it writes stays on your machine and belongs to you.

## What you need

- Node.js 20 or later
- A Proofable account with Pro. Jobs need Pro. Reviewers get 30 days free: email
  [dev@proofable.me](mailto:dev@proofable.me) with your account handle.
- An access key for that account (`npk_…`): run `npx -y @proofable/sdk setup`, or create one under
  your account's access keys. Keep it out of chat and version control.

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

How long a revocation takes to reach the check. Effects are recorded as the service observed them;
to watch the target yourself, point the `post_dispatch_revoke` step at a system you control.

## Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `PROOFABLE_ACCESS_KEY` | required | your access key |
| `AAD_OPERATOR` | required | your name or organization, recorded in every record |
| `AAD_RUN_ID` | `aad-<timestamp>` | run folder name |
| `AAD_APPROVAL_HOLD_MS` | `0` | how long an approval stays unanswered before the hold ends |
| `AAD_REVOKE_AFTER_MS` | `12000` | delay before the mid-job revocation |
