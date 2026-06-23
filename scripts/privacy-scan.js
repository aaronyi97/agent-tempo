#!/usr/bin/env node
import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const skipDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.tmp',
  'tmp'
]);

const skipFiles = new Set([
  '.DS_Store',
  'privacy-blocklist.local.json'
]);

const exactFragments = [
  ['.', 'claude', '/', 'hooks'].join(''),
  ['.', 'codex'].join(''),
  ['auth', '.', 'json'].join(''),
  ['config', '.', 'toml'].join('')
];

const regexRules = [
  {
    label: 'GitHub token prefix',
    regex: new RegExp(`\\b(?:${['ghp', 'gho'].join('|')})_[A-Za-z0-9_]{20,}\\b`, 'g')
  },
  {
    label: 'GitHub fine-grained token prefix',
    regex: new RegExp(`\\b${['github', 'pat'].join('_')}_[A-Za-z0-9_]{20,}\\b`, 'g')
  },
  {
    label: 'OpenAI-style API key prefix',
    regex: new RegExp(`\\b${['sk', ''].join('-')}[A-Za-z0-9_-]{20,}\\b`, 'g')
  },
  {
    label: 'private key block',
    regex: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g
  },
  {
    label: 'local home path',
    regex: /\/(?:Users|home)\/[^/\s"'`]+(?:\/[^\s"'`]*)?/g
  }
];

const problems = [];
let scannedFiles = 0;
let skippedFiles = 0;
let localExactFragments = [];

function isTextCandidate(filePath) {
  const base = path.basename(filePath);
  if (skipFiles.has(base)) return false;
  return true;
}

function lineAndColumn(content, index) {
  const before = content.slice(0, index);
  const lines = before.split(/\r?\n/);
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function snippetFor(content, index, length) {
  const start = Math.max(0, index - 24);
  const end = Math.min(content.length, index + length + 24);
  return content
    .slice(start, end)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function recordProblem(filePath, label, content, index, length) {
  const location = lineAndColumn(content, index);
  problems.push({
    file: path.relative(root, filePath) || '.',
    label,
    line: location.line,
    column: location.column,
    snippet: snippetFor(content, index, length)
  });
}

function scanContent(filePath, content) {
  for (const fragment of exactFragments) {
    let index = content.indexOf(fragment);
    while (index !== -1) {
      recordProblem(filePath, `blocked fragment: ${fragment}`, content, index, fragment.length);
      index = content.indexOf(fragment, index + fragment.length);
    }
  }

  for (const fragment of localExactFragments) {
    let index = content.indexOf(fragment);
    while (index !== -1) {
      recordProblem(filePath, 'local blocklist fragment', content, index, fragment.length);
      index = content.indexOf(fragment, index + fragment.length);
    }
  }

  for (const rule of regexRules) {
    rule.regex.lastIndex = 0;
    for (const match of content.matchAll(rule.regex)) {
      recordProblem(filePath, rule.label, content, match.index ?? 0, match[0].length);
    }
  }
}

async function loadLocalBlocklist() {
  const blocklistPath = path.join(root, 'privacy-blocklist.local.json');
  let raw;
  try {
    raw = await readFile(blocklistPath, 'utf8');
  } catch (error) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(`Privacy scan failed to parse ${path.relative(root, blocklistPath)}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  const exact = Array.isArray(parsed.exactFragments) ? parsed.exactFragments : [];
  localExactFragments = exact.filter((value) => typeof value === 'string' && value.length > 0);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      await walk(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!isTextCandidate(fullPath)) {
      skippedFiles += 1;
      continue;
    }

    const stat = await lstat(fullPath);
    if (stat.size > 1024 * 1024) {
      skippedFiles += 1;
      continue;
    }

    let content;
    try {
      content = await readFile(fullPath, 'utf8');
    } catch (error) {
      skippedFiles += 1;
      continue;
    }

    if (content.includes('\u0000')) {
      skippedFiles += 1;
      continue;
    }

    scannedFiles += 1;
    scanContent(fullPath, content);
  }
}

try {
  await loadLocalBlocklist();
  await walk(root);
} catch (error) {
  console.error(`Privacy scan failed to read ${root}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

if (problems.length > 0) {
  console.error(`Privacy scan failed: ${problems.length} issue(s) found in ${scannedFiles} scanned file(s).`);
  for (const problem of problems) {
    console.error(`- ${problem.file}:${problem.line}:${problem.column} ${problem.label}`);
    console.error(`  ${problem.snippet}`);
  }
  process.exit(1);
}

console.log(`Privacy scan passed: ${scannedFiles} text file(s) scanned, ${skippedFiles} non-text/large file(s) skipped.`);
