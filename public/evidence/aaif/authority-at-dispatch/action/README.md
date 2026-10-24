# Proofable trust harness — GitHub Action

Runs the eight authority-at-dispatch cases on your own Proofable account from your CI, verifies
every sealed record offline, and writes a `trustharness.report/v1` report your reviewer can check.

This action does not reimplement the measurement. It reads the kit at a pinned commit of
`proofable/docs` and runs it, so the command in the [reproduce guide](../reproduce/README.md) and
the command in your CI are the same command.

## Use it

```yaml
# .github/workflows/proofable.yml
name: Proofable trust harness
on: [workflow_dispatch, pull_request]

jobs:
  authority:
    runs-on: ubuntu-latest
    steps:
      - uses: proofable/docs/public/evidence/aaif/authority-at-dispatch/action@<commit-sha>
        with:
          access-key: ${{ secrets.PROOFABLE_ACCESS_KEY }}
          operator: ${{ github.repository_owner }}
          kit-ref: <commit-sha>
```

Add `PROOFABLE_ACCESS_KEY` as a repository secret. Create the key under
[Profile → Account → Access keys](https://proofable.me/profile?tab=account). The cases run hosted
jobs, so they spend the account's credits (one full run is eight jobs, roughly six to eight
minutes).

Pin `kit-ref` to a commit sha for a reproducible run. The resolved sha is recorded in the report
either way, so an unpinned run is still attributable.

## Inputs

| Input | Required | Default | Purpose |
| --- | --- | --- | --- |
| `access-key` | yes | — | `npk_…` access key from the account that pays for the run |
| `operator` | yes | — | Who ran it; recorded as the custodian in every record |
| `agent-id` | no | `aaif-authority-review` | Review agent id; give each reviewer on one account its own |
| `cases` | no | `all` | Space-separated case names, or `all` |
| `kit-ref` | no | `main` | docs ref the kit is read from |
| `fail-on-failure` | no | `true` | Fail the job when the offline check does not pass |
| `report-path` | no | `proofable-report.json` | Where to write the report |

## Outputs

| Output | Meaning |
| --- | --- |
| `report` | Path to the `trustharness.report/v1` JSON |
| `passed` / `total` | Cases passed, cases attempted |

The sealed run directory and the report are uploaded as the `proofable-trust-harness` artifact, and
the report summary is written to the job summary.

## What the report says and does not say

The report carries only what the run measured: per-case outcome, whether each record verified
offline, and the deployed revision observed. Cost and performance rows are `null` with a reason,
because this kit does not measure them. Comparison figures are a link to
[docs.proofable.me/evidence](https://docs.proofable.me/evidence), which owns every number.

`arm` is always `self-run` here: you drove the run on your own account. An independent run by a
third party is the next tier, not this one.

Report shape: [`schema.json`](schema.json).
