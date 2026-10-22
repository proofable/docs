#!/usr/bin/env node
/**
 * Public-surface language gate.
 *
 * Everything in a public repository reaches people who are not on the team:
 * READMEs, changelogs, docs pages, package and plugin manifests, tool and API
 * descriptions, CLI output, error messages, type-declaration comments, and the
 * comments in shipped source. This gate reads all of it and fails on language
 * that does not belong in front of a reader, an integrator, a marketplace
 * reviewer or an AI host.
 *
 * What it reads
 *   prose      .md and .mdx bodies (fenced code is skipped; HTML and MDX
 *              comments are read, because the raw file is public)
 *   marketing  the body of a page whose job is to be read and acted on (a
 *              launch post, blog post, case study, landing page). It runs the
 *              generated-text, contrast, typography and private-name rules,
 *              and is exempt from the docs-neutrality rules: SLOP-CORP,
 *              SLOP-HOOK, HEDGE, UNDERSELL and PROCESS. Headings and
 *              frontmatter on the same file still scan as `short`.
 *   short      the one-line surfaces: headings, frontmatter titles and
 *              descriptions, manifest descriptions, tool and API descriptions
 *   manifest   description, summary, title and label fields in JSON and YAML
 *   code       comments and string literals in .js, .mjs, .cjs, .jsx, .ts,
 *              .tsx, .d.ts, .css and .svg files
 *
 * What it fails on
 *   PRIVATE-NAME    the name of a private working file or directory, a private
 *                   host, or a local machine path
 *   INTERNAL-TERM   shorthand that means nothing to a reader
 *   PROCESS         narration about how the team works instead of what the
 *                   product does: build steps, review steps, branch movement
 *   PLACEHOLDER     to-do markers, filler text and other unfinished text
 *   ENCODING        mojibake and replacement characters
 *   SLOP            generated-text tells and filler vocabulary, throat-
 *                   clearing, contrast formulas, weasel attribution, recap
 *                   endings. Banned on every surface including marketing.
 *   SLOP-CORP       empty corporate puff that a marketing surface may use when
 *                   it lands (empower, secure and scalable). Docs and UI only.
 *   SLOP-HOOK       opener and framing devices that work in a hook and read as
 *                   ceremony in docs (in a world where, what if). Docs only.
 *   TYPOGRAPHY      em dashes, en dashes and middle dots used as separators
 *   HEDGE           underselling in a one-line surface
 *   UNDERSELL       a narrative page that closes on what the product lacks
 *   LEGACY-BRAND    the predecessor brand used as the product name
 *
 * Exemptions
 *   - A line may end with `language-gate: allow <reason>` (or the older
 *     `leak-gate: allow`) when it must quote a term it explains.
 *   - Signed evidence packets, the whitepaper, the license files and the code
 *     of conduct are technical surfaces: exact field names, standard security
 *     terms and verbatim third-party text are correct there, and signed files
 *     cannot change, so only PRIVATE-NAME, PLACEHOLDER and ENCODING apply.
 *
 * Usage
 *   node scripts/validate-public-surface.mjs [--json] [--root <dir>]
 *
 * The private names this gate forbids are assembled from fragments at runtime
 * so that the gate never prints them itself.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const j = (...parts) => parts.join('');
const word = (text, flags = 'i') => new RegExp(`\\b${text}\\b`, flags);

/** Names of private working files, directories and hosts. Never printed. */
export const PRIVATE_NAME = [
  word(j('_work', 'space'), ''),
  word(j('ACTIVE', '_GOAL'), ''),
  word(j('PROOFABLE', '-POLICY'), ''),
  word(j('UNIVERSAL', '-DEFAULT'), ''),
  word(j('PROOFABLE', '-LANGUAGE'), ''),
  word(j('ENGINEERING', '-STANDARD'), ''),
  word(j('launch', '-playbook'), ''),
  word(j('docs', '-private'), ''),
  word(j('operator', '-hooks'), ''),
  word(j('Golden', ' Standards'), ''),
  word(j('operator', ' profile')),
  word(j('plane', '=test'), ''),
  word(j('dev-', 'session'), ''),
  word(j('NEUS_', 'NEW_OWNER'), ''),
  word(j('TREG', '_TOKEN'), ''),
  word(j('CONTEXT_', 'DEV_API_KEY'), ''),
  new RegExp(j('\\bdev\\.(?:api\\.|mcp\\.)?proofable', '\\.me\\b')),
  new RegExp(j('\\bstaging\\.(?:api\\.|mcp\\.)?proofable', '\\.me\\b')),
  /(?:[A-Za-z]:\\(?:Users|Algollo)\\|\/Users\/[^/\s]+\/|\/home\/[^/\s]+\/)/,
  /\bthe founder\b/i,
  /\bfounder(?:'s)? (?:walked|said|decided|approved|asked|review|feedback|read|call)/i,
];

/** Shorthand with no meaning to an outside reader. */
export const INTERNAL_TERM = [
  /\bSSOT\b/,
  /\bsingle source of truth\b/i,
  /\bfails? closed\b/i,
  /\baction contract\b/i,
  /\ballow[- ]lists?\b/i,
  /\bbyte-identical\b/i,
  /\bpickaxe\b/i,
  /\bpass\/block\b/i,
  /\bregression (?:auditor|sweep)\b/i,
  /\bcodename\b/i,
];

/** Narration about how the team works instead of what the product does. */
export const PROCESS = [
  /\breviewer-handoff\b/i,
  /\bpinned commits?\b/i,
  /\bworking-group tools\b/i,
  /\bcleanup pass\b/i,
  /\bthe same files passed on Linux CI\b/i,
  /\bforce[- ]push(?:ed|es)?\b/i,
  /\bworktrees?\b/i,
  /\brelease freeze\b/i,
  /\bre-cut\b/i,
  /\bpre-deploy\b/i,
  /\bthis session\b/i,
  /\bthe operator\b/i,
];

/**
 * A changelog states what a release does for the reader, never the team's
 * build, validation or branch steps. A README or contributing page may name
 * the commands a developer runs, so these apply to changelogs only.
 */
export const CHANGELOG_PROCESS = [
  /\bchecked in CI\b/i,
  /\bCI (?:verifies|runs|checks)\b/i,
  /\bour CI\b/i,
  /\bvalidation (?:fails|now (?:compares|fails))\b/i,
  /\b(?:validate|sync|publisher|publish)[a-z-]*\s+(?:workflow|script|check)\b/i,
  /\bnpm run [a-z:]+/i,
  /\bscripts\/[a-z0-9-]+\.(?:mjs|js|cjs)\b/i,
  /\b(?:source|canonical|this) (?:manifest|copy|pair)\b/i,
  /\bregenerated from (?:it|the source)\b/i,
  /\bmoved out of `?main`?\b/i,
  /\bchecksum\b/i,
];

/** Unfinished text. */
export const PLACEHOLDER = [
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bHACK\b/,
  /\bXXX\b/,
  /\bTBD\b/,
  /\bWIP\b/,
  /\blorem ipsum\b/i,
  /\bcoming soon\b/i,
  /\[(?:link|url|insert(?: [a-z ]+)?|todo|tbd)\]/i,
  /\bCHANGEME\b/i,
];

/** Text that was decoded with the wrong encoding, or could not be decoded. */
const chars = (...codes) => String.fromCharCode(...codes);
export const ENCODING = [
  // The two-character prefix of a mis-decoded dash or quote, plus the byte that completes it.
  new RegExp(`${chars(0xe2, 0x20ac)}[${chars(0x80)}-${chars(0xbf)}"'${chars(0x201c, 0x201d, 0x2018, 0x2019)}]?`),
  // "Ã" followed by a continuation byte: a mis-decoded accented letter.
  new RegExp(`${chars(0xc3)}[${chars(0x80)}-${chars(0xbf)}]`),
  // "Â" followed by a mis-decoded space, guillemet or middle dot.
  new RegExp(`${chars(0xc2)}[${chars(0xa0, 0xab, 0xbb, 0xb7)}]`),
  // The replacement character: a byte that could not be decoded at all.
  new RegExp(chars(0xfffd)),
];

/**
 * Filler vocabulary, split by why a word is banned so each register can take
 * the list it needs. One flat list served docs, UI and marketing alike, which
 * banned hook language on the surfaces whose whole job is to be read.
 *
 *   SLOP_AI     generated-text tells and empty praise. Banned everywhere.
 *   SLOP_CORP   empty corporate puff. Banned on docs, UI and labels; a
 *               marketing surface may use it when it lands, so `marketing`
 *               does not run this list.
 *   SLOP_HOOK   opener and framing devices that work in a hook and read as
 *               ceremony in documentation. Allowed in `marketing` only.
 */
export const SLOP_AI =
  /(?<![\w-])(?:seamless(?:ly)?|robust(?:ly|ness)?|comprehensive(?:ly)?|cutting-edge|next-generation|revolutioni[sz]e|revolutionary|transformative|future-proof|holistic|effortless(?:ly)?|leverag(?:e|es|ed|ing)|innovative|supercharg(?:e|es|ed|ing)|game[- ]chang(?:er|ing)|delve(?:s|d)?|tapestry|paradigm|unleash(?:es|ed|ing)?|elevat(?:e|es|ed|ing)|AI[- ]powered|intelligent layer|trust fabric|unified platform|foster(?:s|ed|ing)?|utili[sz](?:e|es|ed|ing)|facilitat(?:e|es|ed|ing)|streamlin(?:e|es|ed|ing)|realm|beacon|multifaceted|meticulous(?:ly)?|intricate|paramount|embark(?:s|ed|ing)?|ever-evolving|state-of-the-art|best-in-class|world-class|battle-tested|blazing(?:ly)? fast|turnkey|synerg(?:y|ies|istic))(?![\w-])/i;

export const SLOP_CORP =
  /(?<![\w-])(?:empower(?:s|ed|ing)?|secure and scalable|the future of|in a world where|imagine a world)(?![\w-])/i;

/**
 * Opener and framing devices that work in a hook and read as ceremony in docs.
 * Only phrasings that carry no literal meaning: a bare "meet the" or "what if"
 * is a hook, but "meet the WCAG target size" is a fact, so the generic verb
 * phrases stay out of this list.
 */
export const SLOP_HOOK =
  /(?<![\w-])(?:in a world where|imagine a world|imagine if|the next era of|say hello to|say goodbye to|welcome to the future)(?![\w-])/i;

/** Kept as the union for callers that read it directly; the class map decides what runs. */
export const SLOP_WORDS = SLOP_AI;

/** Throat-clearing, setups, puffery, weasel attribution and recaps. */
export const SLOP_PHRASES = [
  /\bhere'?s the thing\b/i,
  /\blet me be clear\b/i,
  /\bI'?ll be honest\b/i,
  /\bthe uncomfortable truth\b/i,
  /\bit'?s worth noting\b/i,
  /\bit'?s important to note\b/i,
  /\bat the end of the day\b/i,
  /\bin today'?s (?:world|landscape|fast-paced)\b/i,
  /\bin the age of\b/i,
  /\blet'?s dive in\b/i,
  /\bthe (?:reality|truth) is\b/i,
  /\bwhat (?:most people|nobody|everyone) (?:get wrong|tells you|misses)\b/i,
  /\bstands as a testament\b/i,
  /\bpivotal moment\b/i,
  /\bplays a (?:vital|crucial|key) role\b/i,
  /\bunderscores (?:its|the) (?:importance|significance|commitment)\b/i,
  /\b(?:experts|analysts) agree\b/i,
  /\bstudies show\b/i,
  /\bindustry reports suggest\b/i,
  /\bwidely regarded as\b/i,
  /\bwhat if I told you\b/i,
  /\bplot twist\b/i,
  /^\s*(?:In conclusion|Ultimately|Overall|In summary),/i,
  /\bthat'?s (?:it|all)\. that'?s the whole\b/i,
  /\bthe whole (?:thing|product|point)\.\s*$/i,
];

/** "Not X. It's Y." and "not just X but Y" contrast formulas, in prose. */
export const SLOP_CONTRAST = [
  /\b(?:not|isn'?t|wasn'?t|aren'?t) (?:just |only |about |a |an )?[^.!?\n]{1,60}[.;:] (?:it'?s|it is|this is|that is|we'?re|they'?re|it was)\b/i,
  /\bnot (?:just|only|merely) [^.!?\n]{1,60}\b(?:but|it'?s)\b/i,
];

/** Separators that house style never uses in public text. */
export const TYPOGRAPHY = [/—/, /–/, /·/];

/**
 * Underselling in a one-line surface: a description, a heading, a label.
 * Scoped to `short`, `marketing-meta` and manifests. A narrative page is
 * allowed to say "so far" or "almost"; those words are only a defect when the
 * whole surface is one line and the hedge is the entire message.
 */
export const HEDGE = [
  /\bsmall sample\b/i,
  /\bself-run\b/i,
  /\baims? to\b/i,
  /\btries to\b/i,
  /\bnot yet\b/i,
  /\bUNKNOWN\b/,
];

/** A narrative page that leads with what the product lacks. */
export const UNDERSELL = [
  /^\s*#{1,6}\s*(?:not measured(?:\s+yet)?|what.{0,3}s not (?:measured|claimed)|unmeasured|limitations|caveats?|disclaimer)\b/i,
  /^\s*[-*]\s*not (?:measured|claimed|independently|yet)\b/i,
  /\bnot yet (?:claimed|measured|proven|validated|independently)\b/i,
  /\bno independent (?:operator|witness|review|peer)\b/i,
];

/**
 * The predecessor brand used as if it were the product. The legal entity,
 * package names, the frozen signing format, deployed contract names, the
 * registered trademark line and historical release tables stay.
 */
export const LEGACY_BRAND = [
  /(?<!Connect to )\bNEUS\b(?! Network, Inc| Network|®|-v1\b|Verifier|Voucher|Token|Proof\b| Sponsor Grant| Profile Update Request|\.tokens|_)(?![\w/@-])/,
];

const RULES = {
  'PRIVATE-NAME': PRIVATE_NAME,
  'INTERNAL-TERM': INTERNAL_TERM,
  PROCESS,
  PLACEHOLDER,
  ENCODING,
  SLOP: [SLOP_AI, ...SLOP_PHRASES],
  'SLOP-CORP': [SLOP_CORP],
  'SLOP-HOOK': [SLOP_HOOK],
  'SLOP-CONTRAST': SLOP_CONTRAST,
  TYPOGRAPHY,
  HEDGE,
  UNDERSELL,
  'LEGACY-BRAND': LEGACY_BRAND,
};

/**
 * Which rule codes apply to which text class.
 *
 * `marketing` is the register for a surface whose job is to be read and acted
 * on: a blog post, a launch post, a case study, a landing page, an ad. It runs
 * the generated-text tells (SLOP), the contrast and typography rules, the
 * private-name and placeholder rules, and the legacy-brand rule. It does NOT
 * run SLOP-CORP, SLOP-HOOK, HEDGE, UNDERSELL or PROCESS, because those exist to
 * keep documentation neutral and a marketing surface is not documentation.
 * Docs, UI, labels and manifests keep every rule they had.
 */
const CLASS_RULES = {
  prose: ['PRIVATE-NAME', 'INTERNAL-TERM', 'PROCESS', 'PLACEHOLDER', 'ENCODING', 'SLOP', 'SLOP-CORP', 'SLOP-HOOK', 'SLOP-CONTRAST', 'TYPOGRAPHY', 'UNDERSELL'],
  marketing: ['PRIVATE-NAME', 'INTERNAL-TERM', 'PLACEHOLDER', 'ENCODING', 'SLOP', 'SLOP-CONTRAST', 'TYPOGRAPHY', 'LEGACY-BRAND'],
  short: ['PRIVATE-NAME', 'INTERNAL-TERM', 'PROCESS', 'PLACEHOLDER', 'ENCODING', 'SLOP', 'SLOP-CORP', 'SLOP-HOOK', 'SLOP-CONTRAST', 'TYPOGRAPHY', 'HEDGE', 'LEGACY-BRAND'],
  manifest: ['PRIVATE-NAME', 'INTERNAL-TERM', 'PROCESS', 'PLACEHOLDER', 'ENCODING', 'SLOP', 'SLOP-CORP', 'SLOP-HOOK', 'SLOP-CONTRAST', 'TYPOGRAPHY', 'HEDGE', 'LEGACY-BRAND'],
  comment: ['PRIVATE-NAME', 'PLACEHOLDER', 'ENCODING', 'SLOP'],
  string: ['PRIVATE-NAME', 'PLACEHOLDER', 'ENCODING', 'SLOP', 'TYPOGRAPHY', 'LEGACY-BRAND'],
  technical: ['PRIVATE-NAME', 'PLACEHOLDER', 'ENCODING'],
};

/**
 * Files whose whole job is to be read and acted on. They scan as `marketing`
 * for their body and keep the `short` rules on headings and frontmatter, so a
 * hook is free and a title still cannot hedge.
 */
export const MARKETING_FILES = [
  /(?:^|\/)launch-playbook\/.*\.md$/,
  /(?:^|\/)blog\/.*\.mdx?$/,
  /(?:^|\/)case-studies?\/.*\.mdx?$/,
  /(?:^|\/)marketing\/.*\.mdx?$/,
];

export const ALLOW = /(?:language|leak)-gate:\s*allow/i;

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

const PROSE_EXT = new Set(['.md', '.mdx']);
const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.css', '.svg']);
const MANIFEST_EXT = new Set(['.json', '.yml', '.yaml']);
const MANIFEST_FIELDS = new Set(['description', 'summary', 'title', 'label', 'shortDescription', 'longDescription', 'defaultPrompt', 'prompt', 'name', 'group', 'tagline', 'headline', 'subtitle', 'text', 'message', 'hint']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'cjs', 'coverage', '.next', 'images']);

/** Signed packets and the whitepaper: technical surfaces. */
const TECHNICAL = [/(?:^|\/)public\/evidence\//, /(?:^|\/)whitepaper\.mdx$/, /(?:^|\/)LICENSE$/, /(?:^|\/)NOTICE$/, /(?:^|\/)CODE_OF_CONDUCT\.md$/];
/** Files that are never read: lockfiles, binaries, generated bundles. */
const SKIP_FILES = [/package-lock\.json$/, /\.min\.(?:js|css)$/, /\.map$/, /SHA256SUMS$/, /\.jsonl$/];

/** Every tracked file, or a directory walk where git is unavailable. */
export function listFiles(root) {
  const ls = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
  let files;
  if (ls.status === 0) {
    files = ls.stdout.split('\0').filter(Boolean);
  } else {
    files = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else files.push(path.relative(root, full).split(path.sep).join('/'));
      }
    };
    walk(root);
  }
  return files
    .filter((rel) => !rel.split('/').some((seg) => SKIP_DIRS.has(seg)))
    .filter((rel) => !SKIP_FILES.some((p) => p.test(rel)))
    .filter((rel) => fs.existsSync(path.join(root, rel)));
}

