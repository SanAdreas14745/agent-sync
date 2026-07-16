const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../dist/index.js');

const testRoot = path.resolve(`./tests/.tmp/release-registry-provider-${process.pid}`);
const remoteRoot = path.join(testRoot, 'remote');
const offlineRoot = path.join(testRoot, 'offline');
const cacheRoot = path.join(testRoot, 'cache');
const corruptedRoot = path.join(testRoot, 'corrupted');
const releaseId = '2026-07-16T120000Z';
const cacheKey = 'https://storage.yandexcloud.net/ai-skills-registry/registries/frontend/v1';

prepareReleaseLayout(remoteRoot, releaseId);

const baseline = api.readRegistry('./registry');
assert.deepEqual(baseline.issues, []);

const cache = new api.RegistryReleaseCache(cacheRoot);
const provider = new api.ReleaseRegistryProvider({
  root: remoteRoot,
  cache,
  cacheKey,
});
const onlineResult = provider.readRegistry();

assert.deepEqual(onlineResult.issues, []);
assert.deepEqual(
  onlineResult.skills.map((skill) => skill.id),
  baseline.skills.map((skill) => skill.id),
);
assert.ok(cache.load(cacheKey));
assert.match(new api.RegistryReleaseCache().root, /\.ai-skills[\\/]cache$/);

const offlineResult = new api.ReleaseRegistryProvider({
  root: offlineRoot,
  cache,
  cacheKey,
}).readRegistry();

assert.equal(
  offlineResult.issues.some((issue) => issue.severity === 'error'),
  false,
);
assert.ok(
  offlineResult.issues.some((issue) => issue.code === 'registry_cache_fallback'),
);
assert.deepEqual(
  offlineResult.skills.map((skill) => skill.id),
  baseline.skills.map((skill) => skill.id),
);

prepareReleaseLayout(corruptedRoot, releaseId);
fs.appendFileSync(
  path.join(
    corruptedRoot,
    'releases',
    releaseId,
    'materials',
    'rules',
    'company',
    'common.md',
  ),
  '\nUnexpected change.\n',
  'utf8',
);

const corruptedResult = new api.ReleaseRegistryProvider({
  root: corruptedRoot,
}).readRegistry();

assert.ok(
  corruptedResult.issues.some(
    (issue) => issue.code === 'registry_release_file_checksum_mismatch',
  ),
);

console.log('release registry provider tests passed');

function prepareReleaseLayout(root, id) {
  const materialRoot = path.join(root, 'releases', id, 'materials');
  copyDirectory(path.resolve('./registry'), materialRoot);

  const parsedRegistry = api.readRegistry(materialRoot);
  assert.deepEqual(parsedRegistry.issues, []);

  const manifest = {
    formatVersion: 1,
    release: id,
    createdAt: '2026-07-16T12:00:00.000Z',
    materialRoot: `releases/${id}/materials`,
    files: listFiles(materialRoot).map((filePath) => {
      const content = fs.readFileSync(filePath);
      return {
        path: normalizePath(path.relative(materialRoot, filePath)),
        checksum: sha256(content),
        size: content.length,
      };
    }),
  };
  const manifestPath = path.join(root, 'releases', id, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  const index = {
    formatVersion: 1,
    updatedAt: '2026-07-16T12:00:00.000Z',
    currentRelease: {
      id,
      manifest: `releases/${id}/manifest.json`,
      checksum: sha256(fs.readFileSync(manifestPath)),
    },
    materials: parsedRegistry.skills.map((material) => ({
      id: material.id,
      kind: material.kind,
      version: material.version,
      file: material.sourceFile,
      checksum: sha256(fs.readFileSync(path.join(materialRoot, material.sourceFile))),
    })),
  };
  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
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

function listFiles(root) {
  const files = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const filePath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFiles(filePath));
    } else if (entry.isFile()) {
      files.push(filePath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}
