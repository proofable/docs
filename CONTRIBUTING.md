# Contributing

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

To integrate Proofable into a product, start at [docs.proofable.me](https://docs.proofable.me). This page is for changes to this repository.

| Need | Where |
| --- | --- |
| Possible bugs | [Issues](https://github.com/proofable/docs/issues) |
| Ideas and questions | [Discussions](https://github.com/proofable/docs/discussions) |
| Security reports | [dev@proofable.me](mailto:dev@proofable.me) (do not post publicly) |
| Release notes | [CHANGELOG.md](./CHANGELOG.md) |

## What lives here

The published documentation, the OpenAPI description, and the public verifier catalog. Client code lives in [proofable/sdk](https://github.com/proofable/sdk); the MCP package, plugins and skills live in [proofable/mcp](https://github.com/proofable/mcp).

## What helps

- Corrections where a page no longer matches what the live product does.
- Verifier proposals that spell out the user-visible outcome you want.
- Runnable examples, and the errors a builder will actually hit.

Never share keys, tokens, bearer secrets, or private proof content in issues or pull requests, and never commit `.env` files, `.npmrc` files or key material.

## Verifier proposals

Open a [Discussion](https://github.com/proofable/docs/discussions) with the outcome you want verified. An accepted check ships once it is built into the Proofable service, and its schema then appears under [`verifiers/schemas/`](./verifiers/schemas) and in [`verifiers/VERIFIERS.json`](./verifiers/VERIFIERS.json). See [Propose a verifier](https://docs.proofable.me/verification/propose-a-verifier).

## Changelog

Put a user-facing note under `## [Unreleased]` in [CHANGELOG.md](./CHANGELOG.md). Use Added, Changed, Deprecated, Removed, Fixed, or Security. Write what a builder will notice. Leave out ticket IDs and private repository names.

## Describing your change

Say what builders or end users will experience differently, such as new fields, new errors, or renamed concepts. If you change a verifier or a documented HTTP surface, update the API reference and examples in the same pull request.