/** Markdown: fenced code is blanked; everything else is read line by line. */
export function readProse(text) {
  let fence = null;
  const lines = [];
  let inFrontmatter = false;
  text.split('\n').forEach((line, i) => {
    if (i === 0 && /^---\s*$/.test(line)) {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (/^---\s*$/.test(line)) inFrontmatter = false;
      else {
        const m = line.match(/^(title|description|sidebarTitle|summary):\s*["']?(.*?)["']?\s*$/);
        if (m) lines.push({ line: i + 1, cls: 'short', text: m[2] });
      }
      return;
    }
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (line.trim().startsWith(fence)) fence = null;
      return;
    }
    if (fence) return;
    const cls = /^\s*#{1,6}\s/.test(line) ? 'short' : 'prose';
    lines.push({ line: i + 1, cls, text: line });
  });
  return lines;
}

/** JSON and YAML: the prose-bearing fields only. */
export function readManifest(text, ext) {
  const out = [];
  if (ext === '.json') {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return out;
    }
    const lineOf = (value) => {
      const needle = JSON.stringify(value).slice(1, -1).slice(0, 60);
      const idx = needle ? text.indexOf(needle) : -1;
      return idx < 0 ? 1 : text.slice(0, idx).split('\n').length;
    };
    const visit = (node, keyPath) => {
      if (Array.isArray(node)) node.forEach((v, i) => visit(v, `${keyPath}[${i}]`));
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
          if (typeof v === 'string' && MANIFEST_FIELDS.has(k)) out.push({ line: lineOf(v), cls: 'manifest', text: v, field: `${keyPath}.${k}`.replace(/^\./, '') });
          else if (Array.isArray(v) && MANIFEST_FIELDS.has(k)) v.forEach((s, i) => typeof s === 'string' && out.push({ line: lineOf(s), cls: 'manifest', text: s, field: `${keyPath}.${k}[${i}]` }));
          else visit(v, `${keyPath}.${k}`);
        }
      }
    };
    visit(data, '');
    return out;
  }
  text.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*(?:-\s*)?(description|title|label|name|summary|placeholder|value):\s*["']?(.*?)["']?\s*$/);
    if (m) out.push({ line: i + 1, cls: 'manifest', text: m[2], field: m[1] });
  });
  return out;
}

