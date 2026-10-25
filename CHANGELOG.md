# Changelog

All notable changes to the Proofable public docs are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product release notes: [docs.proofable.me/changelog](https://docs.proofable.me/changelog).

## [Unreleased]

### Added

- **Changelog entries for `@proofable/mcp` 0.1.7 and `@proofable/sdk` 0.1.6.**
- **Eligibility clause in the Terms of Use.** Section 4 states the minimum age and the capacity to contract.
- **Background jobs keep proofs private and offchain.** [Proofs](/proofs) says that a background job's request for a blockchain record, a public or link-only proof, or a visibility change is refused with `JOB_ONCHAIN_PUBLISH_DENIED`, `JOB_PUBLIC_PROOF_DENIED` or `JOB_VISIBILITY_CHANGE_DENIED`.

### Changed

- **What a connection carries.** [MCP tools](/mcp/tools) lists every tool a signed-in connection gets on every plan: the proof and permission tools, jobs, the hosted browser, connected apps, session notes, saved tools, web search, page fetch, remote MCP servers run through Proofable, and your saved keys (list, remove, or call a provider with one, never reading the key back). Web search, page fetch, connected-app actions and remote server calls are metered per call, and [Pricing](/pricing) lists the rates. A key is saved on your profile rather than through a client ([Secrets](/mcp/secrets)), and the [OAuth scope table](/mcp/oauth) says what each scope reaches.
- **One Evidence page.** [Evidence](/evidence) opens on seven results across governance and runtime cost: 48 of 48 AgentGovBench scenarios beside the agent tools teams already use, 6 of 6 data-theft attempts refused by a scoped permission in the prompt injection test, every unauthorized action stopped in 8 of 8 live tests, $0.024 vs $0.078 handing work between agents with a signed receipt (catching 3 of 3 tampered handoffs), 42.4 times fewer tokens (105,347 vs 4,462,980) reading typed vault state over keyword search, 3.1 times lower worst-case token tail against open-web search, and a reused result about 750 times faster to verify offline than redoing the job. Its charts switch to a stacked layout on phones. Each result links to its signed record and a way to check or rerun it, and security reviewers get the OWASP, EU AI Act, NIST and CAIP-380 mapping in one section. `/benchmarks` and `/use-cases/authority-at-dispatch` now open it.
- **Jobs and the hosted computer on every plan; Advanced on Pro.** [Jobs](/jobs) and [Pricing](/pricing) list what a run costs: 1 credit per run on any model or key, hosted tokens by tier, and 2 credits per vCPU for each started minute of a hosted machine. The Advanced hosted tier is on Pro, Partner and Enterprise; any model runs on your own key on every plan.
- **Two checks you can run on the published records.** `public/evidence/checks/tamper-check.mjs` forges each signed record ten ways and confirms every copy is rejected offline; `reuse-check.mjs` times reading and verifying a finished result with no account.
- **A fresh run of the eight authority cases on the live service.** All eight passed on the revision production was serving, with 17 signed records. Requests that should not have been allowed were refused before any job ran; the case that needs approval waited for it and then ran; and a valid request ran alongside the refusals to show the check can pass. The records need no account to read or verify, and the run lives at `public/evidence/aaif/authority-at-dispatch/2026-10-24-served/`.
- **Jobs run on credits on every plan.** [Jobs](/jobs) says what a run costs and lists the job tools a connection carries, and the team-agents and reproduce guides no longer say jobs need Pro.
- **Agent id format is in the schemas.** `agentId` in `agent-identity` and `agent-delegation` is 1 to 128 letters, digits, hyphens or underscores, the same id the agent page uses.

### Removed

- **`delegationScope` on `GET /api/v1/proofs/check`.** The filter matched a field agent-delegation proofs do not carry, so it never narrowed a result. Match delegations on `agentId` or `controllerWallet`.

### Fixed

- **Terms of Use and Privacy Policy updates.** Section 6 of the Terms links directly to the Privacy Policy, and the Privacy Policy documents per-tool inputs, outputs, and third-party destinations.
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

- **One description per public surface.** GitHub, npm, registry, and product docs descriptions each describe what that surface provides.
- **Builder docs lead with inline gates.** `defineGate` and subject `gateCheck` first; a published `gateId` is optional.
- **Pay-per-call documents x402** on both `GET` and `POST /api/v1/proofs/check`, plus verification and access-grant.
- Contributor and verifier-proposal pages describe this repository only, so a reader knows which surface they are on.

## [0.1.0] - 2026-09-06

### Added

- First standalone Proofable documentation release.
- Public SDK, MCP, API, verifier, security, billing, and integration guidance.

[Unreleased]: https://github.com/proofable/docs/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/proofable/docs/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/proofable/docs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/proofable/docs/releases/tag/v0.1.0