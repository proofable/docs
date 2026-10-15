/**
 * Whitepaper PDF builder — Proofable docs.
 *
 * Source of truth: whitepaper.mdx (+ images/whitepaper/*.svg).
 * Output format: the approved whitepaper print design (light procurement paper,
 * tokens matching docs/proofable-tokens.css and neus.tokens.json):
 *   paper #ffffff, ink #050505, secondary #1b1d21, muted #5a5a5a,
 *   border rgba(90,90,90,.28), tint rgba(152,192,239,.1),
 *   accent #98c0ef / dim #3d72c9 / ink #2f5097, Geist (Google Fonts, as docs.json).
 *
 * Run: npm run whitepaper:pdf
 * The script fails loudly on any mdx construct it does not recognize; it never
 * silently drops content.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import os from 'node:os';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const MDX = path.join(ROOT, 'whitepaper.mdx');
const IMAGES = path.join(ROOT, 'images', 'whitepaper');
const LOGO = path.join(ROOT, 'images', 'proofable-mark.svg');
const DOCS_HOST = 'https://docs.proofable.me';
// One single-weight css2 URL each: Google's multi-weight css2 response is a
// variable font that Edge/Chrome headless print cannot apply (silent FOIT).
const GEIST_CSS_URLS = [400, 500, 600, 700].map(
  (w) => `https://fonts.googleapis.com/css2?family=Geist:wght@${w}&display=swap`
);

const outArg = process.argv.find((a) => a.startsWith('--out='));
const OUT = outArg
  ? path.resolve(outArg.slice(6))
  : path.join(ROOT, 'artifacts', 'Proofable-Whitepaper-v1.0.pdf');

class ParseError extends Error {}

/* ---------------- mdx parsing ---------------- */

function stripFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) throw new ParseError('frontmatter not found');
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const km = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (km) meta[km[1]] = km[2];
  }
  return { meta, body: src.slice(m[0].length) };
}

function inline(md) {
  let s = md;
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000C${codes.length - 1}\u0000`;
  });
  const links = [];
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    links.push({ text: inlineTextOnly(text), href });
    return `\u0000L${links.length - 1}\u0000`;
  });
  s = inlineTextOnly(s);
  s = s.replace(/\u0000L(\d+)\u0000/g, (_, i) => {
    const l = links[Number(i)];
    // A site-absolute link (/learn/standards) has no origin in a local file:
    // without this it prints as file:///C:/… and is dead in the shipped PDF.
    return `<a href="${esc(resolveHref(l.href))}">${l.text}</a>`;
  });
  s = s.replace(/\u0000C(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

function inlineTextOnly(s) {
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resolveHref(href) {
  return href.startsWith('/') ? DOCS_HOST + href : href;
}

/** Parse the whitepaper mdx body into typed blocks. Throws on unknown syntax. */
function parseBody(body) {
  const lines = body.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  const flushParas = (buf) => {
    if (buf.length) blocks.push({ type: 'p', lines: buf.splice(0) });
  };
  const paraBuf = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { flushParas(paraBuf); i++; continue; }
    if (line.startsWith('<Frame caption=')) {
      flushParas(paraBuf);
      const cap = line.match(/^<Frame caption="(.*)">$/);
      if (!cap) throw new ParseError(`bad Frame at line ${i + 1}: ${line}`);
      const imgLine = lines[i + 1];
      const img = imgLine && imgLine.match(/^\s*<img src="([^"]+)" alt="([^"]*)" \/>$/);
      if (!img) throw new ParseError(`bad img inside Frame at line ${i + 2}: ${imgLine}`);
      if ((lines[i + 2] || '').trim() !== '</Frame>') throw new ParseError(`Frame not closed at line ${i + 3}`);
      blocks.push({ type: 'figure', src: img[1], alt: img[2], caption: cap[1] });
      i += 3;
      continue;
    }
    if (line.startsWith('## ')) { flushParas(paraBuf); blocks.push({ type: 'h2', text: line.slice(3) }); i++; continue; }
    if (line.startsWith('### ')) { flushParas(paraBuf); blocks.push({ type: 'h3', text: line.slice(4) }); i++; continue; }
    if (line.startsWith('| ')) {
      flushParas(paraBuf);
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i]);
        i++;
      }
      if (rows.length < 3 || !/^\|\s*-{3}/.test(rows[1])) throw new ParseError('malformed table');
      const cells = rows.map((r) => r.slice(2, -2).split(' | ').map((c) => c.trim()));
      blocks.push({ type: 'table', head: cells[0], rows: cells.slice(2) });
      continue;
    }
    if (line.startsWith('- ')) {
      flushParas(paraBuf);
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('  - '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      flushParas(paraBuf);
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }
    // paragraph line (may be a hard-break multiline paragraph)
    paraBuf.push(line);
    i++;
  }
  flushParas(paraBuf);
  return blocks;
}

/* ---------------- html rendering ---------------- */

function renderInlineParagraph(lines) {
  // A paragraph whose lines end with two trailing spaces joins with <br>.
  // Markers must not survive inline(); placeholders pass through escaping.
  const parts = lines.map((l, idx) => {
    const hardBreak = /\s{2}$/.test(l) && idx < lines.length - 1;
    return l.replace(/\s{2}$/, '') + (hardBreak ? '\u0000BR\u0000' : '\u0000P\u0000');
  });
  let html = inline(parts.join(''));
  html = html.replace(/\u0000BR\u0000/g, '<br>').replace(/\u0000P\u0000/g, ' ');
  return `<p>${html}</p>`;
}

function figureSvg(src) {
  const file = path.join(IMAGES, path.basename(src));
  if (!fs.existsSync(file)) throw new ParseError(`missing figure: ${src}`);
  return fs.readFileSync(file, 'utf8').replace(/<\?xml[^>]*\?>/, '');
}

function renderBlocks(blocks) {
  const out = [];
  let inRefs = false;
  for (const b of blocks) {
    switch (b.type) {
      case 'h2':
        if (b.text.startsWith('References')) inRefs = true;
        out.push(`<h2>${inline(b.text)}</h2>`);
        break;
      case 'h3':
        out.push(`<h3>${inline(b.text)}</h3>`);
        break;
      case 'p':
        out.push(renderInlineParagraph(b.lines));
        break;
      case 'ul':
        out.push(`<ul>${b.items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`);
        break;
      case 'ol':
        out.push(`<ol>${b.items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`);
        break;
      case 'table':
        out.push(
          `<table><thead><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead>` +
            `<tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        );
        break;
      case 'figure':
        out.push(
          `<figure class="wp-figure">${figureSvg(b.src)}` +
            `<figcaption>${inline(b.caption)}</figcaption></figure>`
        );
        break;
      default:
        throw new ParseError(`unhandled block ${b.type}`);
    }
  }
  return { html: out.join('\n'), inRefs };
}

