# The scripts behind the Trust Harness Audit

This script reproduces the governance scores the Trust Harness Audit reports: the same 48 agent-governance scenarios, without Proofable and with it. It reads only, and it never runs your code outside the disposable computer the run happens in.

## Without Proofable, `agentgovbench.sh`

Runs [AgentGovBench](https://github.com/agentic-control-plane/agentgovbench), the open library of 48 agent-governance scenarios, against an agent repository, at the same library commit as the table on [docs.proofable.me/benchmark](https://docs.proofable.me/benchmark). Every scenario is deterministic, so a rerun on the same commit gives the same score.

```sh
bash agentgovbench.sh path/to/your-agent /tmp/trust-harness
```

It runs the library's no-governance floor and the native runner for each agent framework the repository uses (CrewAI, LangGraph, the OpenAI Agents SDK, the Anthropic Agent SDK, Claude Code, Codex or Cursor), and prints each score out of 48 with its eight categories and the scenarios that failed. Needs Linux with git, uv, ripgrep and Python 3.10 or later.

To score your agent's own permission code, add a runner for it to the library's `runners/` folder, as its contributing guide describes, and run `python -m benchmark.cli run --runner <name>`.

## With Proofable

The same 48 scenarios decided by the policy module the live service runs, pinned by hash, beside the eight authority-at-dispatch cases. Those cases drive a live agent under your own permission and your own key, so they run from the benchmark page rather than from a container: [the eight live tests](https://docs.proofable.me/benchmark#agents-only-do-what-you-allowed) and the [prompt-injection test kit](https://github.com/proofable/mcp/tree/main/examples/injection-test).
