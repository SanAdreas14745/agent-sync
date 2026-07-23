const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../dist/index.js');

const source = 'https://github.com/company/agent-sync-registry';
const commit = '8dc55e3d1e0f6a2cc926dc9fed070751a63f4e44';
const lock = {
  source: `${source}.git`,
  requestedRef: 'main',
  resolvedCommit: commit.toUpperCase(),
};

const normalized = api.normalizeGitRegistryLock(lock);
assert.deepEqual(normalized.issues, []);
assert.deepEqual(normalized.lock, {
  source,
  requestedRef: 'main',
  resolvedCommit: commit,
});

assert.deepEqual(
  api.validateGitRegistryLock(normalized.lock, {
    type: 'git',
    url: source,
    ref: 'main',
  }),
  [],
);

const mismatched = api.validateGitRegistryLock(normalized.lock, {
  type: 'git',
  url: source,
  ref: 'release',
});
assert.deepEqual(mismatched.map((issue) => issue.code), ['registry_lock_ref_mismatch']);

const invalid = api.normalizeGitRegistryLock({
  source: 'https://github.com/company/agent-sync-registry',
  requestedRef: 'main..next',
  resolvedCommit: '8dc55e3',
  ignored: true,
});
assert.deepEqual(
  invalid.issues.map((issue) => issue.code),
  ['unknown_registry_lock_field', 'invalid_registry_lock_ref', 'invalid_registry_lock_commit'],
);

const testRoot = path.resolve(`./tests/.tmp/registry-lock-${process.pid}`);
fs.rmSync(testRoot, { recursive: true, force: true });
fs.mkdirSync(testRoot, { recursive: true });
const lockPath = path.join(testRoot, api.registryLockFileName);
fs.writeFileSync(lockPath, JSON.stringify(lock), 'utf8');
assert.deepEqual(api.readRegistryLock(lockPath).lock, normalized.lock);
api.writeRegistryLock(lockPath, normalized.lock);
assert.deepEqual(api.readRegistryLock(lockPath).lock, normalized.lock);

console.log('registry lock tests passed');
