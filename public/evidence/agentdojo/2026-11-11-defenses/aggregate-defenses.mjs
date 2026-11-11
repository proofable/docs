#!/usr/bin/env node
// Pool AgentDojo's per-suite scores into one row per defense, weighted by attacked pairs (949 across
// the four suites). AgentDojo scored every pair; this only adds them up. Writes summary.json next to
// the runs and prints the table. Usage: node aggregate-defenses.mjs <run-root>
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('usage: node aggregate-defenses.mjs <run-root>');
const SUITES = ['banking', 'slack', 'travel', 'workspace'];
const defenses = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

const results = {};
for (const defense of defenses) {
  const perSuite = {};
  let pairs = 0, landed = 0, done = 0;
  for (const suite of SUITES) {
    const f = join(root, defense, suite, 'summary-off.json');
    if (!existsSync(f)) continue;
    const s = JSON.parse(readFileSync(f, 'utf8'));
    perSuite[suite] = { pairs: s.security_pairs, utilityUnderAttack: s.utility_rate, targetedAsr: s.security_rate };
    pairs += s.security_pairs;
    landed += (s.security_rate / 100) * s.security_pairs;
    done += (s.utility_rate / 100) * s.utility_pairs;
  }
  const complete = Object.keys(perSuite).length === SUITES.length;
  results[defense] = {
    complete,
    pairs,
    targetedAsr: pairs ? +((landed / pairs) * 100).toFixed(2) : null,
    utilityUnderAttack: pairs ? +((done / pairs) * 100).toFixed(2) : null,
    attacksLanded: Math.round(landed),
    tasksDone: Math.round(done),
    perSuite,
  };
}

const summary = {
  kind: 'proofable.benchmark.agentdojo.defenses',
  version: 1,
  measuredAt: '2026-11-11',
  benchmark: { name: 'AgentDojo', version: 'v1.2.2', suites: SUITES, attack: 'important_instructions', library: 'ethz-spylab/agentdojo @ 089ed468' },
  model: { provider: 'RedPill (OpenAI-compatible)', id: 'google/gemma-4-31b-it' },
  runner: 'runners/agentdojo/run_agentdojo.py with PROOFABLE_GATE=off and AD_DEFENSE=<defense>; tool_filter calls the agent’s own model (upstream passes the provider label as the model name)',
  comparedWith: 'artifacts/benchmarks/agentdojo/2026-11-09-all-suites (Proofable on and off, same model, same 949 pairs)',
  results,
};
writeFileSync(join(root, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
for (const [d, r] of Object.entries(results)) {
  console.log(`${d.padEnd(30)} pairs=${String(r.pairs).padStart(4)} landed=${String(r.targetedAsr).padStart(6)}% done=${String(r.utilityUnderAttack).padStart(6)}%${r.complete ? '' : '  (incomplete)'}`);
}
