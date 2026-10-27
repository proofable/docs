# Trust Harness Benchmark

The script behind Proofable's Trust Harness Benchmark. It runs [AgentGovBench](https://github.com/agentic-control-plane/agentgovbench), the open library of 48 agent-governance scenarios, against an agent repository, at the same library commit as the table on [docs.proofable.me/evidence](https://docs.proofable.me/evidence). Every scenario is deterministic, so a rerun on the same commit gives the same score.

```sh
bash agentgovbench.sh path/to/your-agent /tmp/trust-harness
```

It runs the library's no-governance floor and the native runner for each agent framework the repository uses (CrewAI, LangGraph, the OpenAI Agents SDK, the Anthropic Agent SDK, Claude Code, Codex or Cursor), and prints each score out of 48 with its eight categories and the scenarios that failed. Needs Linux with git, uv, ripgrep and Python 3.10 or later.

To score your agent's own permission code, add a runner for it to the library's `runners/` folder, as its contributing guide describes, and run `python -m benchmark.cli run --runner <name>`.
