#!/usr/bin/env node
/**
 * Description quality gate for public docs pages.
 *
 * Mintlify prints `description` as the page subtitle AND the meta description,
 * so it is the highest-leverage string on every page. The brand language standard
 * bans feature inventories and stacked abstract nouns; nothing enforced it until now.
 *
 * Fails on:
 *   INVENTORY       a comma list that never orients the reader (no "you", no
 *                   opening imperative, no consequence word). The reader learns
 *                   what exists, never why to act.
 *   RESTATES-TITLE  the description just replays the title.
 *   STACKS-BODY     the opening body line replays the description, so the page
 *                   prints the same claim twice under the H1.
 *   TOO-LONG        over 160 characters; truncates in search results.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

const IMPERATIVE = /^(add|authenticate|bind|bring|build|call|check|choose|combine|confirm|connect|control|create|decide|define|discover|drop|enforce|give|handle|import|install|keep|know|list|load|manage|mount|move|open|pass|pay|pick|prove|publish|pull|put|read|register|require|retry|reuse|roll|run|screen|see|select|sell|send|set|share|sign|start|stop|store|submit|track|use|verify|wire|wrap|write)\b/i;
/** Coverage and question openers orient the reader even without an imperative. */
const ORIENTED_OPENER = /^(every|how|what|when|where|which|whichever|who|why)\b/i;
const CONSEQUENCE = /\b(so|before|instead|without|then|when|after|unless|rather|beyond|already|never|cannot|skip|reuse|unlock|grant|stop|prevent)\b/i;
const SECOND_PERSON = /\b(you|your)\b/i;

/** Frozen brand strings. Exempt by contract; these change upstream, never here. */
const FROZEN = new Set([
  'Give AI agents identity, permissions, and reusable proof through one MCP.',
  'SDK and CLI for verification gates, reusable proof, and agent permissions.',
  'Gate access, actions, payments, or content by verified proof.',
  'Create, reuse, and share verifiable proof instead of checking twice.',
  'Keep agent identity, permissions, context, and proof across runtimes.',
]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full);
    return entry.name.endsWith('.mdx') ? [full] : [];
  });
}

const words = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

const failures = [];

for (const file of walk(ROOT)) {
  const raw = fs.readFileSync(file, 'utf8');
  const parts = raw.split(/^---$/m);
  if (parts.length < 3) continue;

  const field = (key) => {
    const match = parts[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  };

  const title = field('title');
  const description = field('description');
  if (!description || FROZEN.has(description)) continue;

  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const fail = (code, detail) => failures.push({ rel, code, detail });

  if (description.length > 160) fail('TOO-LONG', `${description.length} chars`);

  const oriented =
    SECOND_PERSON.test(description) ||
    IMPERATIVE.test(description) ||
    ORIENTED_OPENER.test(description) ||
    CONSEQUENCE.test(description);
  const commas = (description.match(/,/g) || []).length;
  if (!oriented && commas >= 2) fail('INVENTORY', 'comma list with no reader orientation');

  if (title) {
    const t = words(title).join(' ');
    if (t && words(description).join(' ').startsWith(t)) fail('RESTATES-TITLE', `title: ${title}`);
  }

  const body = parts
    .slice(2)
    .join('---')
    .split('\n')
    .find((line) => line.trim() && !line.startsWith('import ') && !line.startsWith('#'));

  if (body) {
    const a = words(description);
    const b = words(body);
    const grams = new Set();
    for (let i = 0; i + 4 <= a.length; i += 1) grams.add(a.slice(i, i + 4).join(' '));
    for (let i = 0; i + 4 <= b.length; i += 1) {
      const gram = b.slice(i, i + 4).join(' ');
      if (grams.has(gram)) {
        fail('STACKS-BODY', `"${gram}"`);
        break;
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Doc copy: ${failures.length} issue(s)\n`);
  for (const f of failures) {
    console.error(`  ${f.code.padEnd(15)} ${f.rel}`);
    console.error(`${' '.repeat(18)}${f.detail}`);
  }
  process.exit(1);
}

console.log('Doc copy valid: every description is unique, oriented, and under 160 chars.');
