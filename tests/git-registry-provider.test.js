const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../dist/index.js');

const testRoot = path.resolve(`./tests/.tmp/git-registry-provider-${process.pid}`);
const remoteRoot = path.join(testRoot, 'remote');
const cacheRoot = path.join(testRoot, 'cache');
fs.mkdirSync(path.join(remoteRoot, 'registry'), { recursive: true });
copyDirectory(path.resolve('./registry'), path.join(remoteRoot, 'registry'));

git(['init', remoteRoot]);
git(['-C', remoteRoot, 'config', 'user.email', 'tests@example.com']);
git(['-C', remoteRoot, 'config', 'user.name', 'AgentSync tests']);
git(['-C', remoteRoot, 'add', 'registry']);
git(['-C', remoteRoot, 'commit', '-m', 'Add registry']);
const commit = git(['-C', remoteRoot, 'rev-parse', 'HEAD']).trim();
assert.equal(api.resolveGitRegistryRef(remoteRoot, 'HEAD'), commit);

const baseline = api.readRegistry(path.join(remoteRoot, 'registry'));
assert.deepEqual(baseline.issues, []);

const cache = new api.GitRegistryCache(cacheRoot);
const provider = new api.GitRegistryProvider({
  url: remoteRoot,
  commit,
  cache,
});
const onlineResult = provider.readRegistry();
assert.deepEqual(onlineResult.issues, []);
assert.deepEqual(
  onlineResult.skills.map((skill) => skill.id),
  baseline.skills.map((skill) => skill.id),
);
assert.ok(cache.load(remoteRoot, commit));

fs.rmSync(remoteRoot, { recursive: true, force: true });
const cachedResult = provider.readRegistry();
assert.deepEqual(cachedResult.issues, []);
assert.deepEqual(
  cachedResult.skills.map((skill) => skill.id),
  baseline.skills.map((skill) => skill.id),
);

const offlineMissResult = new api.GitRegistryProvider({
  url: remoteRoot,
  commit: '0000000000000000000000000000000000000000',
  cache,
}).readRegistry();
assert.deepEqual(
  offlineMissResult.issues.map((issue) => issue.code),
  ['git_registry_fetch_failed'],
);

console.log('git registry provider tests passed');

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}
