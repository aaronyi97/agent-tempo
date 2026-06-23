import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const scannerPath = path.resolve('scripts/privacy-scan.js');

function runScanner(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'agent-tempo-scan-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(path.join(dir, name), content);
    }
    return spawnSync(process.execPath, [scannerPath, dir], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}

test('privacy scanner blocks generic local home paths', () => {
  const result = runScanner({
    'note.md': `The local prototype lives at ${['', 'Users', 'dev', 'project-name'].join('/')}.`
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /local home path/);
});

test('privacy scanner blocks common private key block headers', () => {
  for (const header of [
    keyHeader(''),
    keyHeader('OPENSSH'),
    keyHeader('RSA'),
    keyHeader('EC')
  ]) {
    const result = runScanner({
      'key.txt': `${header}\nredacted\n-----END PRIVATE KEY-----`
    });

    assert.equal(result.status, 1, header);
    assert.match(result.stderr, /private key block/);
  }
});

test('privacy scanner supports ignored local blocklist file', () => {
  const result = runScanner({
    'privacy-blocklist.local.json': JSON.stringify({
      exactFragments: ['private-product-codename']
    }),
    'README.md': 'Do not publish private-product-codename.'
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /local blocklist fragment/);
});

function keyHeader(kind) {
  return ['-----BEGIN', kind, 'PRIVATE KEY-----'].filter(Boolean).join(' ');
}