/**
 * Source: comments and string literals. A small tokenizer that understands
 * line and block comments, the three string forms, template literals with
 * nested expressions, and regex literals by position.
 */
export function readCode(text, ext) {
  const out = [];
  const push = (cls, start, end) => {
    const body = text.slice(start, end);
    const base = text.slice(0, start).split('\n').length;
    body.split('\n').forEach((t, i) => {
      if (t.trim()) out.push({ line: base + i, cls, text: t });
    });
  };
  if (ext === '.css') {
    const re = /\/\*[\s\S]*?\*\//g;
    let m;
    while ((m = re.exec(text))) push('comment', m.index, m.index + m[0].length);
    return out;
  }
  if (ext === '.svg') {
    text.split('\n').forEach((line, i) => {
      const t = line.replace(/<[^>]+>/g, ' ').trim();
      if (t) out.push({ line: i + 1, cls: 'string', text: t });
      const attrs = [...line.matchAll(/(?:aria-label|title|desc)="([^"]*)"/g)];
      for (const a of attrs) out.push({ line: i + 1, cls: 'string', text: a[1] });
    });
    return out;
  }
  const jsx = ext === '.jsx' || ext === '.tsx';
  const n = text.length;
  let i = 0;
  let lastSig = '';
  const regexAllowed = () => /^(?:|[(,=:[!&|?{};+\-*%<>~^]|return|typeof|case|do|else|in|of|yield|await|throw|void|delete|new)$/.test(lastSig);
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '/') {
      const end = text.indexOf('\n', i);
      const stop = end < 0 ? n : end;
      push('comment', i + 2, stop);
      i = stop;
      continue;
    }
    if (c === '/' && d === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end;
      push('comment', i + 2, stop);
      i = stop + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let k = i + 1;
      while (k < n && text[k] !== c && text[k] !== '\n') {
        if (text[k] === '\\') k++;
        k++;
      }
      push('string', i + 1, k);
      i = k + 1;
      lastSig = 'str';
      continue;
    }
    if (c === '`') {
      let k = i + 1;
      let depth = 0;
      while (k < n) {
        const ch = text[k];
        if (ch === '\\') {
          k += 2;
          continue;
        }
        if (depth === 0 && ch === '`') break;
        if (ch === '$' && text[k + 1] === '{') {
          depth++;
          k += 2;
          continue;
        }
        if (depth > 0 && ch === '}') depth--;
        k++;
      }
      push('string', i + 1, k);
      i = k + 1;
      lastSig = 'str';
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let k = i + 1;
      let inClass = false;
      while (k < n && text[k] !== '\n') {
        if (text[k] === '\\') {
          k += 2;
          continue;
        }
        if (text[k] === '[') inClass = true;
        else if (text[k] === ']') inClass = false;
        else if (text[k] === '/' && !inClass) break;
        k++;
      }
      i = k + 1;
      lastSig = 'rx';
      continue;
    }
    if (jsx && c === '>' && text[i - 1] !== '=') {
      // JSX text node: from a closing '>' to the next '<' or '{', on one line,
      // and only when it reads as words rather than code.
      const end = text.slice(i + 1).search(/[<{\n]/);
      if (end > 0) {
        const t = text.slice(i + 1, i + 1 + end);
        if (/^[\sA-Za-z0-9,.'"!?:;()-]+$/.test(t) && /[A-Za-z]{3,}\s+[A-Za-z]/.test(t)) push('string', i + 1, i + 1 + end);
      }
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const m = text.slice(i).match(/^[A-Za-z_$][\w$]*/);
    if (m) {
      lastSig = m[0];
      i += m[0].length;
      continue;
    }
    lastSig = c;
    i++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

/** Classify a file; `null` means it is not a public text surface. */
export function classify(rel) {
  const ext = path.extname(rel).toLowerCase();
  const base = path.basename(rel);
  if (TECHNICAL.some((p) => p.test(rel))) return { kind: 'technical', ext };
  if (PROSE_EXT.has(ext) || base === 'LICENSE' || base === 'NOTICE') {
    const marketing = MARKETING_FILES.some((p) => p.test(rel));
    return { kind: 'prose', ext, marketing };
  }
  if (MANIFEST_EXT.has(ext)) return { kind: 'manifest', ext };
  if (CODE_EXT.has(ext)) return { kind: 'code', ext };
  if (ext === '.txt') return { kind: 'prose', ext };
  return null;
}

export function scanText(rel, text, kind, ext, options = {}) {
  const findings = [];
  const isChangelog = /(?:^|\/)CHANGELOG\.md$/i.test(rel) || /(?:^|\/)changelog\.mdx$/i.test(rel);
  const isMarketing = options.marketing ?? MARKETING_FILES.some((p) => p.test(rel));
  let units;
  if (kind === 'technical') {
    units = text.split('\n').map((t, i) => ({ line: i + 1, cls: 'technical', text: t }));
  } else if (kind === 'prose') {
    units = readProse(text);
    // A marketing page's body prose runs the marketing register. Its headings,
    // frontmatter and anything already classified `short` keep the short rules.
    if (isMarketing) {
      for (const u of units) if (u.cls === 'prose') u.cls = 'marketing';
    }
  } else if (kind === 'manifest') {
    units = readManifest(text, ext);
  } else {
    units = readCode(text, ext);
  }
  const extraRules = options.extraRules || {};
  const classRules = options.classRules || CLASS_RULES;
  const sourceLines = text.split('\n');
  for (const u of units) {
    if (!u.text.trim() || ALLOW.test(u.text) || ALLOW.test(sourceLines[u.line - 1] || '')) continue;
    const codes = classRules[u.cls] || [];
    for (const code of codes) {
      let patterns = RULES[code] || [];
      if (extraRules[code]) patterns = [...patterns, ...extraRules[code]];
      if (code === 'PROCESS' && isChangelog) patterns = [...patterns, ...CHANGELOG_PROCESS];
      for (const pattern of patterns) {
        const m = u.text.match(pattern);
        if (m) {
          findings.push({ file: rel, line: u.line, code, cls: u.cls, hit: m[0], text: u.text.trim().slice(0, 140), field: u.field });
          break;
        }
      }
    }
  }
  return findings;
}

export function scanRepo(root, options = {}) {
  const findings = [];
  const include = options.include;
  const exclude = options.exclude || [];
  for (const rel of listFiles(root)) {
    if (include && !include.some((p) => p.test(rel))) continue;
    if (exclude.some((p) => p.test(rel))) continue;
    const c = classify(rel);
    if (!c) continue;
    const buf = fs.readFileSync(path.join(root, rel));
    if (buf.includes(0)) continue;
    const text = buf.toString('utf8');
    findings.push(...scanText(rel, text, c.kind, c.ext, options));
  }
  return findings;
}

export function report(findings, { json = false, label = 'Public-surface language gate' } = {}) {
  if (json) {
    console.log(JSON.stringify(findings, null, 2));
    return findings.length === 0;
  }
  if (findings.length === 0) {
    console.log(`${label}: passed.`);
    return true;
  }
  console.error(`${label}: ${findings.length} finding(s)\n`);
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, list] of byFile) {
    console.error(`  ${file}`);
    for (const f of list) console.error(`    :${String(f.line).padEnd(5)} ${f.code.padEnd(14)} [${f.hit}]  ${f.text}`);
  }
  console.error('\nSay what the product does for the reader. Keep private names, shorthand, process,\nplaceholders, filler and dashes out. A line that must quote a term it explains may end\nwith "language-gate: allow <reason>".');
  return false;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const root = rootIdx >= 0 ? path.resolve(args[rootIdx + 1]) : path.resolve(import.meta.dirname, '..');
  const ok = report(scanRepo(root), { json: args.includes('--json') });
  process.exit(ok ? 0 : 1);
}
