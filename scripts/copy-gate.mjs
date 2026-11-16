/**
 * Public copy gate: mechanical slop tells in every reader-facing string.
 *
 * Mirror of the gate in proofable/neus (scripts/public-copy-tells.mjs). It blocks the tells a score should never
 * have to catch: dated provenance and method narration, self-narration, the
 * not-X-but-Y frame, decorative separators and arrows, stock AI wording, and hedges.
 * A line with a tell is rewritten as its shortest outcome-first claim, with the
 * source behind a link.
 *
 * Ratchet: findings that shipped before this gate sit in copy-gate-baseline.json
 * and are worked down. Any finding not in the baseline fails, so every line that is
 * added or changed is held to the gate.
 *
 *   node scripts/copy-gate.mjs                           gate (fails on new findings)
 *   node scripts/public-prose-check.mjs --copy-report    every live finding, by class
 *   node scripts/public-prose-check.mjs --copy-baseline  rewrite the baseline (only after fixes)
 */
import fs from 'node:fs';
import path from 'node:path';

const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';

export const TELLS = [
  {
    id: 'provenance',
    fix: 'Cut the date or method clause. State the outcome; the source goes behind a link.',
    patterns: [
      /\b(?:scored|measured|captured|graded|judged|benchmarked) (?:by|on|at) (?:[A-Z]|\d)/,
      new RegExp(`\\b(?:on|as of|since|dated) \\d{1,2} ${MONTH} \\d{4}\\b`, 'i'),
      new RegExp(`\\bas of (?:${MONTH}|\\d{4}|today|this writing)\\b`, 'i'),
      new RegExp(`\\b${MONTH} \\d{1,2}, \\d{4}\\b`),
      /\bwho ran (?:it|them|each)\b/i,
      /\bevery (?:row|number|result|figure) (?:names|says|cites|links)\b/i,
    ],
  },
  {
    id: 'self-narration',
    fix: 'Say the thing instead of announcing it.',
    patterns: [
      /^(?:Below (?:are|is)|The following\b|Here(?:'s| is| are) (?:how|what|the|a)\b|In this (?:page|section)|This (?:page|section) (?:shows|lists|covers|explains|describes)|As shown)/i,
      /\b(?:see|shown|listed|described) below\b/i,
      /\bread on to\b/i,
    ],
  },
  {
    id: 'not-x-but-y',
    fix: 'State the positive claim once.',
    patterns: [
      /\bnot (?:just|only|merely|simply)\b/i,
      /\bisn['’]t (?:just|only)\b/i,
      /\bnot (?:a|an|the) [a-z][^.,;!?]{0,40}[,;] (?:but|it['’]s)\b/i,
      /, not (?:from|by|through|because|just|only|merely)\b/i,
    ],
  },
  {
    id: 'separator',
    fix: 'Use a period or a comma. No dashes, middle dots or arrows in reader copy.',
    patterns: [/[—–·]/, /\s->\s/, /→/],
  },
  {
    id: 'ai-tell',
    fix: 'Replace stock wording with the concrete verb or fact.',
    patterns: [
      /\b(?:seamless(?:ly)?|leverag(?:e|es|ed|ing)|empower(?:s|ed|ing)?|robust|elevat(?:e|es|ing)|supercharg\w*|revolutioni[sz]\w*|next-generation|world-class|best-in-class|state-of-the-art|cutting-edge|game-?chang\w*|unleash\w*|streamlin\w*|holistic|synerg\w*|paradigm|ever-evolving|tapestry|testament to|embark\w*|in today['’]s)\b/i,
      /\bharness(?:es|ing)? the\b/i,
      /\bdelv(?:e|es|ing)\b/i,
      /\beffortless(?:ly)?\b/i,
    ],
  },
  {
    id: 'hedge',
    fix: 'Make the claim directly or cut it.',
    patterns: [
      /\b(?:helps? you|aims? to|is designed to|is able to|in order to|it['’]s worth noting|arguably|essentially|basically|simply put)\b/i,
    ],
  },
];

const CODE_EXT = new Set();
const TEXT_EXT = new Set(['.md', '.mdx', '.txt']);

/** Every page and README a reader can open in this repository. */
export const COPY_ROOTS = ['.'];
// Legal text is not rewritten by a style gate; a changelog's dates are its news.
const SKIP_DIR = new Set(['node_modules', '.git', '.github', 'openapi', 'images', 'fonts', 'scripts', 'legal']);
const SKIP_FILE = /^(?:changelog\.mdx|CHANGELOG\.md|CODE_OF_CONDUCT\.md|LICENSE|NOTICE)$/i;

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (!SKIP_FILE.test(entry.name)) {
      const ext = path.extname(entry.name);
      if (CODE_EXT.has(ext) || TEXT_EXT.has(ext)) out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function stripComments(code) {
  return code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, lead) => lead + ' '.repeat(m.length - lead.length));
}

/** A string a person reads: words with spaces, not a class list, path, URL, selector or code. */
function isReaderText(text) {
  const t = text.trim();
  if (t.length < 12 || !/[A-Za-z]{3}/.test(t) || !/\s/.test(t)) return false;
  if (/[{}<>=;]|=>|https?:|www\.|@\/|\/api\/|\$\{|\\n/.test(t)) return false;
  if (/^[a-z0-9\-:/\[\]().%#!\s_]+$/.test(t) && /(?:^|\s)-?[a-z]+-[a-z0-9]/.test(t)) return false; // class lists
  if (/^[\w.-]+(?:\s+[\w.-]+)*$/.test(t) && !/[A-Z]/.test(t) && t.split(/\s+/).length < 4) return false;
  return true;
}

function linesOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function* readerStrings(file, raw) {
  const ext = path.extname(file);
  if (TEXT_EXT.has(ext)) {
    const lines = raw.split(/\r?\n/);
    let fence = false;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*```/.test(lines[i])) fence = !fence;
      if (fence) continue;
      const line = lines[i];
      // MDX component attributes and frontmatter carry titles and descriptions readers see.
      for (const m of line.matchAll(/\b(?:title|description|alt|sidebarTitle|label)\s*[=:]\s*(["'])((?:(?!\1).)+)\1/g)) {
        if (isReaderText(m[2])) yield { line: i + 1, text: m[2].trim() };
      }
      const fm = line.match(/^(?:title|description|sidebarTitle):\s*(?!["'])(.+)$/);
      if (fm && isReaderText(fm[1])) yield { line: i + 1, text: fm[1].trim() };
      const t = line
        .replace(/`[^`]*`/g, ' ')
        .replace(/\]\([^)]*\)/g, ']')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\{[^}]*\}/g, ' ');
      if (isReaderText(t)) yield { line: i + 1, text: t.replace(/\s+/g, ' ').trim() };
    }
    return;
  }
  const code = stripComments(raw);
  const literal = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  let m;
  while ((m = literal.exec(code))) {
    if (m[1] === '`' && m[2].includes('${')) continue;
    if (isReaderText(m[2])) yield { line: linesOf(code, m.index), text: m[2].trim() };
  }
  if (ext === '.tsx' || ext === '.jsx') {
    const jsxText = />([^<>{}]+)</g;
    while ((m = jsxText.exec(code))) {
      if (isReaderText(m[1])) yield { line: linesOf(code, m.index), text: m[1].replace(/\s+/g, ' ').trim() };
    }
  }
}

export function scanCopyTells(root) {
  const findings = [];
  for (const rel of COPY_ROOTS) {
    for (const file of walk(path.join(root, rel), [])) {
      const raw = fs.readFileSync(file, 'utf8');
      const relFile = path.relative(root, file).split(path.sep).join('/');
      for (const { line, text } of readerStrings(file, raw)) {
        for (const tell of TELLS) {
          if (tell.patterns.some((re) => re.test(text))) {
            findings.push({ file: relFile, line, tell: tell.id, text: text.slice(0, 160) });
          }
        }
      }
    }
  }
  return findings;
}

export const fingerprint = (f) => `${f.file}|${f.tell}|${f.text.replace(/\s+/g, ' ').toLowerCase()}`;

export function runCopyGate(root, argv) {
  const baselinePath = path.join(root, 'scripts/copy-gate-baseline.json');
  const findings = scanCopyTells(root);
  if (argv.includes('--copy-baseline')) {
    const prints = [...new Set(findings.map(fingerprint))].sort();
    fs.writeFileSync(baselinePath, `${JSON.stringify(prints, null, 2)}\n`);
    console.log(`public copy gate: baseline written with ${prints.length} finding(s)`);
    return 0;
  }
  if (argv.includes('--copy-report')) {
    const byTell = new Map();
    for (const f of findings) byTell.set(f.tell, [...(byTell.get(f.tell) || []), f]);
    for (const tell of TELLS) {
      const list = byTell.get(tell.id) || [];
      console.log(`\n## ${tell.id} (${list.length}): ${tell.fix}`);
      for (const f of list) console.log(`${f.file}:${f.line}  ${f.text}`);
    }
    console.log(`\npublic copy gate: ${findings.length} live finding(s)`);
    return 0;
  }
  const baseline = new Set(fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : []);
  const fresh = findings.filter((f) => !baseline.has(fingerprint(f)));
  for (const f of fresh) {
    const tell = TELLS.find((t) => t.id === f.tell);
    console.error(`${f.file}:${f.line}: ${f.tell}: "${f.text}"\n  ${tell.fix}`);
  }
  const live = new Set(findings.map(fingerprint));
  const cleared = [...baseline].filter((p) => !live.has(p)).length;
  if (cleared) console.warn(`public copy gate: ${cleared} baseline finding(s) fixed; run --copy-baseline to drop them`);
  console.warn(`public copy gate: ${baseline.size - cleared} known finding(s) left to fix (--copy-report lists them)`);
  return fresh.length;
}

import { fileURLToPath } from 'node:url';

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const argv = process.argv.slice(2);
  const fresh = runCopyGate(root, argv);
  if (fresh) { console.error(`copy gate: ${fresh} new finding(s)`); process.exit(1); }
  if (!argv.length) console.log('copy gate: OK');
}
