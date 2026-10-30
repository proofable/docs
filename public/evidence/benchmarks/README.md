# The scripts behind the Trust Harness Benchmark

Three scripts cover one target: its agent-governance behaviour, its repository and MCP surface, and a live MCP endpoint when you have one. Every one reads only, and none of them runs your code outside the disposable computer the run happens in.

## Governance, `agentgovbench.sh`

Runs [AgentGovBench](https://github.com/agentic-control-plane/agentgovbench), the open library of 48 agent-governance scenarios, against an agent repository, at the same library commit as the table on [docs.proofable.me/evidence](https://docs.proofable.me/evidence). Every scenario is deterministic, so a rerun on the same commit gives the same score.

```sh
bash agentgovbench.sh path/to/your-agent /tmp/trust-harness
```

It runs the library's no-governance floor and the native runner for each agent framework the repository uses (CrewAI, LangGraph, the OpenAI Agents SDK, the Anthropic Agent SDK, Claude Code, Codex or Cursor), and prints each score out of 48 with its eight categories and the scenarios that failed. Needs Linux with git, uv, ripgrep and Python 3.10 or later.

To score your agent's own permission code, add a runner for it to the library's `runners/` folder, as its contributing guide describes, and run `python -m benchmark.cli run --runner <name>`.

## Repository and MCP surface, `agent-repo/scan.sh`

```sh
bash agent-repo/scan.sh path/to/your-agent /tmp/agent-repo
```

Runs OSV-Scanner, Gitleaks and Semgrep under hard time limits, then prints the file and line each code check read: a dependency with a fixable high or critical advisory, a real credential in the tree, an error-severity code finding, a sandbox at the point of execution, human confirmation on sensitive actions, scope narrower than the run, credentials scoped to the caller, MCP tool descriptions that carry instructions, and MCP HTTP authentication. It reads the repository and runs none of it.

Each check names the OWASP agentic or MCP class it belongs to, so a finding says which kind of gap it is.

## A live MCP endpoint, `mcp-server/probe.mjs`

```sh
node mcp-server/probe.mjs https://your-server/mcp
```

Reads only what the server publishes: its TLS certificate, the protocol revision it answers, its tools with their input schemas, duplicate tool names, instruction text aimed at the model in a description or in the server instructions (OWASP MCP03 Tool Poisoning), and the sign-in metadata when the server asks for authentication. It calls no tool.

## The parts that need your own account

The eight authority-at-dispatch cases and the prompt-injection comparison drive a live agent under your own permission and your own key, so they run from the evidence page rather than from a container: [the eight live tests](https://docs.proofable.me/evidence#the-eight-live-tests) and the [prompt-injection test kit](https://github.com/proofable/mcp/tree/main/examples/injection-test).
