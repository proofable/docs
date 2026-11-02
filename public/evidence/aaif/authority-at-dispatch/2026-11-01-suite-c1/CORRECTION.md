# Correction to 2026-11-01-suite

This directory corrects the packet at [`../2026-11-01-suite/`](../2026-11-01-suite/) — `2026-11-01-suite@9358761ff88444425b85fc77266609916de4c16b`.

**No evidence was re-run and no record changed.** The run, the revision, the job and authority records
and every disclosed envelope are those of `aad-2026-11-01T22-24-26-865Z` on `0d1b934f40d38233fa588267354fcccec5e1edeb`. This revision corrects wording and
grading scope, and is identified separately so that a reader can tell a correction from a new evaluation.
The packet it corrects stays published and hash-pinned.

## What changed

1. `manifest.json` → `grading_scope.binding` states what `observed_matches_expected` grades: the authority
   predicate of each case together with the typed boundary capture for `post_dispatch_revoke`. It does not
   grade the literal committed-effect clause of the expectation as first written.
2. `manifest.json` → `post_dispatch_revocation.separates` no longer describes the earlier action as already
   committed. It states the boundary outcome this run recorded (`refused_at_tool_call`).
3. `trace.jsonl` → the `post_dispatch_revoke` record carries `expectation_status: superseded_by_revision`
   and `expectation_revised`, so the expectation the run was appraised against is retained and marked rather
   than silently matched.

## What each payload hash covers

| File | In the packet corrected | In this revision | Status |
| --- | --- | --- | --- |
| `README.md` | `717353e0ae497c4754051e09b5f97050526beaa2a20eb1ec75011e986c183bd4` | `fc86c842f5db0459dcb12d087914206637fb04dc6be46e62f63801815719c89c` | **changed** |
| `manifest.json` | `155c554f8ba975a01fc6aa664dc5f4c331c5ccf497d588cb7fb2414ad2f56e45` | `dcfd7c123ec4808e16f1577a4bfbd9be380f494df1319a5476441683ef7ab9e4` | **changed** |
| `authority-effect-results.md` | `5f99ab626b65d48725812e7b4371a510ce0b0dca6d70749e8831496f0428b558` | `35967f2aa21b03389d91dace21bcb387932a94d5ac69a794400716c96a72c1a2` | **changed** |
| `authority-effect-results.json` | `63592305352d5d82cf129f451ae424dde7b66c2b6b2ed7705b12f3d6230c04c2` | `63592305352d5d82cf129f451ae424dde7b66c2b6b2ed7705b12f3d6230c04c2` | unchanged |
| `trace.jsonl` | `feea298e0c4d923afba7fadc867715162a5554e94886a977a3a8fdb8f93188a9` | `5d55f221d9a096e207b3a0bc5368c142b9932c9a3a8696031d43a40823037818` | **changed** |
| `portable-proofs.json` | `9bc0f10ca4175c2a9f27225360a95094a963976849b378d0b2c2dda85f4b0f49` | `9bc0f10ca4175c2a9f27225360a95094a963976849b378d0b2c2dda85f4b0f49` | unchanged |
| `verify-portable-proofs.mjs` | `f7eb8f74885518b3ba0d945f60500e3236a25ad569fdcc6c8e44af462eaa3248` | `f7eb8f74885518b3ba0d945f60500e3236a25ad569fdcc6c8e44af462eaa3248` | unchanged |
| `CORRECTION.md` | — | this file | added |

Verify both: `sha256sum -c SHA256SUMS` here, and the same command in `../2026-11-01-suite/`, which is unchanged.
