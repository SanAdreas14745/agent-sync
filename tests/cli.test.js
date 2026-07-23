const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { setupTestProject } = require('./helpers/test-project');
const packageJson = require('../package.json');

const projectRoot = setupTestProject();

function runCli(args) {
  return execFileSync(
    process.execPath,
    ['dist/cli.js', ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );
}

function runFailingCli(args) {
  const result = spawnSync(
    process.execPath,
    ['dist/cli.js', ...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 1);
  return `${result.stdout}${result.stderr}`;
}

const versionOutput = runCli(['--version']);
assert.equal(versionOutput.trim(), packageJson.version);

const checkOutput = runCli(['check', '--project-root', projectRoot]);
assert.match(checkOutput, /project config is valid/);
assert.match(checkOutput, /registry provider: file/);
assert.match(checkOutput, /registry found/);
assert.match(checkOutput, /active rules resolved/);

const reviewOutput = runCli([
  'registry',
  'review',
  '--project-root',
  projectRoot,
]);
assert.match(reviewOutput, /Registry review: \d+ material\(s\) checked\./);
assert.match(reviewOutput, /Registry review passed/);

const invalidReviewProjectRoot = path.resolve('./tests/.tmp/registry-review-project');
fs.rmSync(invalidReviewProjectRoot, { recursive: true, force: true });
fs.mkdirSync(invalidReviewProjectRoot, { recursive: true });
fs.writeFileSync(
  path.join(invalidReviewProjectRoot, '.ai-skills.json'),
  JSON.stringify(
    {
      project: 'statistics',
      agents: ['codex'],
      registry: path.resolve('./tests/fixtures/registry-review-invalid').replace(/\\/g, '/'),
    },
    null,
    2,
  ),
  'utf8',
);

const invalidReviewOutput = runFailingCli([
  'registry',
  'review',
  '--project-root',
  invalidReviewProjectRoot,
]);
assert.match(invalidReviewOutput, /manual_ordering_field_not_allowed/);
assert.match(invalidReviewOutput, /conflicting_rule_directive/);
assert.match(invalidReviewOutput, /Registry review failed/);

const gitRegistryProjectRoot = path.resolve('./tests/.tmp/git-registry-project');
fs.rmSync(gitRegistryProjectRoot, { recursive: true, force: true });
fs.mkdirSync(gitRegistryProjectRoot, { recursive: true });
fs.writeFileSync(
  path.join(gitRegistryProjectRoot, '.ai-skills.json'),
  JSON.stringify(
    {
      project: 'statistics',
      agents: ['codex'],
      registry: {
        type: 'git',
        url: 'https://github.com/company/agent-sync-registry',
        ref: 'main',
      },
    },
    null,
    2,
  ),
  'utf8',
);
const missingGitLockOutput = runFailingCli([
  'sync',
  '--project-root',
  gitRegistryProjectRoot,
]);
assert.match(missingGitLockOutput, /registry_lock_read_failed/);

const bundledRegistryProjectRoot = path.resolve('./tests/.tmp/bundled-registry-project');
fs.rmSync(bundledRegistryProjectRoot, { recursive: true, force: true });
fs.mkdirSync(bundledRegistryProjectRoot, { recursive: true });
fs.writeFileSync(
  path.join(bundledRegistryProjectRoot, '.ai-skills.json'),
  JSON.stringify(
    {
      project: 'statistics',
      agents: ['codex'],
      technologies: ['typescript'],
      registry: {
        type: 'bundled',
      },
    },
    null,
    2,
  ),
  'utf8',
);

const bundledRegistryCheckOutput = runCli([
  'check',
  '--project-root',
  bundledRegistryProjectRoot,
]);
assert.match(bundledRegistryCheckOutput, /registry provider: bundled/);
assert.match(bundledRegistryCheckOutput, /registry found/);
assert.match(bundledRegistryCheckOutput, /active rules resolved/);

const bundledRegistrySyncOutput = runCli([
  'sync',
  '--project-root',
  bundledRegistryProjectRoot,
]);
assert.match(bundledRegistrySyncOutput, /Generated:/);
assert.ok(fs.existsSync(path.join(bundledRegistryProjectRoot, 'AGENTS.md')));

const dryRunOutput = runCli([
  'sync',
  '--project-root',
  projectRoot,
  '--dry-run',
]);
assert.match(dryRunOutput, /Resolved 8 active rules/);
assert.match(dryRunOutput, /Would generate:/);

const syncOutput = runCli([
  'sync',
  '--project-root',
  projectRoot,
]);
assert.match(syncOutput, /Generated:/);
assert.match(syncOutput, /frontend.typescript@1/);

const statusOutput = runCli(['status', '--project-root', projectRoot]);
assert.match(statusOutput, /AGENTS.md: exists/);
assert.match(statusOutput, /rule-scope.md: exists/);
assert.match(statusOutput, /frontend.typescript@1/);
assert.match(statusOutput, /Generated rule files:/);
assert.match(statusOutput, /Generated skill files: 7/);

const nativeAgentCases = [
  {
    agent: 'claude-code',
    requiredRule: '.claude/rules/agentsync/required.md',
    skill: '.claude/skills/agentsync-frontend-code-review/SKILL.md',
  },
  {
    agent: 'cursor',
    requiredRule: '.cursor/rules/agentsync-required.mdc',
    skill: '.cursor/skills/agentsync-frontend-code-review/SKILL.md',
  },
  {
    agent: 'github-copilot',
    requiredRule: '.github/instructions/agentsync-required.instructions.md',
    skill: '.github/skills/agentsync-frontend-code-review/SKILL.md',
  },
];

for (const testCase of nativeAgentCases) {
  const nativeSyncOutput = runCli([
    'sync',
    '--project-root',
    projectRoot,
    '--agent',
    testCase.agent,
  ]);
  assert.match(nativeSyncOutput, /Generated:/);
  assert.ok(nativeSyncOutput.includes(testCase.requiredRule));
  assert.ok(fs.existsSync(path.join(projectRoot, testCase.requiredRule)));
  assert.ok(fs.existsSync(path.join(projectRoot, testCase.skill)));

  const nativeStatusOutput = runCli([
    'status',
    '--project-root',
    projectRoot,
    '--agent',
    testCase.agent,
  ]);
  assert.ok(nativeStatusOutput.includes(testCase.requiredRule));
  assert.match(nativeStatusOutput, /Generated skill files: 7/);
}

const claudeAliasStatusOutput = runCli([
  'status',
  '--project-root',
  projectRoot,
  '--agent',
  'claude',
]);
assert.match(claudeAliasStatusOutput, /Agent: claude-code/);

const infoIncludedOutput = runCli([
  'info',
  'frontend.code-review',
  '--project-root',
  projectRoot,
]);
assert.match(infoIncludedOutput, /Status: available/);
assert.match(infoIncludedOutput, /kind skill is available through skill index/);

const infoSkippedOutput = runCli([
  'info',
  'frontend.code-review',
  '--project-root',
  projectRoot,
  '--technology',
  'nestjs',
]);
assert.match(infoSkippedOutput, /Status: skipped/);
assert.match(infoSkippedOutput, /technology values do not match restriction/);

console.log('cli tests passed');
