#!/usr/bin/env bash
# Trust Harness Benchmark: runs the open AgentGovBench library (48 agent-governance scenarios)
# against an agent repository, the same library and commit docs.proofable.me/evidence reports.
# It clones the library, runs its no-governance floor and the native runner for each agent
# framework the repository uses, and prints every score as one JSON object.
# Usage: bash agentgovbench.sh <repository directory> <output directory>
set -u
REPO=$(cd "${1:-.}" && pwd)
OUT=${2:-/tmp/trust-harness}
LIB_COMMIT=479c5f011b761d3fc766410dd16e744e030b2c1f
LIB="$OUT/agentgovbench"
mkdir -p "$OUT"

# The library, at the commit the published table used.
if [ ! -d "$LIB/.git" ]; then
  git init -q "$LIB" && git -C "$LIB" remote add origin https://github.com/agentic-control-plane/agentgovbench \
    && git -C "$LIB" fetch -q --depth 1 origin "$LIB_COMMIT" && git -C "$LIB" checkout -q FETCH_HEAD
fi
cd "$LIB" || exit 1
uv venv -q .venv > "$OUT/install.log" 2>&1 && . .venv/bin/activate && uv pip install -q -e . >> "$OUT/install.log" 2>&1

# The agent frameworks the repository uses, each with the library's native runner.
has() { rg -q -i --no-messages -g '!.git' -g '!node_modules' -g '!*.md' -e "$1" "$REPO"; }
RUNNERS="vanilla"
has '(^|[^a-z_])crewai'                                        && RUNNERS="$RUNNERS crewai_native"
has '(langgraph|langchain_core|@langchain/)'                   && RUNNERS="$RUNNERS langgraph_native"
has '(openai-agents|from agents import|@openai/agents)'        && RUNNERS="$RUNNERS openai_agents_native"
has '(claude[-_]agent[-_]sdk|@anthropic-ai/claude-agent-sdk)'  && RUNNERS="$RUNNERS anthropic_agent_sdk_native"
[ -d "$REPO/.claude" ] && RUNNERS="$RUNNERS claude_code_native"
[ -d "$REPO/.codex" ] && RUNNERS="$RUNNERS codex_native"
[ -d "$REPO/.cursor" ] && RUNNERS="$RUNNERS cursor_native"
case "$RUNNERS" in *crewai_native*) timeout 150 uv pip install -q -e '.[crewai]' >> "$OUT/install.log" 2>&1 ;; esac
case "$RUNNERS" in *langgraph_native*) timeout 150 uv pip install -q -e '.[langchain]' >> "$OUT/install.log" 2>&1 ;; esac

for r in $RUNNERS; do
  timeout 240 python -m benchmark.cli run --runner "$r" --out "$OUT/$r.json" > "$OUT/$r.log" 2>&1
  echo $? > "$OUT/$r.exit"
done

python3 - "$OUT" "$LIB_COMMIT" $RUNNERS <<'PY'
import json, os, sys
out, commit, runners = sys.argv[1], sys.argv[2], sys.argv[3:]
summary = {"library": "agentic-control-plane/agentgovbench", "commit": commit, "runs": {}}
for r in runners:
    path = os.path.join(out, f"{r}.json")
    try:
        blob = json.load(open(path))
    except Exception:
        tail = open(os.path.join(out, f"{r}.log")).read()[-300:] if os.path.exists(os.path.join(out, f"{r}.log")) else ""
        summary["runs"][r] = {"ran": False, "error": tail}
        continue
    results = blob.get("results", [])
    scored = [x for x in results if x.get("status") != "na"]
    passed = sum(1 for x in scored if x.get("passed"))
    summary["runs"][r] = {
        "ran": True,
        "product": blob.get("runner", {}).get("product"),
        "passed": passed,
        "total": len(results),
        "notApplicable": len(results) - len(scored),
        "byCategory": {c["category"]: f'{c["passed"]}/{c["total"]}' for c in blob.get("aggregate", {}).get("by_category", [])},
        "failed": [x.get("scenario_id") or x.get("id") for x in scored if not x.get("passed")][:48],
    }
print(json.dumps(summary, indent=1))
PY
