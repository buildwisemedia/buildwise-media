#!/usr/bin/env node
// bwm-gate-annotations.mjs — strip BWM build-gate comments from a publish
// bundle, then prove none remain.  v1.0.0
//
// Canonical copy: Brain tools/bwm-gate-annotations.mjs. Sites keep a
// byte-identical copy at scripts/bwm-gate-annotations.mjs, so every build is
// hermetic and a reviewed bundle can be rebuilt byte for byte.
//
// Why: BWM's gates need pragma comments in page SOURCE (R020 visual gate,
// Show-Don't-Tell density gate, creative copy gate, build-authoring router,
// client claim ledger, Pre-Ship Grep Gate). Those comments name internal
// process and models, and they were shipping in public page source. Source
// keeps them; the publish step removes them and then checks the result.
//
//   node bwm-gate-annotations.mjs strip <bundle-dir> [--receipt <file>]
//   node bwm-gate-annotations.mjs check <bundle-dir | https://site> [--pages N] [--allow-tag NAME]
//   node bwm-gate-annotations.mjs selftest
//   node bwm-gate-annotations.mjs version
//
// Astro sites: add bwmGateAnnotations() to `integrations` in astro.config.mjs.
// Before compile it strips .astro source, using Astro's own parser to find
// real template comments, and raw HTML/SVG imports (so pages rendered on
// request are covered); then it strips the finished build folder (public/
// files and the rest) and runs the check, failing the build on any leftover. Some
// local gates read these tags from the build folder (the Pre-Ship
// Show-Don't-Tell density scan), so BWM_KEEP_GATE_ANNOTATIONS=1 makes an
// annotated build for them. That build is never for publishing: a Cloudflare
// Pages build (CF_PAGES=1) refuses the setting.
//
// strip removes only comments that carry a known gate tag: HTML comments in
// markup, and CSS comments in stylesheets and <style>. It never edits
// attribute values, <script> or other raw-text content, unterminated
// comments, or files that are not UTF-8 text (those fail the run). Each
// changed file must still match its original once comments and whitespace are
// set aside, or it is left alone and the run fails. check is wider on
// purpose: it reads every file that decodes as text, and distinctive tags fail
// anywhere (scripts, attributes, source maps, worker code); a text-type file
// it cannot decode fails, a symlink fails, and an HTML comment that opens with
// an unknown @name fails, so a new gate tag cannot ship silently.
//
// Exit codes: 0 clean · 1 annotations remain, or nothing was scanned · 2 usage or I/O error.

