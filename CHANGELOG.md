# Changelog

All notable changes to the Proofable public docs are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product release notes: [docs.proofable.me/changelog](https://docs.proofable.me/changelog).

## [Unreleased]

### Added

- **`proofable_proofs_update` reference page.** The 13th hosted MCP tool is documented: title and tag updates on proofs you own, with the portable status convention (`status:backlog|todo|in-progress|review|done`, `workspace:<namespace>`).

## [0.1.1] - 2026-09-13

### Added

- **Changelog page.** Product release notes with tag filters and an RSS feed at [docs.proofable.me/changelog](https://docs.proofable.me/changelog), including a readable summary of the predecessor `@neus` releases.
- **Migration guide.** One path from `@neus` packages to `@proofable` at [docs.proofable.me/migrate](https://docs.proofable.me/migrate).
- Code of Conduct, support page, and short GitHub issue and pull request templates.

### Changed

- **One description per public surface.** GitHub, npm, registry, and product docs descriptions use the locked surface lines instead of repeating the product line.
- **Builder docs lead with inline gates.** `defineGate` and subject `gateCheck` first; a published `gateId` is optional.
- **Pay-per-call documents x402** on both `GET` and `POST /api/v1/proofs/check`, plus verification and access-grant.
- Use-case examples use generic agent names.
- Contributor and verifier-proposal pages describe this repository only, with `npm run validate` as the public check.

## [0.1.0] - 2026-09-06

### Added

- First standalone Proofable documentation release.
- Public SDK, MCP, API, verifier, security, billing, and integration guidance.

[Unreleased]: https://github.com/proofable/docs/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/proofable/docs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/proofable/docs/releases/tag/v0.1.0