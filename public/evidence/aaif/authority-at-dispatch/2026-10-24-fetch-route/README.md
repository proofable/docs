# The fetch route, one run, retained

One job created through the released hosted MCP on 2026-10-24 at 17:47 UTC, on service revision
`18433a48d74af913550de7a018f02c7c724cc1c9` with hosted MCP `0.1.7`. The job's one permitted action
was a fetch of a public URL carrying a marker generated for this run. Every file here was produced by
that run and is unedited. Checksums are in [`SHA256SUMS`](./SHA256SUMS).

This answers the request in
[agentrust-io/integrations#333](https://github.com/agentrust-io/integrations/issues/333) for a
copyable example of the dispatch-only, correlation-only route.

## Files

| File | What it is | Signed |
| --- | --- | --- |
| `1-invocation.json` | Endpoint, method, tool, version, revision and the identities used | no |
| `2-request-arguments.json` | The `arguments` object sent to `proofable_job_create`, as sent | no |
| `3-create-response.txt` | The raw response body, unedited | no |
| `4-dispatch-decision.json` | The stored dispatch decision, with its portable proof envelope | yes |
| `5-job-record.json` | The finished job as the service holds it | no |
| `6-terminal-receipt.json` | The stored terminal receipt, with its portable proof envelope | yes |
| `health-at-run.json` | The service health response captured at run time | no |
| `verify.mjs` | Every check below, offline | |

## The call

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "name": "proofable_job_create", "arguments": "<2-request-arguments.json>" }
}
```

The arguments object is retained byte for byte. The JSON-RPC envelope around it is the standard MCP
`tools/call` shape. The credential is omitted.

The response returned `jobId` `d259c7cc-0701-4624-a148-77b149f84e06`, outcome `ALLOW`, and the
decision qHash `0x74c441e6dad0d45b4804ada7a849d67f617dc064c8357b74fe9766b0d2f44f11` together. The
job made one tool call, a fetch of the URL in the prompt, and returned the marker the target served,
`target-ack 6b86b1f0cd3adaced3f1`. The terminal receipt is
`0xc21e33aa6f0f0308096b816a2bcce767fc2606bc20afeacc5e4874833e04b2f8`.

## Who signed what

The Proofable service wallet, address `0xa41494e1e5f9e5eaf786961e6ef84cd1a3071eec`, signs both
records (EIP-191 over the CAIP-380 verification message). The `owner` field in each record is the
account the job ran under, `0x0d4e513a3a7eb92bab65c97786c67b198d9dca15`. The decision names that
account's permission grant by its qHash. The grant itself is not in this packet.

The decision commits to the request through `argsDigest`: SHA-256 of `JSON.stringify` over this
object, in this key order.

```js
{
  agentId,
  agentWallet,          // lowercased
  prompt,
  runtime,              // null when the request has none
  requiresJobApproval,  // false when the request has none
  acceptance: { criterion, mode },
}
```

Fields outside it, here `runNowFirst` and the `criteria` alias, are not committed. The run-unique URL
and marker are inside `prompt`, so the decision commits to them.

## Check it

```sh
sha256sum -c SHA256SUMS
npm install ethers@6
node verify.mjs
```

`verify.mjs` prints `MATCH` for each of these, and exits non-zero on any mismatch:

1. Each envelope's signature recovers to the service wallet address, and its qHash recomputes from the
   envelope (SHAKE-256, 32 bytes, over the sorted canonical JSON of `did`, `verifierIds`, `data`,
   `signedTimestamp` and `chainId`).
2. `argsDigest` recomputes from `2-request-arguments.json`.
3. `argsDigest` also recomputes from the fields the signed receipt carries. The receipt has no
   `runtime` or `requiresJobApproval` field, so their defaults are used.
4. The create response's decision qHash is the decision envelope's, and its `jobId` is the one
   inside the signed receipt.

## Unsigned or correlation-only links

1. **Decision to job.** The decision's `jobId` is `null`, because it is recorded before the job
   exists. The tie is the unsigned create response, plus check 3: both signed records carry the same
   request. Two jobs sent with identical requests would share a digest. The run-unique URL is what
   makes this one distinct.
2. **Executor to target.** The fetch is a plain GET with no executor signature. Target ingress is
   tied to the job only by the run-unique URL and marker in the prompt.
3. **Service responses.** The create response, the job record and the health response are what the
   service returned. They are not signed records.

## Boundaries

- The target here is a public request bin, not an operator-owned target, and its request log is not
  in this packet. An operator-owned target and observer are what would establish the effect.
- Dispatch-only. The delegation is re-read before each tool call. Nothing rechecks it while a call is
  in flight or when the target commits.
- Authority unavailability does not apply on this path. Authority is evaluated inside the service,
  so there is no separate authority to make unreachable.
- Proofable ran this and observed it. No outside party has run it.
