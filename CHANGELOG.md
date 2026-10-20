# Changelog

All notable changes to the Proofable public docs are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product release notes: [docs.proofable.me/changelog](https://docs.proofable.me/changelog).

## [Unreleased]

### Added

- **Changelog entries for `@proofable/mcp` 0.1.7 and `@proofable/sdk` 0.1.6.**
- **Eligibility clause in the Terms of Use.** Section 4 states the minimum age and the capacity to contract. The Terms had no eligibility or age statement before.

### Changed

- **One Evidence page.** [Evidence](/evidence) opens on four charted results: every unauthorized action stopped in 8 of 8 live tests, 150 of 150 forged records caught, a reused result about 750 times faster than redoing it, and 48 of 48 AgentGovBench scenarios. Each result links to its signed record and a way to check or rerun it, and security reviewers get the OWASP, EU AI Act, NIST and CAIP-380 mapping in one section. `/benchmarks` and `/use-cases/authority-at-dispatch` now open it.
- **Two checks you can run on the published records.** `public/evidence/checks/tamper-check.mjs` forges each signed record ten ways and confirms every copy is rejected offline; `reuse-check.mjs` times reading and verifying a finished result with no account.
- **One current version of the public case set.** Superseded evidence packets are no longer carried alongside the current one, so a reader finds a single up-to-date set.
- **Jobs run on credits on every plan.** [MCP tools](/mcp/tools) lists the job tools, including `proofable_job_decide`, for every signed-in plan, and the team-agents and reproduce guides no longer say jobs need Pro.
- **Agent id format is in the schemas.** `agentId` in `agent-identity` and `agent-delegation` is 1 to 128 letters, digits, hyphens or underscores, the same id the agent page uses.

### Removed

- **`delegationScope` on `GET /api/v1/proofs/check`.** The filter matched a field agent-delegation proofs do not carry, so it never narrowed a result. Match delegations on `agentId` or `controllerWallet`.

### Fixed

- **Terms of Use: the limitation of liability now names the correct legal entity.**
- **Terms of Use: the privacy section contradicted the Privacy Policy.** Section 6 now points at the Privacy Policy as authoritative and lists the categories it documents.
- **Privacy Policy: retention bound.** Records held only for operating, securing, or auditing the Service are removed within 24 months of account closure, outside records kept by law, by an open dispute, or on a public network.

## [0.1.2] - 2026-09-24

### Added

- **`proofable_proofs_update` reference page.** The 13th hosted MCP tool is documented: title and tag updates on proofs you own, with the portable status convention (`status:backlog|todo|in-progress|review|done`, `workspace:<namespace>`).

### Changed

- **Agent authority is listed explicitly in the public contract.** The public OpenAPI spec and verifier schemas document `allowedActions` (required, never empty), `deniedActions`, `allowedPaymentTypes`, and `allowedOrigins`; the legacy `scope` and `permissions` fields are removed. Spend delegations require `allowedPaymentTypes` and `maxSpend` together.

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
- Contributor and verifier-proposal pages describe this repository only, so a reader knows which surface they are on.

## [0.1.0] - 2026-09-06

### Added

- First standalone Proofable documentation release.
- Public SDK, MCP, API, verifier, security, billing, and integration guidance.

[Unreleased]: https://github.com/proofable/docs/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/proofable/docs/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/proofable/docs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/proofable/docs/releases/tag/v0.1.0