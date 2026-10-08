# Reviewer handoff — Proofable `e1217327a`, 2026-10-08

Two minimal, reviewer-side patches so the existing upstream reader implementations can appraise the
current Proofable evidence package. They are proposals for the respective owners, not changes made
to their repositories.

## Evidence under review

| | |
| --- | --- |
| Evidence commit | [`proofable/docs` `bbd7ee67b8d15557b032c8724cbbc4c4f0d14bce`](https://github.com/proofable/docs/tree/bbd7ee67b8d15557b032c8724cbbc4c4f0d14bce/public/evidence/aaif/authority-at-dispatch/2026-10-08) |
| Path | `public/evidence/aaif/authority-at-dispatch/2026-10-08/` |
| Deployed revision | `e1217327a1568b39d5153686b8085471b5329cde` |
| Run | eight-case authority suite plus one ordered post-revocation probe |

Every file in the packet is LF-only, and every published digest is computed over those exact bytes,
so a reader re-hashing the committed bytes always agrees.

## Patches

### `probityai.patch` — ProbityAI `agent-evidence-observer` (PR #81)

Pinned revision: `c805406636f23e445a186d4b58cf15c54f958cdd`.

- Repins `SOURCES.json` to the `bbd7ee6` package and its exact content hashes.
- Replaces the reader check that previously hard-coded the post-revocation boundary as unobserved
  with an actual observation of the new `dispatch_sequence` (revocation time, the following `DENY`,
  its reason, and both anchors).
- Performs the envelope check instead of skipping it: a new `portable_envelope.py` recomputes the
  CAIP-380 qHash and recovers the EIP-191 signer from the published bytes, independently of
  Proofable's runtime and SDK.
- Keeps the refusal controls and adds negative cases (unordered sequence, a missing event, a missing
  revocation time, an `ALLOW` next dispatch, a tampered signature, an envelope-count mismatch). No
  check is weakened.

### `alakris.patch` — Alakris shared comparison runner (PR #288)

Pinned revision: `8598d1028bf6c0986c676829fe906f72d63363e0`.

- Repins the evidence in `fetch_fixtures.py` and `check_package.py` to the `bbd7ee6` package.
- Resolves the two prior review blockers: every one of the 14 required fields now carries an explicit
  `state` and `reason`, and the package's lint gate is satisfied.
- Performs the disclosed-envelope verification and enforces it: `check_package.py` fails loudly if
  the pinned bytes change or the signatures do not verify, rather than expecting the historical
  checksum failure.

Apply from the root of each checkout:

```sh
git apply probityai.patch      # in probityai/agent-evidence-observer
git apply alakris.patch        # in aaif-publication-reference
```

## Recorded results (observed locally, 2026-10-08)

| Reviewer | Reader result | Tests |
| --- | --- | --- |
| ProbityAI (patched) | 0 failures (14 checks) | 37 passed |
| ProbityAI (unmodified, this package) | 1 fail — the historical hard-coded boundary line | 4 failed / 29 passed |
| Alakris shared runner | integrity PASS (8/8 checks, 4 cases × 14 fields) | 30 passed |

A tampered envelope, an incomplete or unordered dispatch sequence, or a changed pinned byte all fail
closed. The unmodified ProbityAI reader's single failure on this package is the check the patch
replaces.

Rerun both reviewers against a package in one command:

```sh
node runners/aaif/verify-peer-readers.mjs <packet-dir>
```

It checks out each reviewed revision, applies the patch, and exits non-zero unless both accept.

## Scope and limitations

Author-operated (SELF): the producer is the same organization as the reporter, and there is no
independent witness. This handoff enables **independent code-based appraisal of published evidence**
— it is not an independent third-party execution, an AAIF conformance claim, an AARM rank, or
target-side effect custody. Platform observations are not promoted into third-party confirmation.
Independent reproduction is not claimed, and revocation latency is not measured. A genuinely
independent live execution on the hosted system is a separate, later stage.

Signatures prove that an envelope is internally consistent and bound to its signer; they do not
establish that any off-chain fact behind it is true.
