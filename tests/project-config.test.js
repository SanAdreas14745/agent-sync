const assert = require('node:assert/strict');
const api = require('../dist/index.js');

const baseConfig = {
  project: 'statistics',
  agents: ['codex'],
};

const fileConfigResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: './registry',
});
assert.deepEqual(fileConfigResult.issues, []);
assert.equal(fileConfigResult.config.registry, './registry');

const gitConfigResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: {
    type: 'git',
    url: 'https://github.com/company/agent-sync-registry.git/',
    ref: 'main',
  },
});
assert.deepEqual(gitConfigResult.issues, []);
assert.deepEqual(gitConfigResult.config.registry, {
  type: 'git',
  url: 'https://github.com/company/agent-sync-registry',
  ref: 'main',
});

const invalidGitConfigResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: {
    type: 'git',
    url: 'ssh://github.com/company/agent-sync-registry',
    ref: 'main..next',
  },
});
assert.deepEqual(
  invalidGitConfigResult.issues.map((issue) => issue.code),
  ['invalid_registry_config_field', 'invalid_registry_config_field'],
);

const unsupportedProviderResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: {
    type: 's3',
  },
});
assert.deepEqual(
  unsupportedProviderResult.issues.map((issue) => issue.code),
  ['unsupported_registry_provider'],
);

console.log('project config tests passed');
