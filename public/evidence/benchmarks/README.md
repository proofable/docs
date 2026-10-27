# Benchmarks

The scripts behind the two benchmarks Proofable runs for anyone on proofable.me. Each one reads what it checks and changes nothing, so you can run it yourself and see exactly what a report rests on.

## MCP Server Benchmark

Reads one MCP server's discovery, its tool, prompt and resource lists and its public sign-in metadata. It never calls a tool and never sends a credential. The report scores what it read against the MCP specification (revisions 2026-07-28 and 2025-11-25) and the OWASP MCP Top 10.

```sh
node mcp-server/probe.mjs https://your-server.example/mcp
```

Needs Node.js 22 or later. It prints one JSON object that lists every request it made.

## Agent Repo Benchmark

Runs OSV-Scanner, Gitleaks and Semgrep Community Edition on a repository under fixed time limits, and lists the lines each code check reads. The report scores them against the OWASP Top 10 for Agentic Applications 2026 and the OWASP MCP Top 10. It runs none of the repository's code.

```sh
bash agent-repo/scan.sh path/to/repo /tmp/agent-repo-benchmark
```

Needs Linux with curl, ripgrep and Python 3. It downloads the latest scanner releases from their official GitHub release pages.
