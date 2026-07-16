const assert = require('node:assert/strict');
const api = require('../dist/index.js');

const legacyResult = api.readRegistry('./registry');
const providerResult = new api.FileRegistryProvider('./registry').readRegistry();

assert.deepEqual(providerResult, legacyResult);
assert.ok(providerResult.skills.length > 0);
assert.equal(providerResult.issues.length, 0);

const missingRootResult = new api.FileRegistryProvider(
  './tests/.tmp/missing-registry',
).readRegistry();
assert.equal(missingRootResult.skills.length, 0);
assert.equal(missingRootResult.issues.length, 1);
assert.equal(missingRootResult.issues[0].code, 'registry_root_not_found');

const fileRootResult = new api.FileRegistryProvider('./package.json').readRegistry();
assert.equal(fileRootResult.skills.length, 0);
assert.equal(fileRootResult.issues.length, 1);
assert.equal(fileRootResult.issues[0].code, 'registry_root_not_directory');

console.log('registry provider tests passed');
