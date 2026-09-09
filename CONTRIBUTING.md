# Contributing

**If you are integrating Proofable into a product**, use **[docs.proofable.me](https://docs.proofable.me)** and the live product first. The table below is for people proposing changes here.

| Need | Where |
| --- | --- |
| Product documentation | [docs.proofable.me](https://docs.proofable.me) |
| Possible bugs | [Issues](https://github.com/proofable/docs/issues) |
| Ideas and questions | [Discussions](https://github.com/proofable/docs/discussions) |
| Security reports | [dev@proofable.me](mailto:dev@proofable.me) (do not post publicly) |
| Release notes | [CHANGELOG.md](./CHANGELOG.md) |

## What lives here

The published documentation at [docs.proofable.me](https://docs.proofable.me), the OpenAPI description, and the public verifier catalog. Client code lives in [proofable/sdk](https://github.com/proofable/sdk); MCP discovery metadata lives in [proofable/mcp](https://github.com/proofable/mcp).

## What helps

- Corrections where a page no longer matches what the live product does.
- Verifier proposals that spell out the user-visible outcome you want.
- Runnable examples, and the errors a builder will actually hit.

**Do not** share keys, tokens, bearer secrets, or private proof content in public issues or change descriptions.

## Verifier proposals

The public verifier catalog lives in **this repo**: JSON Schemas under [`verifiers/schemas/`](./verifiers/schemas) and the machine index at [`verifiers/VERIFIERS.json`](./verifiers/VERIFIERS.json). Open a [Discussion](https://github.com/proofable/docs/discussions) first, then a PR with the spec, the schema, and the docs page together. Once merged, it propagates to the protocol verifier registry. See [Propose a verifier](https://docs.proofable.me/verification/propose-a-verifier) for the full flow.

## Do not commit

These paths are local-only or generated elsewhere (see `.gitignore`):

- `.env`, `.npmrc`, secrets, and key material
- Generated OpenAPI output and build artifacts

## Describing your change

Explain **what builders or end users will experience differently** (for example new fields, new errors, or renamed concepts). If you adjust verifiers or any documented HTTP surface, keep the written API reference and examples aligned with the live product.
