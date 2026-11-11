#!/usr/bin/env python
"""
Run one AgentDojo cell with the Proofable gate either on or off.

This is the whole comparison in one command. Same suite, same tasks, same model, same attack, same seed.
The only thing that changes is whether ProofableGate sits in front of the tool executor.

  PROOFABLE_GATE=off  -> stock AgentDojo pipeline, the tool runs whenever the model asks
  PROOFABLE_GATE=on   -> ProofableGate inserted before ToolsExecutor; the authority engine decides every call against a per-task delegation
  PROOFABLE_GATE=ablation -> same decisions recorded, nothing refused

AgentDojo's own checkers decide utility and security. This script never scores anything: it writes the raw
result plus the gate's decision record and gets out of the way, so the number in the report is AgentDojo's,
not ours.

Run it inside the agentdojo venv with the Proofable AgentDojo runner on PYTHONPATH.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from agentdojo.agent_pipeline.agent_pipeline import AgentPipeline, PipelineConfig
from agentdojo.agent_pipeline.tool_execution import ToolsExecutionLoop, ToolsExecutor, tool_result_to_str
from agentdojo.attacks.attack_registry import load_attack
from agentdojo.benchmark import aggregate_results, benchmark_suite_with_injections, benchmark_suite_without_injections
from agentdojo.logging import OutputLogger
from agentdojo.task_suite.load_suites import get_suite

from proofable_gate import ProofableGate, grant_for_task


def insert_gate(pipeline: AgentPipeline, gate: ProofableGate) -> AgentPipeline:
    """Rebuild the stock pipeline with the gate inside the tool loop, ahead of the executor.

    from_config() builds [system, init, llm, ToolsExecutionLoop([ToolsExecutor, llm])]. Only the loop's element
    order changes: [gate, ToolsExecutor, llm]. Nothing else moves, which is what makes this a single-variable
    comparison.
    """
    elements = list(pipeline.elements)
    system, init, llm, loop = elements[0], elements[1], elements[2], elements[3]
    gated = ToolsExecutionLoop([gate, ToolsExecutor(tool_result_to_str), *list(loop.elements)[1:]])
    rebuilt = AgentPipeline([system, init, llm, gated])
    rebuilt.name = f"{getattr(pipeline, 'name', 'pipeline')}-proofable"
    return rebuilt


def main() -> int:
    load_dotenv(".env")
    suite_name = os.getenv("AD_SUITE", "banking")
    version = os.getenv("AD_VERSION", "v1.2.2")
    model = os.getenv("AD_MODEL", "GPT_4O_MINI_2024_07_18")
    model_id = os.getenv("AD_MODEL_ID") or None
    attack_name = os.getenv("AD_ATTACK", "important_instructions")
    gate_mode = os.getenv("PROOFABLE_GATE", "on").strip().lower()
    outdir = Path(os.getenv("AD_OUT", "./proofable-run"))
    user_tasks = tuple(t for t in os.getenv("AD_USER_TASKS", "").split(",") if t)
    injection_tasks = tuple(t for t in os.getenv("AD_INJECTION_TASKS", "").split(",") if t)
    baseline = os.getenv("AD_BASELINE")  # reuse a clean run instead of paying for it again

    outdir.mkdir(parents=True, exist_ok=True)
    suite = get_suite(version, suite_name)

    config = PipelineConfig(
        llm=model,
        model_id=model_id,
        # AgentDojo's own defenses (tool_filter, spotlighting_with_delimiting, repeat_user_prompt,
        # transformers_pi_detector) run on the same model and tasks as the gate, so each is a same-conditions row.
        # tool_filter is rebuilt below: upstream passes the provider label ("openai-compatible") as the filter's
        # model name, so on any OpenAI-compatible endpoint it calls a model that does not exist.
        defense=None if os.getenv("AD_DEFENSE") == "tool_filter" else (os.getenv("AD_DEFENSE") or None),
        tool_delimiter="tool",
        system_message_name=None,
        system_message=None,
    )
    pipeline = AgentPipeline.from_config(config)
    # A stalled connection otherwise waits 600 s per try, times the client's and AgentDojo's retries: over an
    # hour for one dropped request. Two minutes per request is far above any real answer. Only how soon a dead
    # request is retried changes; the model, prompts and scoring do not.
    llm = pipeline.elements[2]
    if hasattr(llm, "client"):
        llm.client = llm.client.with_options(timeout=120.0)
    if os.getenv("AD_DEFENSE") == "tool_filter":
        # Upstream's tool_filter pipeline, element for element, with the filter calling the agent's own model.
        from agentdojo.agent_pipeline.agent_pipeline import TOOL_FILTER_PROMPT
        from agentdojo.agent_pipeline.llms.openai_llm import OpenAILLMToolFilter
        stock_name = pipeline.name  # the attack reads the model's display name from this
        system, init, llm, loop = list(pipeline.elements)
        pipeline = AgentPipeline([system, init, OpenAILLMToolFilter(TOOL_FILTER_PROMPT, llm.client, llm.model), llm, loop])
        pipeline.name = f"{stock_name}-tool_filter"

    gate = None
    if gate_mode in ("on", "ablation"):
        # The owner's delegation, per user task: exactly the actions that task's own ground truth calls, plus
        # reads. The authority engine decides every call against it. `ablation` records the same decisions
        # but never refuses, which shows how much of the score the engine's decisions carry.
        pre_env = suite.load_and_inject_default_environment({})
        grants = {}
        for task_id, task in suite.user_tasks.items():
            tools = sorted({c.function for c in task.ground_truth(pre_env)})
            grants[task.PROMPT] = grant_for_task(suite_name, task_id, tools)
        (outdir / "grants.json").write_text(
            json.dumps({g.task_id: {"tools": list(g.tools), "allowedActions": list(g.allowed_actions)} for g in grants.values()}, indent=2),
            encoding="utf-8",
        )
        print(f"grants: {len(grants)} user tasks, one delegation each (see grants.json)")
        gate = ProofableGate(suite_name, grants, log_path=outdir / "gate-decisions.jsonl", ablation=(gate_mode == "ablation"))
        pipeline = insert_gate(pipeline, gate)
    elif gate_mode != "off":
        print(f"PROOFABLE_GATE must be off, on or ablation, got {gate_mode!r}", file=sys.stderr)
        return 2

    print(f"suite={suite_name}@{version} model={model} attack={attack_name or 'none'} gate={gate_mode}")
    print(f"user tasks: {user_tasks or 'all'} | injection tasks: {injection_tasks or 'all'}")

    with OutputLogger(str(outdir / "logs")):
        if attack_name:
            attacker = load_attack(attack_name, suite, pipeline)
            results = benchmark_suite_with_injections(
                agent_pipeline=pipeline,
                suite=suite,
                attack=attacker,
                logdir=outdir / "logs",
                force_rerun=False,
                user_tasks=user_tasks or None,
                injection_tasks=injection_tasks or None,
                benchmark_version=version,
            )
            utility = aggregate_results([results["utility_results"]])
            security = aggregate_results([results["security_results"]]) if results["security_results"] else None
        else:
            results = benchmark_suite_without_injections(
                agent_pipeline=pipeline,
                suite=suite,
                logdir=outdir / "logs",
                force_rerun=False,
                user_tasks=user_tasks or None,
                benchmark_version=version,
            )
            utility = aggregate_results([results["utility_results"]])
            security = None

    decisions = gate.decisions if gate else []
    summary = {
        "suite": suite_name,
        "version": version,
        "model": model,
        "attack": attack_name,
        "gate": gate_mode,
        "utility_rate": round(utility * 100, 2) if utility is not None else None,
        "security_rate": round(security * 100, 2) if security is not None else None,
        "utility_pairs": len(results["utility_results"]),
        "security_pairs": len(results["security_results"]) if results.get("security_results") else 0,
        "gate_decisions": len(decisions),
        "gate_denied": sum(1 for d in decisions if d.decision == "deny"),
        "gate_allowed": sum(1 for d in decisions if d.decision == "allow"),
        "mean_gate_latency_ms": round(sum(d.latency_ms for d in decisions) / len(decisions), 3) if decisions else None,
    }
    (outdir / f"summary-{gate_mode}.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
