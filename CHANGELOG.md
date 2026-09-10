# Changelog

All notable changes to the Proofable public docs are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Product release notes: [docs.proofable.me/changelog](https://docs.proofable.me/changelog).

## [Unreleased]

(nothing yet)

## [0.1.1] - 2026-09-09

### Added

- **Changelog page.** Product release notes with tag filters and an RSS feed at [docs.proofable.me/changelog](https://docs.proofable.me/changelog).
- **Migration guide.** One path from `@neus` packages to `@proofable` at [docs.proofable.me/migrate](https://docs.proofable.me/migrate), covering the rename map, the one-path upgrade, what carries over, and stale-state fixes for old setups.

### Changed

- **Status routing.** `/platform/status` now lands on the changelog. Release notes live there; repo changelogs keep per-package release records.
- **Announcement surfaces.** The navbar links the changelog, and a dismissible banner points `@neus` users at the migration guide.

## [0.1.0] - 2026-09-06

- First standalone Proofable documentation release.
- Public SDK, MCP, API, verifier, security, billing, and integration guidance.
- Proofable domains and repository ownership aligned across public documentation.
