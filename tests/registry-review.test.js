const assert = require('node:assert/strict');
const api = require('../dist');

const invalidRegistry = new api.FileRegistryProvider(
  './tests/fixtures/registry-review-invalid',
).readRegistry();
const invalidReview = api.reviewRegistryMaterials(invalidRegistry.materials);
const invalidCodes = new Set(
  [...invalidRegistry.issues, ...invalidReview.issues].map((issue) => issue.code),
);

for (const expectedCode of [
  'manual_ordering_field_not_allowed',
  'material_path_kind_mismatch',
  'reference_in_active_context',
  'missing_skill_resource',
  'conflicting_rule_directive',
  'scope_without_applies_to_restriction',
  'duplicate_material_content',
  'rule_looks_like_workflow',
]) {
  assert.ok(invalidCodes.has(expectedCode), `Expected issue ${expectedCode}.`);
}

const baselineRegistry = new api.FileRegistryProvider('./registry').readRegistry();
assert.equal(
  baselineRegistry.issues.filter((issue) => issue.severity === 'error').length,
  0,
);

const baselineReview = api.reviewRegistryMaterials(baselineRegistry.materials);
assert.equal(
  baselineReview.issues.filter((issue) => issue.severity === 'error').length,
  0,
);

console.log('registry review tests passed');