import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { open, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const VERSION = '1.0.0';

// Every pragma a BWM gate reads. A gate pragma missing from this list still
// fails `check` (unknown @name comment) until it is added here.
export const GATE_TAGS = Object.freeze([
  'r020', 'r020-exempt', //                                ~/.claude/hooks/r020-visual-gate.py
  'sdt-exempt', 'sdt-interactive-proof', 'cta-proof', //   bwm-ops-events/hooks/sdt_density_gate.py
  'creative-exempt', 'internal-architecture', //           bwm-ops-events/hooks/creative_copy_gate.py
  'build-author-exempt', 'codex-authored', 'sol-authored', // bwm-ops-events/hooks/build_authoring_router.py
  'audience', 'proof', 'status', 'claim-ledger-exempt', // bwm-ops-events/hooks/client_claim_ledger.py
  'workflow-lint-exempt', //                               bwm-ops-events/hooks/workflow_lint_gate.py
  'bwm-exp-slot', 'bwm-exp-slot-exempt', //                Brain tools/Pre-Ship-Grep-Gate.sh (bwm-exp-slot)
  'r017c-sanctioned', //                                   Brain tools/Pre-Ship-Grep-Gate.sh (r017c-timeline-sanction)
]);

// Flagged only inside a comment the strip can reach. The first three are
// ordinary words ("@proof" can be a real social handle). Experiment-slot
// markers are also created on purpose by page scripts, which the strip never
// edits; the data-bwm-exp-slot attribute is what experiments read.
const COMMENT_ONLY_TAGS = new Set(['audience', 'proof', 'status', 'bwm-exp-slot', 'bwm-exp-slot-exempt']);
const RUNTIME_MARKERS = new Set(['bwm-exp-slot', 'bwm-exp-slot-exempt']);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// "@" must not follow an email, URL or handle character, and the tag must end
// where the name ends, so "ops@status.io" and "@proof-of-work" do not match.
// A comment delimiter touching the tag still counts: "<!--@r020",
// "<!---@r020", "@sol-authored-->", "@sol-authored--->".
const tagRegExp = (tags, flags) => new RegExp(
  `(?:(?<=<!-{2,})|(?<![\\w.%+/@-]))@(${[...tags].sort((a, b) => b.length - a.length).map(escapeRe).join('|')})(?:(?![\\w-])|(?=-*--!?>))`,
  flags,
);
const ANY_TAG = tagRegExp(GATE_TAGS, 'i');
const DISTINCT_TAGS = tagRegExp(GATE_TAGS.filter((t) => !COMMENT_ONLY_TAGS.has(t)), 'gi');
const COMMENT_ONLY = tagRegExp(COMMENT_ONLY_TAGS, 'gi');
const LEADING_PRAGMA = /^\s*@([a-z][a-z0-9-]*)(?=[\s:]|$)/i;
// The @name right after a comment opener, read in place (dashes and spaces skipped).
const OPENER_PRAGMA = /-*\s*@([a-z][a-z0-9-]*?)(?=-*--!?>|[\s:]|$)/iy;

const PAGE_EXT = new Set(['.html', '.htm', '.xhtml']);
const MARKUP_EXT = new Set([...PAGE_EXT, '.svg']);
// Files that must decode as text; anything else is read when it looks like text.
const TEXT_EXT = new Set([...MARKUP_EXT, '.css', '.js', '.mjs', '.cjs', '.json', '.map', '.xml', '.txt', '.md', '.webmanifest']);
const TEXT_NAMES = new Set(['_headers', '_redirects']);

const gateTagIn = (text) => ANY_TAG.exec(text)?.[1].toLowerCase() ?? null;
// An HTML comment's text without its delimiters (and the dashes next to them).
const commentInner = (comment) => comment.slice(4).replace(/--!?>$/, '').replace(/^-+|-+$/g, '');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------------------
// Comments the strip can reach
// ---------------------------------------------------------------------------

// Every tag is stepped over whole, so attribute values are never read as
// markup. In HTML, raw-text elements hold no comments: only <style> content
// is read (CSS comments); the rest is skipped whole. Inside <svg>/<math>, and
// in SVG files, no element is raw text, as in the HTML and XML parsers.
const MARKUP_TOKEN = /<!--|<!\[CDATA\[|<[!?]|<(\/?)([a-z][^\t\n\f\r />]*)/gi;
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext']);
const FOREIGN_ROOTS = new Set(['svg', 'math']);
// HTML start tags that end SVG/MathML content in an HTML page (HTML parser,
// "in foreign content"); <font> does too when it has color, face or size.
const FOREIGN_BREAKOUT = new Set(['b', 'big', 'blockquote', 'body', 'br', 'center', 'code', 'dd', 'div', 'dl', 'dt',
  'em', 'embed', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hr', 'i', 'img', 'li', 'listing', 'menu', 'meta', 'nobr',
  'ol', 'p', 'pre', 'ruby', 's', 'small', 'span', 'strong', 'strike', 'sub', 'sup', 'table', 'tt', 'u', 'ul', 'var']);
const CONDITIONAL = /^<!--\s*(?:\[if\b|<!\[endif\])/i;
// HTML tag syntax treats only these as whitespace (not NBSP or other Unicode spaces).
const tagSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\f' || c === '\r';

// End of the comment opened at `at` (index after its closer), or -1.
function commentEnd(text, at) {
  const s = at + 4;
  if (text.startsWith('>', s)) return s + 1; //  <!-->
  if (text.startsWith('->', s)) return s + 2; // <!--->
  const a = text.indexOf('-->', s);
  const b = text.indexOf('--!>', s);
  if (a < 0) return b < 0 ? -1 : b + 4;
  return b >= 0 && b < a ? b + 4 : a + 3;
}

// Index after the ">" that ends the tag opened at `at`, or -1. Follows the
// HTML tokenizer: a quote opens a value only right after "=", a quoted value
// may hold ">", and an unquoted value runs to whitespace or ">".
function tagEnd(text, at) {
  const n = text.length;
  let i = at + 1;
  while (i < n && text[i] !== '/' && text[i] !== '>' && !tagSpace(text[i])) i++; // tag name
  while (i < n) {
    if (text[i] === '>') return i + 1;
    if (text[i] === '/' || tagSpace(text[i])) {
      i++;
      continue;
    }
    i++; // an attribute name starts here, whatever its first character
    while (i < n && !'/>='.includes(text[i]) && !tagSpace(text[i])) i++;
    while (i < n && tagSpace(text[i])) i++;
    if (text[i] !== '=') continue;
    i++;
    while (i < n && tagSpace(text[i])) i++;
    if (text[i] === '"' || text[i] === "'") {
      const e = text.indexOf(text[i], i + 1);
      if (e < 0) return -1;
      i = e + 1;
    } else {
      while (i < n && text[i] !== '>' && !tagSpace(text[i])) i++;
    }
  }
  return -1;
}

const skipTo = (text, marker, from) => {
  const e = text.indexOf(marker, from);
  return e < 0 ? text.length : e + marker.length;
};

const cssNewline = (c) => c === '\n' || c === '\r' || c === '\f';

// CSS comments in text[lo, hi), skipping escapes, CSS strings and unquoted
// url(...) tokens. An unterminated comment is reported (for check) and ends
// the scan.
function* cssComments(text, lo, hi) {
  let i = lo;
  while (i < hi) {
    const ch = text[i];
    if (ch === '\\') {
      i += 2; // an escaped quote or slash (".before\:content-\[\'\'\]") is part of a name
    } else if (ch === '"' || ch === "'") {
      i++;
      while (i < hi && text[i] !== ch && !cssNewline(text[i])) {
        // An escaped newline continues the string; "\" + CRLF is one escape.
        if (text[i] === '\\') i += text[i + 1] === '\r' && text[i + 2] === '\n' ? 3 : 2;
        else i++;
      }
      i++;
    } else if ((ch === 'u' || ch === 'U') && /^url\($/i.test(text.slice(i, i + 4)) && !/[\w\u0080-\uffff-]/.test(text[i - 1] ?? '')) {
      let j = i + 4;
      while (j < hi && /\s/.test(text[j])) j++;
      if (text[j] === '"' || text[j] === "'") {
        i = j; // quoted: the string branch takes it
      } else {
        while (j < hi && text[j] !== ')') j += text[j] === '\\' ? 2 : 1; // "\)" does not end it
        i = Math.min(j + 1, hi);
      }
    } else if (ch === '/' && text[i + 1] === '*') {
      const e = text.indexOf('*/', i + 2);
      if (e < 0 || e + 2 > hi) {
        yield { start: i, end: hi, html: false, lo, hi, unterminated: true };
        return;
      }
      yield { start: i, end: e + 2, html: false, lo, hi };
      i = e + 2;
    } else {
      i++;
    }
  }
}

const closeTag = (text, name, from) => {
  const close = new RegExp(`</${name}(?=[\\t\\n\\f\\r />])`, 'gi');
  close.lastIndex = from;
  return close.exec(text);
};

// Where a <script> element's text ends, following the HTML tokenizer's script
// states: after "<!--", a nested "<script" makes the next "</script" part of
// the text, until "-->". Returns the index of the real "</script", or -1.
function scriptEnd(text, from) {
  const token = /<!--(?:-*>)?|-->|<\/?script(?=[\t\n\f\r />])/gi;
  token.lastIndex = from;
  let state = 'data';
  for (let m = token.exec(text); m; m = token.exec(text)) {
    const t = m[0].toLowerCase();
    if (t.startsWith('<!--')) {
      if (t !== '<!--') state = 'data'; // "<!-->", "<!--->": the "-->" inside ends any escape
      else if (state === 'data') state = 'escaped';
    } else if (t === '-->') {
      state = 'data';
    } else if (t === '<script') {
      if (state === 'escaped') state = 'double';
    } else if (state === 'double') {
      state = 'escaped';
    } else {
      return m.index;
    }
  }
  return -1;
}

// HTML comments in markup (not inside a tag, a raw-text element or CDATA),
// plus CSS comments inside <style>. `xml` marks an SVG file. An unterminated
// comment runs to the end of the file: it is reported (for check) and ends
// the scan.
function* markupComments(text, { xml = false } = {}) {
  const token = new RegExp(MARKUP_TOKEN.source, 'gi');
  let foreign = 0; // open <svg>/<math> elements in an HTML file
  let pos = 0;
  while (pos < text.length) {
    token.lastIndex = pos;
    const m = token.exec(text);
    if (!m) return;
    const at = m.index;
    const lead = m[0];
    if (lead === '<!--') {
      const end = commentEnd(text, at);
      if (end < 0) {
        yield { start: at, end: text.length, html: true, lo: 0, hi: text.length, unterminated: true };
        return;
      }
      yield { start: at, end, html: true, lo: 0, hi: text.length };
      pos = end;
      continue;
    }
    if (lead.startsWith('<![')) {
      // A CDATA section in SVG/MathML; in HTML, a bogus comment that ends at ">".
      pos = xml || foreign > 0 ? skipTo(text, ']]>', at + lead.length) : skipTo(text, '>', at + 2);
      continue;
    }
    if (lead === '<!' || lead === '<?') {
      pos = skipTo(text, '>', at + 2); // doctype, bogus comment, processing instruction
      continue;
    }
    const end = tagEnd(text, at);
    if (end < 0) return; // unterminated tag: nothing after it is markup
    const name = m[2].toLowerCase();
    const selfClosing = text[end - 2] === '/';
    pos = end;
    if (m[1]) {
      if (!xml && foreign > 0 && (name === 'br' || name === 'p')) foreign = 0;
      else if (!xml && foreign > 0 && FOREIGN_ROOTS.has(name)) foreign--;
      continue;
    }
    if (!xml && foreign > 0 && (FOREIGN_BREAKOUT.has(name)
      || (name === 'font' && /\s(?:color|face|size)\s*=/i.test(text.slice(at, end))))) {
      foreign = 0; // the HTML parser leaves SVG/MathML here and reads the tag as HTML
    }
    if (xml || foreign > 0) {
      if (!xml && FOREIGN_ROOTS.has(name) && !selfClosing) foreign++;
      // Foreign <style> text is CSS; its markup (comments, CDATA) is still scanned.
      if (name === 'style' && !selfClosing) yield* cssComments(text, end, closeTag(text, 'style', end)?.index ?? text.length);
      continue;
    }
    if (FOREIGN_ROOTS.has(name)) {
      if (!selfClosing) foreign = 1;
      continue;
    }
    if (!RAW_TEXT.has(name)) continue;
    if (name === 'plaintext') return;
    const close = name === 'script' ? scriptEnd(text, end) : closeTag(text, name, end)?.index ?? -1;
    if (name === 'style') yield* cssComments(text, end, close < 0 ? text.length : close);
    if (close < 0) return;
    const after = tagEnd(text, close); // the end tag may carry attributes too
    if (after < 0) return;
    pos = after;
  }
}

// ---------------------------------------------------------------------------
// Strip
// ---------------------------------------------------------------------------

// Widen a CSS comment's [start, end) to the whole line when it stands alone
// on it, so no blank line is left behind. lo/hi keep a <style> body's edges.
// HTML comments are never widened: around them whitespace can render (<pre>,
// white-space: pre), so it is kept exactly.
function wholeLine(text, start, end, lo, hi) {
  let a = start;
  while (a > lo && (text[a - 1] === ' ' || text[a - 1] === '\t')) a--;
  if (a > 0 && text[a - 1] !== '\n') return [start, end];
  let b = end;
  while (b < hi && (text[b] === ' ' || text[b] === '\t' || text[b] === '\r')) b++;
  if (b < text.length && text[b] !== '\n') return [start, end];
  return [a, Math.min(b + 1, text.length)];
}

// True when text ends inside a possible character reference ("&", "&cop", "&#0065").
function endsInReference(text) {
  let i = text.length;
  while (i > 0 && /[#\w]/.test(text[i - 1])) i--;
  return text[i - 1] === '&';
}

function stripComments(text, comments) {
  const cuts = [];
  const removed = [];
  for (const c of comments) {
    if (c.unterminated) continue; // never guess where it ends; check reports it
    const body = text.slice(c.start, c.end);
    const tag = c.html && CONDITIONAL.test(body) ? null : gateTagIn(body);
    if (!tag) continue;
    const [a, b] = c.html ? [c.start, c.end] : wholeLine(text, c.start, c.end, c.lo, c.hi);
    // An inline CSS comment leaves an empty one behind: it separates tokens
    // (A/* x */B is two words in CSS; AB would be one).
    cuts.push([a, b, !c.html && a === c.start && b === c.end ? '/**/' : '', c.html]);
    removed.push(tag);
  }
  cuts.sort((x, y) => x[0] - y[0]);
  let out = '';
  let at = 0;
  for (const [a, b, keep, html] of cuts) {
    if (b <= at) continue;
    out += text.slice(at, Math.max(a, at));
    at = b;
    // Keep an empty comment where removing one could change the page: joining
    // "&cop" and "y;" into a character reference, joining "<" and "b>" into a
    // tag, or putting a newline right after a tag (after <pre> the parser drops
    // it; any tag is treated alike).
    // Checked against the output so far, so a run of adjacent comments is
    // judged at its last one.
    const next = text.slice(b, b + 1);
    const guard = html && ((endsInReference(out) && /^[\w;#]/.test(next))
      || ((next === '\n' || next === '\r') && out.endsWith('>'))
      || (next === '\n' && out.endsWith('\r')) // "\r" + "\n" would merge two line breaks into one
      || (/<(?:!-?|\/)?$/.test(out.slice(-3)) && /^[a-z!/?-]/i.test(next))); // "<" + "b>" would become a tag
    out += guard ? '<!---->' : keep;
  }
  return { text: cuts.length ? out + text.slice(at) : text, removed };
}

// Remove gate-tagged comments from HTML, or from SVG with `xml: true`.
// Returns { text, removed: [tag, ...] }.
export function stripMarkup(text, { xml = false } = {}) {
  return stripComments(text, markupComments(text, { xml }));
}

// Remove gate-tagged comments from a stylesheet.
export function stripCss(text) {
  return stripComments(text, cssComments(text, 0, text.length));
}

// Remove gate-tagged comments from .astro source. `parse` is
// @astrojs/compiler's parse; it finds the real template comments, so
// frontmatter, attribute values and {expressions} are never touched. Its
// offsets are UTF-8 byte offsets (2.x reports a comment's start just after
// "<!--"). A comment is cut only where the bytes between its delimiters equal
// the parser's text for it; anything else throws. Template comments that open
// with an unknown @name are returned in `unknown`: nothing downstream checks
// server-rendered code for them.
export async function stripAstroSource(source, parse, { allowTags = [] } = {}) {
  const allow = new Set(allowTags.map((t) => t.toLowerCase()));
  const { ast } = await parse(source, { position: true });
  const bytes = Buffer.from(source, 'utf8');
  const at = (offset) => bytes.subarray(0, offset).toString('utf8').length;
  const comments = [];
  const unknown = [];
  const place = (node) => { // a text node's start, as a string index, once its bytes check out
    const s = node.position?.start?.offset;
    const e = node.position?.end?.offset;
    if (!Number.isInteger(s) || !Number.isInteger(e) || bytes.subarray(s, e).toString() !== node.value) {
      throw new Error(`bwm-gate-annotations: could not place Astro text at byte ${s}; not stripping by guesswork`);
    }
    return at(s);
  };
  const walk = (node, parent) => {
    // Text Astro emits as-is: <style> text is CSS; is:raw content is page markup,
    // except in raw-text elements (<script>, <textarea>, ...), which are never edited.
    const name = parent?.name;
    const raw = parent?.attributes?.some((a) => a.name === 'is:raw') && !RAW_TEXT.has(name);
    if (node.type === 'text' && (raw || name === 'style') && gateTagIn(node.value ?? '')) {
      const base = place(node);
      const inner = name === 'style' ? cssComments(node.value, 0, node.value.length) : markupComments(node.value);
      for (const c of inner) comments.push({ ...c, start: base + c.start, end: base + c.end, lo: base + c.lo, hi: base + c.hi });
    }
    if (node.type === 'comment') {
      const value = node.value ?? '';
      const lead = LEADING_PRAGMA.exec(value.replace(/^-+|-+$/g, ''))?.[1].toLowerCase();
      if (gateTagIn(`<!--${value}-->`)) { // delimiters restored, so "<!---@proof--->" still counts
        const s = node.position?.start?.offset;
        const e = node.position?.end?.offset;
        const closer = ['-->', '--!>'].find((m) => Number.isInteger(e) && bytes.subarray(e - m.length, e).toString() === m);
        const open = [s - 4, s].find((o) => Number.isInteger(o) && o >= 0 && closer
          && bytes.subarray(o, o + 4).toString() === '<!--'
          && bytes.subarray(o + 4, e - closer.length).toString() === value);
        if (open === undefined) {
          throw new Error(`bwm-gate-annotations: could not place an Astro comment at byte ${s}; not stripping by guesswork`);
        }
        comments.push({ start: at(open), end: at(e), html: true, lo: 0, hi: source.length });
      } else if (lead && !GATE_TAGS.includes(lead) && !allow.has(lead)) {
        unknown.push(`@${lead}`);
      }
    }
    for (const child of node.children ?? []) walk(child, node);
  };
  walk(ast, null);
  comments.sort((x, y) => x.start - y.start);
  return { ...stripComments(source, comments), unknown };
}

// What a file says once comments and whitespace are set aside. A strip must
// leave this unchanged. A CSS comment counts as a space, because in CSS it
// separates tokens.
export function outsideComments(text) {
  return text
    .replace(/<!--(?:>|->|[\s\S]*?--!?>)/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Every entry under `dir`, sorted. Symlinks are listed, never followed.
async function* walkEntries(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    const path = join(dir, e.name);
    if (e.isDirectory()) yield* walkEntries(path);
    else if (e.isFile()) yield { path, symlink: false };
    else if (e.isSymbolicLink()) yield { path, symlink: true };
  }
}

// UTF-8 text with no NUL bytes, as a string; otherwise null.
function utf8Text(raw) {
  const text = raw.toString('utf8');
  return !raw.includes(0) && Buffer.from(text, 'utf8').equals(raw) ? text : null;
}

// Text for checking: UTF-8, or UTF-16 with a byte-order mark. Null if binary.
function decodeForCheck(raw) {
  if (raw[0] === 0xff && raw[1] === 0xfe) return raw.subarray(2).toString('utf16le');
  if (raw[0] === 0xfe && raw[1] === 0xff) {
    const body = Buffer.from(raw.subarray(2, raw.length - (raw.length % 2)));
    return body.swap16().toString('utf16le');
  }
  return utf8Text(raw);
}

// Binary media are skipped after one small read.
async function looksBinary(path) {
  const handle = await open(path, 'r');
  try {
    const head = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(head, 0, head.length, 0);
    const sample = head.subarray(0, bytesRead);
    const bom16 = (sample[0] === 0xff && sample[1] === 0xfe) || (sample[0] === 0xfe && sample[1] === 0xff);
    return !bom16 && sample.includes(0);
  } finally {
    await handle.close();
  }
}

const relPath = (root, path) => relative(root, path).split(sep).join('/');

export async function toolSha256() {
  return sha256(await readFile(fileURLToPath(import.meta.url)));
}

// Strip every HTML, SVG and CSS file under `dir` in place.
export async function stripDir(dir) {
  const root = resolve(dir);
  const report = {
    tool: 'bwm-gate-annotations', version: VERSION, tool_sha256: await toolSha256(), dir: root,
    ok: false, html_files: 0, files_changed: 0, removed_total: 0, removed_by_tag: {}, changed: [], errors: [],
  };
  for await (const { path, symlink } of walkEntries(root)) {
    const rel = relPath(root, path);
    if (symlink) {
      report.errors.push(`${rel}: symlink in the bundle, not followed`);
      continue;
    }
    const ext = extname(path).toLowerCase();
    const markup = MARKUP_EXT.has(ext);
    if (!markup && ext !== '.css') continue;
    if (PAGE_EXT.has(ext)) report.html_files++;
    const raw = await readFile(path);
    const before = utf8Text(raw);
    if (before === null) {
      report.errors.push(`${rel}: not UTF-8 text, cannot be stripped or checked safely`);
      continue;
    }
    const { text: after, removed } = markup ? stripMarkup(before, { xml: ext === '.svg' }) : stripCss(before);
    if (!removed.length) continue;
    if (outsideComments(before) !== outsideComments(after)) {
      report.errors.push(`${rel}: strip would change more than comments, left unchanged`);
      continue;
    }
    const out = Buffer.from(after, 'utf8');
    await writeFile(path, out);
    report.files_changed++;
    report.removed_total += removed.length;
    for (const t of removed) report.removed_by_tag[`@${t}`] = (report.removed_by_tag[`@${t}`] ?? 0) + 1;
    report.changed.push({ path: rel, removed: removed.length, sha256_before: sha256(raw), sha256_after: sha256(out) });
  }
  report.ok = report.html_files > 0 && report.errors.length === 0;
  return report;
}

// ---------------------------------------------------------------------------
// Check
// ---------------------------------------------------------------------------

function lineLocator(text) {
  const starts = [0];
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) starts.push(i + 1);
  return (at) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= at) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

// Scripts and JSON hold page text as string literals, so a comment can sit
// behind escapes ("<!--\n@r020", "<!-- @x"). For matching, whitespace
// escapes become spaces and escaped "<", ">" and "@" become the character,
// padded with spaces, so every offset stays where it was.
function unescapedView(text) {
  return text.replace(/\\(?:u00([0-9a-fA-F]{2})|x([0-9a-fA-F]{2})|[nrtfv])/g, (m, u, x) => {
    const code = u ?? x;
    if (code === undefined) return ' '.repeat(m.length);
    const ch = String.fromCharCode(parseInt(code, 16));
    if (/\s/.test(ch)) return ' '.repeat(m.length);
    if (ch === '>') return ch.padEnd(m.length);
    if (ch === '<' || ch === '@') return ch.padStart(m.length);
    return m;
  });
}

// Gate annotations still present in `text`. kind: 'markup' (HTML), 'svg',
// 'css', or 'other' (scripts, JSON, source maps, text). `server` marks code
// that renders pages on the server, where even experiment-slot markers held in
// strings end up in the page.
export function findAnnotations(text, { kind = 'markup', allowTags = [], server = false } = {}) {
  const allow = new Set(allowTags.map((t) => t.toLowerCase()));
  const lineAt = lineLocator(text);
  const hits = new Map();
  const add = (at, tag, why) => {
    if (hits.has(at)) return;
    const snippet = text.slice(at, at + 90).replace(/\s+/g, ' ').trim();
    hits.set(at, { line: lineAt(at), tag: `@${tag.toLowerCase()}`, kind: why, snippet });
  };
  const unknownLead = (at, body) => {
    const name = LEADING_PRAGMA.exec(body)?.[1].toLowerCase();
    if (name && !GATE_TAGS.includes(name) && !allow.has(name)) add(at, name, 'unknown-pragma');
  };
  const view = text.includes('\\') ? unescapedView(text) : text;
  for (const m of view.matchAll(DISTINCT_TAGS)) add(m.index, m[1], 'gate-tag');
  const comments = kind === 'markup' || kind === 'svg'
    ? markupComments(text, { xml: kind === 'svg' })
    : kind === 'css' ? cssComments(text, 0, text.length) : [];
  for (const c of comments) {
    const body = text.slice(c.start, c.end);
    for (const m of body.matchAll(COMMENT_ONLY)) add(c.start + m.index, m[1], 'gate-tag-in-comment');
    if (c.html) unknownLead(c.start, commentInner(body));
  }
  // An HTML comment held in a string (inline or bundled script, server code,
  // JSON) still renders once inserted, so an unknown @name fails there too.
  // Each opener is read on its own, so an earlier "<!--" string hides nothing.
  const closer = /--!?>/g;
  for (const m of view.matchAll(/<!--/g)) {
    const from = m.index + 4;
    OPENER_PRAGMA.lastIndex = from;
    const name = OPENER_PRAGMA.exec(view)?.[1].toLowerCase();
    if (name && !GATE_TAGS.includes(name) && !allow.has(name)) add(m.index, name, 'unknown-pragma');
    closer.lastIndex = from;
    const close = closer.exec(view);
    if (!close) continue;
    for (const t of view.slice(from, close.index).matchAll(COMMENT_ONLY)) {
      // Server code renders pages, so no exemption there: a marker meant for a
      // browser script must be built at runtime ('@bwm-exp-slot: ' + name).
      if (server || !RUNTIME_MARKERS.has(t[1].toLowerCase())) add(from + t.index, t[1], 'gate-tag-in-comment');
    }
  }
  // Server code also carries page CSS as strings (inline styles fed by set:html).
  if (server) {
    for (const m of view.matchAll(/\/\*[\s\S]*?\*\//g)) {
      for (const t of m[0].matchAll(COMMENT_ONLY)) add(m.index + t.index, t[1], 'gate-tag-in-comment');
    }
  }
  return [...hits.values()].sort((x, y) => x.line - y.line);
}

const kindOf = (ext) => (ext === '.svg' ? 'svg' : PAGE_EXT.has(ext) ? 'markup' : ext === '.css' ? 'css' : 'other');

// Check every file under `dir` that decodes as text. Fails when anything
// remains, when a text-type file cannot be decoded, on a symlink, and when no
// page was found (a wrong folder must not pass).
export async function checkDir(dir, { allowTags = [] } = {}) {
  const root = resolve(dir);
  const result = { target: root, ok: false, html_files: 0, files_scanned: 0, findings: [] };
  const problem = (file, kind, snippet) => result.findings.push({ file, line: 0, tag: '-', kind, snippet });
  for await (const { path, symlink } of walkEntries(root)) {
    const rel = relPath(root, path);
    if (symlink) {
      problem(rel, 'symlink', 'symlink in the bundle; not followed, so not checked');
      continue;
    }
    const ext = extname(path).toLowerCase();
    const textType = TEXT_EXT.has(ext) || TEXT_NAMES.has(basename(path));
    if (!textType && await looksBinary(path)) continue;
    const raw = await readFile(path);
    let text = decodeForCheck(raw);
    if (text === null) {
      if (textType) {
        problem(rel, 'unreadable-encoding', 'not UTF-8 or UTF-16 text; cannot be checked');
        continue;
      }
      text = raw.toString('latin1'); // other 8-bit text: gate tags are ASCII, so they still match
    }
    if (PAGE_EXT.has(ext)) result.html_files++;
    result.files_scanned++;
    const server = rel === '_worker.js' || rel.startsWith('_worker.js/');
    for (const f of findAnnotations(text, { kind: kindOf(ext), allowTags, server })) result.findings.push({ file: rel, ...f });
  }
  result.ok = result.html_files > 0 && result.findings.length === 0;
  return result;
}

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'bwm-gate-annotations/1 (published-page check)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    return { status: res.status, url: res.url, type: res.headers.get('content-type') ?? '', text: await res.text() };
  } catch {
    return null;
  }
}

async function sitemapPages(origin) {
  const locsIn = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  for (const path of ['/sitemap.xml', '/sitemap-index.xml']) {
    const res = await fetchText(origin + path);
    if (!res || res.status !== 200) continue;
    let locs = locsIn(res.text);
    if (locs.length && locs.every((l) => /\.xml(\?|$)/.test(l))) {
      const nested = [];
      for (const child of locs.slice(0, 5)) {
        const r = await fetchText(child);
        if (r?.status === 200) nested.push(...locsIn(r.text));
      }
      locs = nested;
    }
    if (locs.length) return locs;
  }
  return [];
}

// Spot-check a live site: the start page, then sitemap pages (same origin),
// then the same-origin stylesheets, scripts and SVGs those pages load.
export async function checkUrl(start, { pages = 25, allowTags = [] } = {}) {
  const origin = new URL(start).origin;
  const queue = [new URL(start).href];
  for (const loc of await sitemapPages(origin)) {
    try {
      const u = new URL(loc);
      if (u.origin === origin && !queue.includes(u.href)) queue.push(u.href);
    } catch { /* not a URL */ }
  }
  const result = { target: start, ok: false, html_files: 0, files_scanned: 0, findings: [] };
  const assets = new Set();
  for (const url of queue.slice(0, pages)) {
    const res = await fetchText(url);
    if (!res || res.status !== 200 || !/html/i.test(res.type)) continue;
    result.html_files++;
    result.files_scanned++;
    for (const f of findAnnotations(res.text, { kind: 'markup', allowTags })) result.findings.push({ file: url, ...f });
    for (const m of res.text.matchAll(/(?:href|src)\s*=\s*["']([^"'#]+?\.(?:css|js|mjs|svg))(?:\?[^"']*)?["']/gi)) {
      try {
        const u = new URL(m[1], res.url);
        if (u.origin === origin) assets.add(u.href);
      } catch { /* not a URL */ }
    }
  }
  for (const url of [...assets].slice(0, 60)) {
    const res = await fetchText(url);
    if (!res || res.status !== 200) continue;
    result.files_scanned++;
    const ext = extname(new URL(url).pathname).toLowerCase();
    for (const f of findAnnotations(res.text, { kind: kindOf(ext), allowTags })) result.findings.push({ file: url, ...f });
  }
  result.ok = result.html_files > 0 && result.findings.length === 0;
  return result;
}

export function formatCheck(result, max = 20) {
  const lines = [];
  if (result.ok) {
    lines.push(`OK   [gate-annotations] ${result.target}: ${result.html_files} pages, ${result.files_scanned} files, 0 gate annotations`);
  } else if (result.html_files === 0 && result.findings.length === 0) {
    lines.push(`FAIL [gate-annotations] ${result.target}: no pages found; nothing was checked`);
  } else {
    lines.push(`FAIL [gate-annotations] ${result.target}: ${result.findings.length} problem(s) in ${result.html_files} pages, ${result.files_scanned} files`);
    for (const f of result.findings.slice(0, max)) lines.push(`  ${f.file}:${f.line}  ${f.tag} (${f.kind})  ${f.snippet}`);
    if (result.findings.length > max) lines.push(`  ... and ${result.findings.length - max} more`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Astro integration
// ---------------------------------------------------------------------------

// Strips gate comments from .astro source before Astro compiles it, then
// strips and checks the finished build. A leftover fails `astro build`.
export function bwmGateAnnotations({ allowTags = [], env = process.env } = {}) {
  const keep = env.BWM_KEEP_GATE_ANNOTATIONS === '1';
  if (keep && env.CF_PAGES === '1') {
    throw new Error('bwm-gate-annotations: BWM_KEEP_GATE_ANNOTATIONS=1 is set in a Cloudflare Pages build; an annotated build must never publish');
  }
  if (keep) {
    return {
      name: 'bwm-gate-annotations',
      hooks: {
        'astro:build:done': ({ logger }) => {
          logger.warn('BWM_KEEP_GATE_ANNOTATIONS=1: gate comments kept for local gate runs. NOT FOR PUBLISHING — rebuild without it before any deploy.');
        },
      },
    };
  }
  let parse;
  const sourcePlugin = {
    name: 'bwm-gate-annotations:astro-source',
    enforce: 'pre',
    apply: 'build',
    async load(id) {
      const [file, query] = id.split('?');
      const raw = query === 'raw' && /\.(?:html?|svg)$/i.test(file);
      if (!raw && (query !== undefined || !file.endsWith('.astro'))) return null;
      let source;
      try {
        source = await readFile(file, 'utf8');
      } catch {
        return null;
      }
      if (!gateTagIn(source) && !/<!--\s*@/.test(source)) return null;
      if (raw) {
        // A raw HTML/SVG import is page text that may reach server code: strip it here.
        const { text, removed } = stripMarkup(source, { xml: /\.svg$/i.test(file) });
        return removed.length ? `export default ${JSON.stringify(text)}` : null;
      }
      parse ??= (await import('@astrojs/compiler')).parse;
      const { text, removed, unknown } = await stripAstroSource(source, parse, { allowTags });
      if (unknown.length) {
        throw new Error(`bwm-gate-annotations: ${id} has template comments with unknown tags (${[...new Set(unknown)].join(', ')}). Add them to GATE_TAGS if a gate reads them, or pass them in allowTags.`);
      }
      return removed.length ? text : null;
    },
  };
  return {
    name: 'bwm-gate-annotations',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({ vite: { plugins: [sourcePlugin] } });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const report = await stripDir(root);
        if (report.errors.length) throw new Error(`bwm-gate-annotations: ${report.errors.join('; ')}`);
        const result = await checkDir(root, { allowTags });
        if (!result.ok) throw new Error(formatCheck(result));
        logger.info(`removed ${report.removed_total} gate comments from ${report.files_changed} built files; ${formatCheck(result)}`);
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------

const same = (a, b) => a === b || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`;
const kept = (src, count = 1) => {
  if (stripMarkup(src).text !== src) return 'strip edited it';
  return same(findAnnotations(src).length, count);
};

// One real-shaped sample per gate pragma, written out by hand so that dropping
// or renaming a GATE_TAGS entry fails the self-test.
const PRAGMA_SAMPLES = [
  '<!-- @r020:F1 emotion: hero -->', '<!-- @r020-exempt: legal page -->',
  '<!-- @sdt-exempt: data table -->', '<!-- @sdt-interactive-proof: slider shows the delta -->',
  '<!-- @cta-proof: named result above -->', '<!-- @creative-exempt: client copy -->',
  '<!-- @internal-architecture -->', '<!-- @build-author-exempt: QA patch -->',
  '<!-- @codex-authored -->', '<!-- @sol-authored -->', '<!-- @audience: client -->',
  '<!-- @proof: event 01ABC -->', '<!-- @status: planned -->', '<!-- @claim-ledger-exempt -->',
  '<!-- @workflow-lint-exempt -->', '<!-- @bwm-exp-slot: hero-cta -->',
  '<!-- @bwm-exp-slot-exempt: no H1 -->', '<style>/* @r017c-sanctioned: chart reveal */</style>',
];

export const SELFTEST_CASES = [
  ['every gate pragma the gates read is stripped', () => {
    const { text, removed } = stripMarkup(`${PRAGMA_SAMPLES.join('\n')}\n<p>x</p>`);
    if (removed.length !== PRAGMA_SAMPLES.length) return `removed ${removed.length} of ${PRAGMA_SAMPLES.length}`;
    return same(text, `${'\n'.repeat(PRAGMA_SAMPLES.length - 1)}<style>/**/</style>\n<p>x</p>`);
  }],
  ['own-line comment goes; the whitespace around it stays', () => same(
    stripMarkup('<div>\n  <!-- @r020:F1 emotion: hero -->\n  <img src="a.jpg" alt="">\n</div>\n').text,
    '<div>\n  \n  <img src="a.jpg" alt="">\n</div>\n')],
  ['whitespace in <pre> renders the same after the strip', () => same(
    stripMarkup('<pre>line 1\n<!-- @r020:F2 example -->\nline 2</pre>').text, '<pre>line 1\n\nline 2</pre>')],
  ['inline comment goes, neighbours stay', () => same(
    stripMarkup('<p>a<!-- @r020:identity: logo -->b</p>').text, '<p>ab</p>')],
  ['finding shapes: multi-line creative, build-author, r020 with SDT', () => same(
    stripMarkup('<main>\n<!-- @creative-exempt: BWM connective prose was authored at FK <=7 (Sol V4 receipts);\n     vendor-name protection still enforced -->\n<!-- @build-author-exempt: QA patch into Sol\'s V3 page -->\n<h1>Hi</h1>\n<!-- @r020:F1 emotion: stage energy | SDT: footage shows it -->\n<video src="v.mp4"></video>\n</main>\n').text,
    '<main>\n\n\n<h1>Hi</h1>\n\n<video src="v.mp4"></video>\n</main>\n')],
  ['ordinary and conditional comments stay', () => kept(
    '<!-- keep: hero section -->\n<!--[if lt IE 9]><script src="x.js"></script><![endif]-->\n<!-- mentions r020 without an at sign -->\n', 0)],
  ['attribute values are never edited, but a gate comment held in one is reported', () => kept(
    '<div title="<!-- @proof: literal -->" data-x=\'<!-- @r020:F1 x -->\'>Hello</div>', 2)],
  ['a ">" inside a quoted attribute does not end the tag early', () => same(
    stripMarkup('<a title="1 > 0 <!-- @proof: x -->" href="/">go</a>\n<!-- @r020:F3 cta -->\n<b>x</b>').text,
    '<a title="1 > 0 <!-- @proof: x -->" href="/">go</a>\n\n<b>x</b>')],
  ['an "=" inside an unquoted value does not reopen a quote', () => {
    const src = '<div x=a=" ><!-- @proof: internal --><p>ok</p>';
    const found = findAnnotations(src).length;
    return found === 1 ? same(stripMarkup(src).text, '<div x=a=" ><p>ok</p>') : `expected 1 finding, got ${found}`;
  }],
  ['inside <svg>, <title/> closes itself and comments after it are seen', () => {
    const src = '<p>a</p><svg><title/><!-- @proof: internal --></svg><script>var s = "<!-- @proof: js -->";</script>';
    const found = findAnnotations(src).length; // the SVG comment, and the one held in the script string
    if (found !== 2) return `expected 2 findings, got ${found}`;
    return same(stripMarkup(src).text, '<p>a</p><svg><title/></svg><script>var s = "<!-- @proof: js -->";</script>');
  }],
  ['SVG file: CSS comment inside CDATA style goes, CDATA markup stays', () => same(
    stripMarkup('<svg><style><![CDATA[ /* @r020:F1 x */ .a{} <!-- @r020:F2 in cdata --> ]]></style><!-- @r020:identity: m --></svg>', { xml: true }).text,
    '<svg><style><![CDATA[ /**/ .a{} <!-- @r020:F2 in cdata --> ]]></style></svg>')],
  ['CDATA and doctype are skipped', () => same(
    stripMarkup('<!DOCTYPE html><svg><![CDATA[ <!-- @r020:F1 cdata --> ]]><!-- @r020:identity: mark --></svg>').text,
    '<!DOCTYPE html><svg><![CDATA[ <!-- @r020:F1 cdata --> ]]></svg>')],
  ['script content is never edited, but a distinctive tag in it still fails', () => kept(
    "<script>const s = '<!-- @r020:F1 x -->';</script>")],
  ['experiment-slot markers made by page scripts are allowed', () => kept(
    "<script>h.before(document.createComment('@bwm-exp-slot: ' + 'hero-headline'));\nconst m = ['<!-- @bwm-exp-slot: proof-module -->'];</script>", 0)],
  ['experiment-slot note in markup fails check, then goes; its attribute stays', () => {
    const src = '<!-- @bwm-exp-slot: hero-headline -->\n<h1 data-bwm-exp-slot="hero-headline">Hi</h1>';
    const found = findAnnotations(src).length;
    return found === 1 ? same(stripMarkup(src).text, '\n<h1 data-bwm-exp-slot="hero-headline">Hi</h1>') : `expected 1 finding, got ${found}`;
  }],
  ['CSS gate comment in <style> goes; @media and strings stay', () => same(
    stripMarkup('<style>\n  /* @creative-exempt: motion sandbox */\n  @media (min-width: 40em) { .a { content: "/* @creative-exempt: in a string */"; } }\n</style>').text,
    '<style>\n  @media (min-width: 40em) { .a { content: "/* @creative-exempt: in a string */"; } }\n</style>')],
  ['stylesheet: gate comment goes, plain comment stays', () => same(
    stripCss('/* @sdt-exempt: legacy block */\n.a{color:red}\n/* keep this note */\n').text,
    '.a{color:red}\n/* keep this note */\n')],
  ['same-line CSS sanction comment goes, the declaration stays', () => same(
    stripCss('.hero { animation-timeline: view(); /* @r017c-sanctioned: chart reveal */ }\n').text,
    '.hero { animation-timeline: view(); /**/ }\n')],
  ['an inline CSS comment still separates the tokens around it', () => {
    const src = '.a{font-family:A/* @r020:F1 x */B}';
    const out = stripCss(src).text;
    if (out !== '.a{font-family:A/**/B}') return `got ${JSON.stringify(out)}`;
    return outsideComments('.a{font-family:AB}') !== outsideComments(src) || 'the invariant cannot see merged tokens';
  }],
  ['url(...) is not a comment, even with /* inside', () => {
    const src = '.a{background:url(/assets/*@r020*/hero.png)}';
    if (stripCss(src).text !== src) return 'strip edited the URL';
    return same(findAnnotations(src, { kind: 'css' }).length, 1);
  }],
  ['every tag counts when a comment delimiter touches it, on either side', () => {
    for (const tag of GATE_TAGS) {
      const shapes = [`<!--@${tag}-->`, `<!-- @${tag}-->`, `<!--@${tag} -->`, `<!--@${tag}: x--!>`, `<!---@${tag}--->`];
      for (const shape of shapes) {
        const out = stripMarkup(`${shape}<p>x</p>`).text;
        if (out !== '<p>x</p>') return `${shape} was not stripped`;
      }
      if (stripCss(`.a{}/*@${tag}*/`).text !== '.a{}/**/') return `/*@${tag}*/ was not stripped`;
    }
    const unknown = ['<!--@new-gate--><p>x</p>', '<!---@new-gate---><p>x</p>'].map((src) => findAnnotations(src).map((f) => `${f.tag} ${f.kind}`).join());
    return same(unknown.join(' | '), '@new-gate unknown-pragma | @new-gate unknown-pragma');
  }],
  ['"@proof-of-work" next to a closer is still not a gate tag', () => kept('<!--@proof-of-work--><p>x</p>', 1)],
  ['a "</script>" inside an escaped script block does not end the script', () => {
    const script = "<script>\n<!--\nconst open = '<script>';\nconst close = '</script>';\n// -->\nconst receipt = '<!-- @proof: shown in editor -->';\n</script>";
    const out = stripMarkup(`${script}<!-- @r020:F1 after --><p>ok</p>`).text;
    if (out !== `${script}<p>ok</p>`) return `got ${JSON.stringify(out)}`;
    return same(stripMarkup('<script><!--></script><!-- @r020:F1 x --><p>y</p>').text, '<script><!--></script><p>y</p>');
  }],
  ['short closers end an escaped script block too', () => {
    for (const close of ['<!-->', '<!--->']) {
      const script = `<script><!--<script>${close}</script>`;
      const out = stripMarkup(`${script}<!-- @proof: internal --><p>x</p>`).text;
      if (out !== `${script}<p>x</p>`) return `${close}: got ${JSON.stringify(out)}`;
    }
    return true;
  }],
  ['an HTML tag inside <svg> ends SVG mode, so a later <script> is protected', () => {
    const src = '<svg><circle/><p>text<script>const s="<!-- @proof: literal -->";</script><!-- @r020:F1 after --><b>y</b>';
    return same(stripMarkup(src).text, '<svg><circle/><p>text<script>const s="<!-- @proof: literal -->";</script><b>y</b>');
  }],
  ['"<![CDATA[" in HTML is a bogus comment that ends at ">"', () => {
    const src = '<![CDATA[><!-- @proof: internal --><p>x</p>';
    const found = findAnnotations(src).length;
    return found === 1 ? same(stripMarkup(src).text, '<![CDATA[><p>x</p>') : `expected 1 finding, got ${found}`;
  }],
  ['a tag right after the comment opener counts', () => {
    const src = '<!--@creative-exempt: Sol review--><p>Hi</p><style>.a{}/*@sdt-exempt: tight*/</style>';
    const found = findAnnotations(src).length;
    return found === 2 ? same(stripMarkup(src).text, '<p>Hi</p><style>.a{}/**/</style>') : `expected 2 findings, got ${found}`;
  }],
  ['an escaped quote in a CSS name does not open a string', () => {
    const src = '.before\\:content-\\[\\\'\\\'\\]::before{content:""} /* @proof: internal receipt */';
    const found = findAnnotations(src, { kind: 'css' }).length;
    return found === 1 ? same(stripCss(src).text, '.before\\:content-\\[\\\'\\\'\\]::before{content:""} /**/') : `expected 1 finding, got ${found}`;
  }],
  ['a CSS string continued by "\\" + CRLF stays one string', () => {
    const src = '.a{content:"first\\\r\n/* @proof: literal */ last"}';
    return same(stripCss(src).text, src);
  }],
  ['an escaped ")" does not end url(...)', () => {
    const src = '.a{background:url(/assets/\\)/*@proof*/hero.png)}';
    return same(stripCss(src).text, src);
  }],
  ['a closing raw-text tag with attributes is read whole', () => {
    const src = '<script></script data-x="<textarea>"><!-- @proof: internal --><p>ok</p>';
    const found = findAnnotations(src).length;
    return found === 1 ? same(stripMarkup(src).text, '<script></script data-x="<textarea>"><p>ok</p>') : `expected 1 finding, got ${found}`;
  }],
  ['unknown @name comments inside an inline <script> fail', () => {
    const src = "<script>document.body.insertAdjacentHTML('beforeend', '<!-- @r021:F2 internal -->');</script>";
    return same(findAnnotations(src).map((f) => `${f.tag} ${f.kind}`).join(), '@r021 unknown-pragma');
  }],
  ['a removal never joins text into a character reference, even across adjacent comments', () => same(
    stripMarkup('<p>&cop<!-- @proof: internal -->y;</p><p>a<!-- @proof: x -->b</p><p>&cop<!-- @proof: 1 --><!-- @proof: 2 -->y;</p>').text,
    '<p>&cop<!---->y;</p><p>ab</p><p>&cop<!---->y;</p>')],
  ['a removal never exposes a newline right after <pre> (the parser would drop it)', () => same(
    stripMarkup('<pre><!-- @proof: out -->\ncode</pre><pre class="x"><!-- @proof: 1 --><!-- @r020:F1 2 -->\ncode</pre><pre><!-- @proof: x -->code</pre>').text,
    '<pre><!---->\ncode</pre><pre class="x"><!---->\ncode</pre><pre>code</pre>')],
  ['a removal never merges a CR and an LF into one line break', () => same(
    stripMarkup('<pre>one\r<!-- @proof: receipt -->\ntwo</pre>').text, '<pre>one\r<!---->\ntwo</pre>')],
  ['the <pre> newline guard holds for any start tag, even with "<" in an attribute', () => {
    const long = `<pre data-example="<div>" title="${'x'.repeat(600)}">`;
    return same(stripMarkup(`${long}<!-- @proof: example -->\ncode</pre>`).text, `${long}<!---->\ncode</pre>`);
  }],
  ['a removal never joins a literal "<" into a tag or comment opener', () => same(
    stripMarkup('<p><<!-- @proof: note -->b>x</p><p><<!-- @proof: y -->/p> z</p><p><<!-- @proof: v -->!-- w</p><p>1 <<!-- @proof: u --> 2</p>').text,
    '<p><<!---->b>x</p><p><<!---->/p> z</p><p><<!---->!-- w</p><p>1 < 2</p>')],
  ['text after "<!" is a bogus comment: the strip leaves it, the check reports it', () => kept('<p><!<!-- @proof: y -->-- z</p>')],
  ['experiment-slot markers are allowed in browser code but not in server code', () => {
    const js = "const hero = '<!-- @bwm-exp-slot: hero-headline -->';";
    const browser = findAnnotations(js, { kind: 'other' }).length;
    const server = findAnnotations(js, { kind: 'other', server: true }).map((f) => `${f.tag} ${f.kind}`).join();
    return browser === 0 ? same(server, '@bwm-exp-slot gate-tag-in-comment') : `browser code: expected 0, got ${browser}`;
  }],
  ['server code: slot markers fail even inside an emitted <script>; CSS comment strings are checked', () => {
    const inScript = 'const t = `<script is:inline>document.body.insertAdjacentHTML("beforeend", "<!-- @bwm-exp-slot: hero-headline -->");</script>`;';
    const css = "const css = '/* @proof: Sol internal receipt */ .hero{color:red}';";
    const got = [
      findAnnotations(inScript, { kind: 'other', server: true }).length,
      findAnnotations(css, { kind: 'other' }).length,
      findAnnotations(css, { kind: 'other', server: true }).map((f) => `${f.tag} ${f.kind}`).join(),
    ].join(' | ');
    return same(got, '1 | 0 | @proof gate-tag-in-comment');
  }],
  ['"&" then "#65;" across a removed comment stays literal text', () => same(
    stripMarkup('<p>&<!-- @proof: note -->#65;</p>').text, '<p>&<!---->#65;</p>')],
  ['an unknown @name far after the opener is still found', () => same(
    findAnnotations(`const t = "<!--${' '.repeat(250)}@new-gate: internal receipt -->";`, { kind: 'other' }).map((f) => `${f.tag} ${f.kind}`).join(),
    '@new-gate unknown-pragma')],
  ['a long numeric character reference is still protected', () => {
    const zeros = '0'.repeat(40);
    return same(stripMarkup(`<p>&#${zeros}<!-- @proof: note -->65;</p>`).text, `<p>&#${zeros}<!---->65;</p>`);
  }],
  ['an ordinary-word tag in a comment held in server code fails', () => same(
    findAnnotations('const t = "<!-- @proof: Sol internal receipt -->";', { kind: 'other' }).map((f) => `${f.tag} ${f.kind}`).join(),
    '@proof gate-tag-in-comment')],
  ['every "<!--" opener is checked on its own', () => {
    const src = '<script>const opener="<!--"; const html="<!-- @new-gate: internal Sol review -->";</script>';
    return same(findAnnotations(src).map((f) => `${f.tag} ${f.kind}`).join(), '@new-gate unknown-pragma');
  }],
  ['a non-breaking space does not end a tag name (HTML whitespace is ASCII only)', () => {
    const nbsp = String.fromCharCode(0xa0);
    const src = `<script>const s="</script${nbsp}>"; const x="<!-- @proof: literal -->";</script><p>x</p>`;
    return same(stripMarkup(src).text, src);
  }],
  ['a comment behind string escapes in server code is still found', () => {
    const js = 'const a = "<!--\\n@r020: internal Sol review\\n-->";\nconst b = "\\u003c!--\\n@new-gate\\n--\\u003e";';
    return same(findAnnotations(js, { kind: 'other' }).map((f) => `${f.tag} ${f.kind}`).join(), '@r020 gate-tag,@new-gate unknown-pragma');
  }],
  ['a letter before "url(" makes it a different function name', () => {
    const src = '.a{--x: éurl(/* @proof: internal */);}';
    return same(stripCss(src).text, '.a{--x: éurl(/**/);}');
  }],
  ['unknown @name comments in scripts and server code fail', () => {
    const js = 'const t = `<!-- @r021:F1 internal --><p>x</p>`; const k = "<!-- @bwm-exp-slot: hero-cta -->";';
    const kinds = findAnnotations(js, { kind: 'other' }).map((f) => `${f.tag} ${f.kind}`).join();
    return same(kinds, '@r021 unknown-pragma');
  }],
  ['emails, handles and JSON-LD are not gate tags', () => kept(
    '<!-- ops contact: team@status.io -->\n<p>Follow @proof on social</p>\n<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization"}</script>', 0)],
  ['claim-ledger words are gate tags inside comments', () => {
    const src = '<!-- @audience: client -->\n<!-- @status: planned -->\n<p>x</p>\n';
    const found = findAnnotations(src).length;
    return found === 2 ? same(stripMarkup(src).text, '\n\n<p>x</p>\n') : `expected 2 findings, got ${found}`;
  }],
  ['unknown @name comment fails check, is kept by strip, can be allowed', () => {
    const src = '<!-- @r021:F1 new gate tag -->\n<p>x</p>';
    if (stripMarkup(src).text !== src) return 'strip removed an unknown tag';
    const kinds = findAnnotations(src).map((f) => f.kind).join();
    if (kinds !== 'unknown-pragma') return `expected unknown-pragma, got ${kinds}`;
    return same(findAnnotations(src, { allowTags: ['r021'] }).length, 0);
  }],
  ['unterminated comment is kept and still reported, even with an unknown tag', () => {
    const known = kept('<p>ok</p>\n<!-- @r020:F1 never closed');
    return known === true ? kept('<p>ok</p>\n<!-- @new-gate: internal process') : known;
  }],
  ['--!> closes a comment', () => same(
    stripMarkup('<p>x</p><!-- @r020:F2 proof --!><p>y</p>').text, '<p>x</p><p>y</p>')],
  ['empty comments do not derail the scan', () => same(
    stripMarkup('<!--><!---><!-- @r020:F4 curiosity -->').text, '<!--><!--->')],
  ['tag inside an attribute is reported, not edited', () => kept('<img alt="@r020:F1 hero" src="a.jpg">')],
  ['strip is idempotent', () => {
    const once = stripMarkup('<a>\n<!-- @r020:F1 x -->\n<!-- keep -->\n</a>').text;
    return same(stripMarkup(once).text, once);
  }],
  ['@r020-exempt header pragma goes', () => same(
    stripMarkup('<!-- @r020-exempt: legal page -->\n<h1>Terms</h1>').text, '\n<h1>Terms</h1>')],
  ['SVG comment goes, <title> stays', () => same(
    stripMarkup('<svg xmlns="http://www.w3.org/2000/svg"><!-- @r020:identity: favicon --><title>Logo</title><path d="M0 0h1"/></svg>').text,
    '<svg xmlns="http://www.w3.org/2000/svg"><title>Logo</title><path d="M0 0h1"/></svg>')],
  ['tags match in any case', () => same(stripMarkup('<!-- @R020:F1 upper -->x').text, 'x')],
  ['CRLF line endings are kept', () => same(
    stripMarkup('a\r\n  <!-- @r020:F1 x -->\r\nb\r\n').text, 'a\r\n  \r\nb\r\n')],
  ['<textarea> content is raw text and stays', () => {
    const src = '<textarea><!-- @r020:F1 typed text --></textarea>';
    return same(stripMarkup(src).text, src);
  }],
  ['every strip leaves the text outside comments unchanged', () => {
    const src = '<main>\n  <!-- @r020:F1 a -->\n  <p>one</p><!-- @sdt-exempt: b --> <b>two</b>\n<style>/* @creative-exempt: c */.x{}\n  /* @creative-exempt: d */\n.y{}</style>\n</main>';
    return same(outsideComments(stripMarkup(src).text), outsideComments(src));
  }],
];

export function runSelftest(log = console.log) {
  let failed = 0;
  for (const [name, run] of SELFTEST_CASES) {
    let outcome;
    try {
      outcome = run();
    } catch (e) {
      outcome = `threw ${e.message}`;
    }
    if (outcome === true) log(`  PASS  ${name}`);
    else {
      failed++;
      log(`  FAIL  ${name}: ${outcome}`);
    }
  }
  log(`Selftest: ${SELFTEST_CASES.length - failed}/${SELFTEST_CASES.length} passed${failed ? ' — FAILED' : ''}`);
  return failed;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const USAGE = `usage:
  bwm-gate-annotations.mjs strip <bundle-dir> [--receipt <file outside the bundle>]
  bwm-gate-annotations.mjs check <bundle-dir | https://site> [--pages N] [--allow-tag NAME]
  bwm-gate-annotations.mjs selftest
  bwm-gate-annotations.mjs version`;

function parseArgs(args) {
  const out = { targets: [], allowTags: [], pages: 25, receipt: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const value = () => {
      const v = args[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === '--receipt') out.receipt = value();
    else if (a === '--allow-tag') out.allowTags.push(value());
    else if (a === '--pages') {
      out.pages = Number(value());
      if (!Number.isInteger(out.pages) || out.pages < 1) throw new Error('--pages must be a positive whole number');
    } else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else out.targets.push(a);
  }
  return out;
}

export async function main(argv) {
  const [command, ...rest] = argv;
  let args;
  try {
    args = parseArgs(rest);
  } catch (e) {
    console.error(`bwm-gate-annotations: ${e.message}\n${USAGE}`);
    return 2;
  }
  try {
    if (command === 'version') {
      console.log(`bwm-gate-annotations ${VERSION} sha256:${await toolSha256()}`);
      return 0;
    }
    if (command === 'selftest') return runSelftest() ? 1 : 0;
    if (command === 'strip' && args.targets.length === 1) {
      const root = resolve(args.targets[0]);
      if (args.receipt) {
        const receipt = resolve(args.receipt);
        if (receipt === root || receipt.startsWith(root + sep)) {
          console.error('bwm-gate-annotations: the receipt must be written outside the bundle, or it would be published');
          return 2;
        }
      }
      const report = await stripDir(root);
      if (args.receipt) await writeFile(resolve(args.receipt), `${JSON.stringify(report, null, 2)}\n`);
      const tags = Object.entries(report.removed_by_tag).map(([t, n]) => `${t}=${n}`).join(' ') || 'none';
      console.log(`bwm-gate-annotations strip: removed ${report.removed_total} gate comments from ${report.files_changed} files; ${report.html_files} pages scanned (${tags})`);
      for (const e of report.errors) console.error(`  ERROR ${e}`);
      if (report.html_files === 0) console.error(`bwm-gate-annotations: no pages found in ${root}; nothing was stripped`);
      return report.ok ? 0 : 1;
    }
    if (command === 'check' && args.targets.length >= 1) {
      let code = 0;
      for (const target of args.targets) {
        const result = /^https?:\/\//i.test(target)
          ? await checkUrl(target, { pages: args.pages, allowTags: args.allowTags })
          : await checkDir(target, { allowTags: args.allowTags });
        console.log(formatCheck(result));
        if (!result.ok) code = 1;
      }
      return code;
    }
  } catch (e) {
    console.error(`bwm-gate-annotations: ${e.message}`);
    return 2;
  }
  console.error(USAGE);
  return 2;
}

const invokedDirectly = (() => {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1] ?? '')).href;
  } catch {
    return false;
  }
})();

if (invokedDirectly) process.exitCode = await main(process.argv.slice(2));
