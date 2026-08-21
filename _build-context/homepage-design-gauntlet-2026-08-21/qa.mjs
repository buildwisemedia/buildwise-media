import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, 'comparison');
const exactCopy = [
  'Custom AI systems',
  'Build the systems your business needs next.',
  'Buildwise works with you to build and improve custom AI systems across the business. We start with one important problem, learn from real work, and keep building from there.',
  "See If We're a Fit",
  'Build an AI-native business.',
  'Pick one problem that matters',
  'We build and test it',
  'Keep improving across the business',
  'The way in',
  'The 90-day Pilot is where we begin.',
  'Built for the long run',
  'AI becomes part of how your business works.',
  'We keep building with you—improving what works and building new systems across your business.',
];

const failures = [];
for (const id of ['a', 'b', 'c']) {
  const candidatePath = path.join(root, 'candidates', `${id}.html`);
  if (!fs.existsSync(candidatePath)) {
    failures.push(`${id}: candidate file missing`);
    continue;
  }
  const html = fs.readFileSync(candidatePath, 'utf8');
  for (const copy of exactCopy) {
    if (!html.includes(copy)) failures.push(`${id}: locked copy missing: ${copy}`);
  }
  if (!html.includes('brand/mark.svg') && !html.includes('/brand/mark.svg')) failures.push(`${id}: locked mark is not referenced`);
  if (!/@media\s*\(/.test(html)) failures.push(`${id}: responsive media rule missing`);
  if (/https?:\/\//i.test(html)) failures.push(`${id}: external dependency found`);
  if (/\b(Kimi|Fable|Claude|GPT-?5|OpenAI|Anthropic|Moonshot)\b/i.test(html)) failures.push(`${id}: author identity leaked into blind candidate`);
  if (!/@r020:(F[234]|identity)/.test(html)) failures.push(`${id}: R020 function annotation missing`);
}

const shell = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const id of ['a', 'b', 'c']) {
  if (!shell.includes(`candidates/${id}.html`)) failures.push(`comparison: ${id} not wired`);
}

const expectedMark = fs.readFileSync(path.resolve(import.meta.dirname, 'brand/mark.svg'), 'utf8');
for (const markPath of [path.join(root, 'brand/mark.svg'), path.join(root, 'candidates/brand/mark.svg')]) {
  if (!fs.existsSync(markPath) || fs.readFileSync(markPath, 'utf8') !== expectedMark) failures.push(`comparison: locked mark mismatch at ${markPath}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok:false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok:true, candidates:3, locked_copy_checks:exactCopy.length * 3, blind:true }, null, 2));
