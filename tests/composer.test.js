const assert = require('node:assert/strict');
const api = require('../dist');

const registry = api.readRegistry('./registry');

assert.deepEqual(registry.issues, []);

const baseContext = {
  project: 'statistics',
  agent: 'codex',
  technologies: ['typescript'],
};

const baseResult = api.resolveSkills(registry.skills, baseContext);

assert.deepEqual(
  baseResult.included.map((skill) => skill.id),
  [
    'company.communication',
    'company.dependency-changes',
    'company.common',
    'company.git-workspace-safety',
    'company.verification',
    'company.coding-standards',
    'frontend.typescript',
    'frontend.common',
  ],
);
assert.deepEqual(baseResult.available.map((skill) => skill.id), [
  'company.youtrack-development-backlog-task',
  'frontend.code-review',
  'frontend.generated-openapi-status-noise',
]);
assert.equal(
  api.explainSkill(baseResult, 'frontend.code-review').status,
  'available',
);
assert.equal(
  api.explainSkill(baseResult, 'frontend.generated-openapi-status-noise').status,
  'available',
);

const codeReviewResult = api.resolveSkills(registry.skills, {
  ...baseContext,
  taskType: 'code-review',
});

assert.deepEqual(
  codeReviewResult.included.map((skill) => skill.id),
  [
    'company.communication',
    'company.dependency-changes',
    'company.common',
    'company.git-workspace-safety',
    'company.verification',
    'company.coding-standards',
    'frontend.typescript',
    'frontend.common',
  ],
);
assert.equal(
  api.explainSkill(codeReviewResult, 'frontend.code-review').status,
  'available',
);
assert.equal(codeReviewResult.warnings.length, 0);

const agentMismatchResult = api.resolveSkills(registry.skills, {
  ...baseContext,
  agent: 'cursor',
});

assert.equal(agentMismatchResult.included.length, 0);
assert.ok(
  agentMismatchResult.warnings.some(
    (warning) => warning.code === 'skill_matches_project_but_not_agent',
  ),
);

console.log('composer tests passed');