/* ---------------- fonts ----------------
 * Edge/Chrome headless print-to-pdf silently drops text for data:/file:
 * @font-face sources (FOIT print bug) and can print mid-swap without a time
 * budget (the 2026-10 mint print shipped Times-bold headings because Geist
 * had not finished loading). Network css2 + --virtual-time-budget loads and
 * embeds Geist deterministically; the post-print assertion enforces it. */

/* ---------------- page css (port of neus-whitepaper-print.css) ---------------- */

function pageCss() {
  return `
:root {
  --wp-paper: #ffffff;
  --wp-ink: #050505;
  --wp-ink-secondary: #1b1d21;
  --wp-muted: #5a5a5a;
  --wp-border: rgba(90, 90, 90, 0.28);
  --wp-tint: rgba(152, 192, 239, 0.1);
  --wp-accent: #98c0ef;
  --wp-accent-dim: #3d72c9;
  --wp-accent-dark: #2f5097;
  --wp-radius-sm: 6px;
  --wp-radius-md: 8px;
  --wp-font-sans: 'Geist', 'Segoe UI', Arial, sans-serif;
}
@page { size: Letter; margin: 18mm 16mm 20mm 16mm; }
@page :first { margin: 0; }
html, body {
  margin: 0; padding: 0;
  background: var(--wp-paper); color: var(--wp-ink);
  font-family: var(--wp-font-sans); font-size: 10pt; line-height: 1.5;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.wp-cover {
  box-sizing: border-box;
  min-height: 100vh; min-height: 100dvh;
  padding: 28mm 22mm 24mm;
  display: flex; flex-direction: column; justify-content: space-between;
  background: var(--wp-paper); color: var(--wp-ink);
  page-break-after: always; break-after: page;
}
.cover-brand { display: flex; align-items: center; gap: 12px; }
.cover-brand img { width: 36px; height: 36px; display: block; }
.cover-org { margin: 0; font-size: 11pt; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--wp-ink); }
.cover-doctype { margin: 48px 0 0; font-size: 10pt; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--wp-accent-dim); }
.cover-title { margin: 18px 0 0; max-width: 16ch; font-size: 32pt; font-weight: 600; line-height: 1.15; letter-spacing: -0.02em; color: var(--wp-ink); }
.cover-epigraph { margin: 36px 0 0; max-width: 34em; font-size: 12pt; line-height: 1.45; color: var(--wp-ink-secondary); }
.cover-meta { width: 100%; max-width: 28em; margin: 48px 0 0; border-collapse: collapse; font-size: 10pt; }
.cover-meta td { padding: 6px 0; vertical-align: top; border: 0; }
.cover-meta td:first-child { width: 7.5em; padding-right: 1.25em; color: var(--wp-muted); font-weight: 600; }
.cover-foot { margin-top: auto; padding-top: 40px; font-size: 9pt; color: var(--wp-muted); }
.cover-foot a { color: var(--wp-accent-dim); text-decoration: none; }
.wp-body { max-width: 42rem; margin: 0 auto; }
.wp-body h1 { font-size: 18pt; font-weight: 600; line-height: 1.2; margin: 0 0 0.65em; color: var(--wp-ink); }
.wp-body h2 { font-size: 12.5pt; font-weight: 650; margin: 1.55em 0 0.5em; color: var(--wp-ink); page-break-after: avoid; }
.wp-body h2:first-child { margin-top: 0; }
.wp-body h3 { font-size: 10.5pt; font-weight: 650; margin: 1.15em 0 0.35em; color: var(--wp-ink-secondary); page-break-after: avoid; }
.wp-body p, .wp-body li { orphans: 3; widows: 3; }
.wp-body a { color: var(--wp-accent-dark); text-decoration: none; }
.wp-body table { width: 100%; border-collapse: collapse; margin: 0.85em 0 1.1em; font-size: 9pt; page-break-inside: avoid; }
.wp-body th, .wp-body td { border: 1px solid var(--wp-border); padding: 0.4em 0.5em; text-align: left; vertical-align: top; }
.wp-body th { background: var(--wp-tint); color: var(--wp-accent-dark); font-weight: 650; }
.wp-body code { font-family: var(--wp-font-sans); font-size: 9pt; }
.wp-body ul, .wp-body ol { margin: 0.5em 0 0.9em; padding-left: 1.4em; }
.wp-body li { margin: 0.2em 0; }
figure.wp-figure { margin: 1em 0 1.15em; padding: 0; page-break-inside: avoid; text-align: center; }
figure.wp-figure svg { display: block; width: 100%; max-width: 100%; height: auto; border: 1px solid var(--wp-border); border-radius: var(--wp-radius-md); background: var(--wp-paper); }
figure.wp-figure figcaption { margin: 0.45em 0 0; font-size: 8.75pt; color: var(--wp-muted); font-style: italic; text-align: left; }
.abstract-box { margin: 0 0 1.25em; padding: 1em 1.15em 1.05em; border: 1.5px solid var(--wp-accent); background: var(--wp-tint); border-radius: var(--wp-radius-md); page-break-inside: avoid; }
.abstract-box .abstract-label { margin: 0 0 0.55em; font-size: 11pt; font-weight: 700; color: var(--wp-accent-dark); }
.abstract-box p { margin: 0 0 0.65em; }
.abstract-box p:last-child { margin-bottom: 0; }
`;
}

