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

const objectRegistry = {
  type: 'yandex-object-storage',
  bucket: 'ai-skills-registry',
  prefix: 'registries/frontend/v1',
  endpoint: 'https://storage.yandexcloud.net',
};
const objectConfigResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: objectRegistry,
});
assert.deepEqual(objectConfigResult.issues, []);
assert.deepEqual(objectConfigResult.config.registry, objectRegistry);

const missingFieldResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: {
    ...objectRegistry,
    endpoint: '',
  },
});
assert.deepEqual(
  missingFieldResult.issues.map((issue) => issue.code),
  ['invalid_registry_config_field'],
);

const secretFieldResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: {
    ...objectRegistry,
    secretAccessKey: 'must-not-be-here',
  },
});
assert.deepEqual(
  secretFieldResult.issues.map((issue) => issue.code),
  ['registry_config_secret_not_allowed'],
);

const unsupportedProviderResult = api.normalizeProjectConfig({
  ...baseConfig,
  registry: {
    ...objectRegistry,
    type: 's3',
  },
});
assert.deepEqual(
  unsupportedProviderResult.issues.map((issue) => issue.code),
  ['unsupported_registry_provider'],
);

console.log('project config tests passed');
