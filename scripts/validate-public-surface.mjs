#!/usr/bin/env node
/**
 * Public-surface leak gate.
 *
 * These repos are public. Everything a reader sees -- changelogs, READMEs, docs
 * bodies -- ships to people who are not on the team. Internal language that
 * leaks into them reads as process theatre and exposes how the sausage is made.
 *
 * `validate-doc-copy.mjs` guards MDX frontmatter quality. This guards the body
 * text of every public prose surface: CHANGELOG.md, README.md, and every .mdx.
 *
 * Fails on:
 *   INTERNAL-JARGON   internal shorthand that means nothing to a reader
 *                     (SSOT, "single source of truth", "fails closed",
 *                     "action contract", "allow-list", "byte-identical").
 *   INTERNAL-PATH     a repository-internal file path or script name
 *                     (scripts/validate-*.mjs, lib/seo/, neus/design,
 *                     _workspace, protocol/mcp/server.json).
 *   META-NARRATION    narration about our process rather than the product
 *                     ("the reviewer-handoff", "pinned commits", "our CI",
 *                     "working-group tools", "cleanup pass").
 *   OPERATOR-LEAK     the operator's private context in a public file
 *                     (_workspace paths, ACTIVE_GOAL, PROOFABLE-POLICY,
 *                     "founder", internal agent ids).
 *
 * Exemptions: fenced code blocks are skipped, and a line may carry
 * `leak-gate: allow` to opt out with a reason, because a few public pages
 * legitimately quote a prior internal term when explaining a rename.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'images', '.mintlify']);

/** Internal shorthand with no meaning to an outside reader. */
const INTERNAL_JARGON = [
  /\bSSOT\b/,
  /single source of truth/i,
  /\bfails? closed\b/i,
  /\bcanonical action contract\b/i,
  /\baction contract\b/i,
  /\ballow[- ]lists?\b/i,
  /\bbyte-identical\b/i,
  /\bmanifest SSOT\b/i,
];

/** Repository-internal paths and script names. */
const INTERNAL_PATH = [
  /scripts\/[a-z0-9-]*\.mjs\b/i,
  /\bneus\/design\b/,
  /\bneus\/lib\b/,
  /\bprotocol\/mcp\//,
  /\b_workspace\b/,
  /\bdocs-private\b/,
  /openai\/interface\.json/,
];

/** Narration about our process instead of the product. */
const META_NARRATION = [
  /\breviewer-handoff\b/i,
  /\bpinned commits?\b/i,
  /\bworking-group tools\b/i,
  /\bcleanup pass\b/i,
  /\bthis file is generated\b/i,
  /\bthe same files passed on Linux CI\b/i,
];

/**
 * How we build and validate the artifact — build scripts, CI wiring, checksum
 * pins, branch movement. Never belongs in a CHANGELOG: a changelog entry states
 * what the release does for the reader, never our internal tooling. A README or
 * a contributing page legitimately names commands a developer runs, so this set
 * is applied to changelogs only.
 */
const CHANGELOG_NARRATION = [
  /\bchecked in CI\b/i,
  /\bCI verifies\b/i,
  /\bvalidation (fails|now (compares|fails))\b/i,
  /\b(validate|sync|publisher|publish)[a-z-]*\s+(workflow|script|check)\b/i,
  /\bnpm run [a-z:]+/i,
  /\bscripts\/[a-z0-9-]+\.mjs\b/i,
  /\b(source|canonical|this) (manifest|copy|pair)\b/i,
  /\bregenerated from (it|the source)\b/i,
  /\bmoved out of `?main`?\b/i,
  /\bchecksum\b/i,
];

/** The operator's private context. */
const OPERATOR_LEAK = [
  /\bACTIVE_GOAL\b/,
  /\bPROOFABLE-POLICY\b/,
  /\bGolden Standards\b/,
  /\boperator profile\b/i,
];

/**
 * Underselling: a narrative page that leads with what Proofable lacks. A stated
 * limit belongs in the evidence packet or the whitepaper that owns it, never as
 * the closing note of a buyer-facing page. Scoped to headings and short lines so
 * a technical caveat inside a paragraph of real substance does not trip it.
 */
const UNDERSELL = [
  /^\s*#{1,6}\s*(not measured(\s+yet)?|what.{0,3}s not (measured|claimed)|unmeasured|limitations|caveats?|disclaimer)\b/i,
  /^\s*[-*]\s*not (measured|claimed|independently|yet)\b/i,
  /\bnot yet (claimed|measured|proven|validated|independently)\b/i,
  /\bno independent (operator|witness|review|peer)\b/i,
];

const RULES = [
  ['INTERNAL-JARGON', INTERNAL_JARGON],
  ['INTERNAL-PATH', INTERNAL_PATH],
  ['META-NARRATION', META_NARRATION],
  ['OPERATOR-LEAK', OPERATOR_LEAK],
  ['UNDERSELL', UNDERSELL],
];

const ALLOW = /leak-gate:\s*allow/i;
const PROSE_EXT = new Set(['.md', '.mdx']);
const NAMED = new Set(['CHANGELOG.md', 'README.md']);

/**
 * Technical surfaces where exact field names and standard security terms are
 * correct, not slop: the peer-reviewed whitepaper and the signed reproduction
 * packets under public/evidence. Narrative surfaces stay strict.
 */
const TECHNICAL = [/^whitepaper\.mdx$/, /^public\/evidence\//];
const TECHNICAL_ONLY = new Set(['INTERNAL-JARGON', 'UNDERSELL']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (PROSE_EXT.has(ext) || NAMED.has(entry.name)) out.push(full);
  }
  return out;
}

/** Blank out fenced code blocks so sample code is never flagged. */
function stripFences(text) {
  let inFence = false;
  return text.split('\n').map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return '';
    }
    return inFence ? '' : line;
  });
}

const failures = [];

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const technical = TECHNICAL.some((p) => p.test(rel));
  const isChangelog = /(^|\/)CHANGELOG\.md$/i.test(rel) || /(^|\/)changelog\.mdx$/i.test(rel);
  const lines = stripFences(fs.readFileSync(file, 'utf8'));
  lines.forEach((line, i) => {
    if (!line.trim() || ALLOW.test(line)) return;
    for (const [code, patterns] of RULES) {
      if (technical && TECHNICAL_ONLY.has(code)) continue;
      const active =
        isChangelog && code === 'META-NARRATION' ? [...patterns, ...CHANGELOG_NARRATION] : patterns;
      for (const pattern of active) {
        const match = line.match(pattern);
        if (match) {
          failures.push({ rel, line: i + 1, code, hit: match[0], text: line.trim().slice(0, 120) });
        }
      }
    }
  });
}

if (failures.length > 0) {
  console.error(`Public-surface leak: ${failures.length} issue(s)\n`);
  for (const f of failures) {
    console.error(`  ${f.code.padEnd(16)} ${f.rel}:${f.line}  [${f.hit}]`);
    console.error(`${' '.repeat(20)}${f.text}`);
  }
  console.error(
    '\nThese files are public. Say what changed for the reader; keep internal\n' +
      'shorthand, repository paths, process narration and operator context out.\n' +
      'If a line must quote an internal term, end it with "leak-gate: allow".'
  );
  process.exit(1);
}

console.log('Public-surface leak gate passed: no internal or operator language in public prose.');