/* ---------------- build ---------------- */

function escAttr(s) {
  return esc(s);
}

async function main() {
  console.log('whitepaper-to-pdf');
  console.log(`  source : ${MDX}`);
  const src = fs.readFileSync(MDX, 'utf8');
  const { meta, body } = stripFrontmatter(src);
  const blocks = parseBody(body);

  // Front section: the mdx carries the cover meta as its opening paragraphs.
  // The cover renders them; they must not duplicate into the body.
  const [doctype, authorBlock] = blocks;
  if (!doctype || doctype.type !== 'p' || doctype.lines.join('\n') !== '**Whitepaper - October 2026**') {
    throw new ParseError(`unexpected doctype line: ${JSON.stringify(doctype && doctype.lines)}`);
  }
const introExpected = [
  '**Author:** Christopher Leal, Founder & Protocol Architect, Proofable',
  '**Published by:** Proofable',
  '**Legal entity:** NEUS Network, Inc.',
  '**Contact:** chris@proofable.me',
].join('\n');
// 'Published by' is redundant on the cover (title already names Proofable) and
// is intentionally not rendered as its own row.
const COVER_META_SKIP = new Set(['Published by: Proofable']);
  const norm = (lines) => lines.map((l) => l.trimEnd()).join('\n');
  if (!authorBlock || authorBlock.type !== 'p' || norm(authorBlock.lines) !== introExpected) {
    throw new ParseError(`unexpected cover meta block:\n${authorBlock && authorBlock.lines.join('\n')}`);
  }

  const abstractIdx = blocks.findIndex((b) => b.type === 'h2' && b.text === 'Abstract');
  if (abstractIdx !== 2) throw new ParseError('expected Abstract after the cover meta');
  const nextSectionIdx = blocks.findIndex((b, i) => i > abstractIdx && b.type === 'h2');
  const abstractBlocks = blocks.slice(abstractIdx + 1, nextSectionIdx);
  const restBlocks = blocks.slice(nextSectionIdx);

  const geistHead = `<style>${GEIST_CSS_URLS.map((u) => `@import url('${u}');`).join('')}</style>`;

  const logo = fs.readFileSync(LOGO, 'utf8');
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;

  const abstractHtml =
    `<section class="abstract-box"><p class="abstract-label">Abstract</p>` +
    abstractBlocks.map((b) => renderBlocks([b]).html).join('') +
    `</section>`;

  const { html: restHtml } = renderBlocks(restBlocks);

  const cover = `
<section class="wp-cover">
  <div>
    <div class="cover-brand">
      <img src="${logoDataUri}" alt="Proofable mark">
    </div>
    <p class="cover-doctype">Whitepaper</p>
    <h1 class="cover-title">${escAttr(meta.title)}</h1>
    <p class="cover-epigraph">${escAttr(meta.description)}</p>
  </div>
  <div>
    <table class="cover-meta">
      <tr><td>Version</td><td>1.0</td></tr>
      <tr><td>Date</td><td>October 2026</td></tr>
      <tr><td>Author</td><td>Christopher Leal, Founder &amp; Protocol Architect</td></tr>
      <tr><td>Legal entity</td><td>NEUS Network, Inc.</td></tr>
      <tr><td>Contact</td><td><a href="mailto:chris@proofable.me">chris@proofable.me</a></td></tr>
    </table>
  </div>
  <p class="cover-foot">
    <a href="https://proofable.me">proofable.me</a> | <a href="https://docs.proofable.me">docs.proofable.me</a>
  </p>
</section>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escAttr(meta.title)}</title>
<meta name="author" content="Christopher Leal">
<meta name="description" content="${escAttr(meta.description)}">
  ${geistHead}
  <style>${pageCss()}</style>
</head>
<body>
${cover}
<article class="wp-body">
${abstractHtml}
${restHtml}
</article>
</body>
</html>`;

  const buildDir = path.join(os.tmpdir(), 'proofable-whitepaper');
  fs.mkdirSync(buildDir, { recursive: true });
  const htmlPath = path.join(buildDir, 'whitepaper-print.html');
  fs.writeFileSync(htmlPath, html);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (fs.existsSync(OUT)) fs.rmSync(OUT);

  // A running Edge/Chrome on the default profile swallows --print-to-pdf: the new
  // process hands the URL to the existing session, exits 0, and writes nothing.
  // An isolated --user-data-dir keeps the print self-contained, and every
  // candidate is attempted in turn so one broken install cannot block the build.
  // Each candidate prints to its own temp path and is polled until the file stops
  // growing: a browser can exit before its write lands, and two browsers pointed
  // at one path race for the last writer.
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter((p) => fs.existsSync(p));
  if (!candidates.length) throw new Error('no Edge/Chrome found for print-to-pdf');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let rendered = null;
  for (const browser of candidates) {
    const label = path.basename(browser);
    const attemptOut = path.join(buildDir, `out-${label}.pdf`);
    fs.rmSync(attemptOut, { force: true });
    // One throwaway profile per candidate: a profile written by a different
    // browser (or left over from an interrupted run) makes the next print exit
    // non-zero without writing a file.
    const profileDir = path.join(buildDir, `print-profile-${label}`);
    fs.rmSync(profileDir, { recursive: true, force: true });
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profileDir}`,
      '--no-pdf-header-footer',
      '--print-to-pdf-no-header',
      `--print-to-pdf=${attemptOut}`,
      '--virtual-time-budget=20000',
      '--run-all-compositor-stages-before-draw',
      pathToFileURL(htmlPath).href,
    ];
    console.log(`  render : ${label} -> ${OUT}`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn(browser, args, { stdio: 'ignore' });
      child.on('exit', resolve);
      child.on('error', reject);
    });
    let written = 0;
    for (let tick = 0; tick < 40; tick++) {
      const size = fs.existsSync(attemptOut) ? fs.statSync(attemptOut).size : 0;
      if (size > 0 && size === written) break; // present and no longer growing
      written = size;
      await sleep(250);
    }
    if (written > 0) {
      // copy, not rename: the build dir is on the system temp volume, OUT may not be
      fs.copyFileSync(attemptOut, OUT);
      fs.rmSync(attemptOut, { force: true });
      rendered = label;
      break;
    }
    console.log(`  retry  : ${label} exited ${code} and wrote no pdf`);
  }
  for (const browser of candidates) {
    fs.rmSync(path.join(buildDir, `out-${path.basename(browser)}.pdf`), { force: true });
  }
  if (!rendered) {
    throw new Error(`pdf was not written by any browser (${candidates.map((p) => path.basename(p)).join(', ')})`);
  }
  console.log(`  writer : ${rendered}`);

  const size = fs.statSync(OUT).size;
  if (size < 100000) throw new Error(`pdf suspiciously small (${size} bytes)`);

  // Typography assertion: Geist must be embedded; serif fallback must not appear.
  // Arial remains legitimate inside the figure SVGs (they declare Inter, Arial).
  const pdfRaw = fs.readFileSync(OUT, 'latin1');
  const fonts = [...new Set([...pdfRaw.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#-]+)/g)].map((m) => m[1]))];
  const geistFaces = fonts.filter((f) => f.includes('Geist'));
  console.log(`  fonts  : ${fonts.join(', ')}`);
  if (geistFaces.length < 2) {
    throw new Error(`Geist did not embed (found: ${fonts.join(', ') || 'none'}) — refusing to ship a fallback-typeset whitepaper`);
  }
  if (fonts.some((f) => /Times/i.test(f))) {
    throw new Error(`serif fallback leaked into headings (found: ${fonts.join(', ')})`);
  }

  // Document properties. Headless print writes /Title only, plus a /Creator that
  // names the build browser (…HeadlessChrome/155.0.0.0 Safari/537.36) — wrong on a
  // document shipped to readers. Rewrite the single /Info dictionary with the
  // author, the cover description and a clean creator. The replacement is padded
  // to the exact original byte length, so every xref offset stays valid; Chrome
  // and Edge size that dictionary differently per build, so keep the richest
  // variant that still fits.
  const infoMatch = pdfRaw.match(/<<\/Title[^]*?>>/);
  if (!infoMatch) throw new Error('no /Info dictionary found to set document properties');
  const original = infoMatch[0];
  const dates = original.match(/\/CreationDate \([^)]*\)[^]*?\/ModDate \([^)]*\)/);
  const pdfString = (s) => `(${s.replace(/([\\()])/g, '\\$1')})`;
  const required = [`/Title ${pdfString(meta.title)}`, `/Author ${pdfString('Christopher Leal')}`];
  const optional = [
    `/Creator ${pdfString('Proofable whitepaper build')}`,
    `/Subject ${pdfString(meta.description)}`,
    '/Producer (Skia/PDF)',
  ];
  let patched = null;
  let kept = 0;
  for (let keep = optional.length; keep >= 0; keep--) {
    const candidate = `<<${[...required, ...optional.slice(0, keep)].join('\n')}\n${dates ? dates[0] : ''}>>`;
    if (candidate.length <= original.length) {
      patched = candidate;
      kept = keep;
      break;
    }
  }
  if (!patched) {
    throw new Error(`document properties do not fit the ${original.length}-byte /Info dictionary`);
  }
  patched = `${patched.slice(0, -2)}${' '.repeat(original.length - patched.length)}>>`;
  fs.writeFileSync(OUT, Buffer.from(pdfRaw.replace(original, () => patched), 'latin1'));

  const applied = ['Title', 'Author', ...optional.slice(0, kept).map((f) => f.slice(1).split(' ')[0])];
  console.log(`  props  : ${applied.join(', ')}${kept < optional.length ? ` (dropped ${optional.length - kept} that did not fit)` : ''}`);
  console.log(`  done   : ${(size / 1024).toFixed(0)} KB, geist faces: ${geistFaces.join(', ')}`);
}

main().catch((err) => {
  console.error(`whitepaper-to-pdf failed: ${err.message}`);
  process.exit(1);
});
