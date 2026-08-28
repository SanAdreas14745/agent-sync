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

const hooksProjectRoot = path.resolve('./tests/.tmp/hooks-project');
fs.rmSync(hooksProjectRoot, { recursive: true, force: true });
fs.mkdirSync(hooksProjectRoot, { recursive: true });
fs.writeFileSync(
  path.join(hooksProjectRoot, '.ai-skills.json'),
  JSON.stringify(
    {
      project: 'statistics',
      agents: ['codex'],
      registry: path.resolve('./tests/fixtures/registry').replace(/\\/g, '/'),
    },
    null,
    2,
  ),
  'utf8',
);
execFileSync('git', ['init'], { cwd: hooksProjectRoot, encoding: 'utf8' });

const postCheckoutHookPath = path.join(hooksProjectRoot, '.git', 'hooks', 'post-checkout');
if (fs.existsSync(postCheckoutHookPath)) {
  fs.unlinkSync(postCheckoutHookPath);
}
assert.equal(fs.existsSync(postCheckoutHookPath), false);

const hooksInstallOutput = runCli([
  'hooks',
  'install',
  '--project-root',
  hooksProjectRoot,
]);
assert.match(hooksInstallOutput, /Installed AgentSync post-checkout hook/);

const postCheckoutHook = fs.readFileSync(postCheckoutHookPath, 'utf8');
assert.match(postCheckoutHook, /\[ "\$3" != "1" \]/);
assert.match(postCheckoutHook, /ai-skills update --project-root/);

const repeatedHooksInstallOutput = runCli([
  'hooks',
  'install',
  '--project-root',
  hooksProjectRoot,
]);
assert.match(repeatedHooksInstallOutput, /already installed/);

fs.writeFileSync(postCheckoutHookPath, '#!/bin/sh\necho custom hook\n', 'utf8');
const hookConflictOutput = runFailingCli([
  'hooks',
  'install',
  '--project-root',
  hooksProjectRoot,
]);
assert.match(hookConflictOutput, /git_hook_conflict/);
assert.equal(fs.readFileSync(postCheckoutHookPath, 'utf8'), '#!/bin/sh\necho custom hook\n');

const customHooksProjectRoot = path.resolve('./tests/.tmp/custom-hooks-project');
fs.rmSync(customHooksProjectRoot, { recursive: true, force: true });
fs.mkdirSync(customHooksProjectRoot, { recursive: true });
fs.writeFileSync(
  path.join(customHooksProjectRoot, '.ai-skills.json'),
  JSON.stringify(
    {
      project: 'statistics',
      agents: ['codex'],
      registry: path.resolve('./tests/fixtures/registry').replace(/\\/g, '/'),
    },
    null,
    2,
  ),
  'utf8',
);
execFileSync('git', ['init'], { cwd: customHooksProjectRoot, encoding: 'utf8' });
execFileSync('git', ['config', 'core.hooksPath', '.custom-hooks'], {
  cwd: customHooksProjectRoot,
  encoding: 'utf8',
});

runCli([
  'hooks',
  'install',
  '--project-root',
  customHooksProjectRoot,
]);
assert.ok(fs.existsSync(path.join(customHooksProjectRoot, '.custom-hooks', 'post-checkout')));

const huskyHooksProjectRoot = path.resolve('./tests/.tmp/husky-hooks-project');
fs.rmSync(huskyHooksProjectRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(huskyHooksProjectRoot, '.husky', '_'), { recursive: true });
fs.writeFileSync(
  path.join(huskyHooksProjectRoot, '.ai-skills.json'),
  JSON.stringify(
    {
      project: 'statistics',
      agents: ['codex'],
      registry: path.resolve('./tests/fixtures/registry').replace(/\\/g, '/'),
    },
    null,
    2,
  ),
  'utf8',
);
fs.writeFileSync(path.join(huskyHooksProjectRoot, '.husky', '_', 'h'), '#!/bin/sh\n', 'utf8');
execFileSync('git', ['init'], { cwd: huskyHooksProjectRoot, encoding: 'utf8' });
execFileSync('git', ['config', 'core.hooksPath', '.husky/_'], {
  cwd: huskyHooksProjectRoot,
  encoding: 'utf8',
});

runCli([
  'hooks',
  'install',
  '--project-root',
  huskyHooksProjectRoot,
]);
assert.ok(fs.existsSync(path.join(huskyHooksProjectRoot, '.husky', 'post-checkout')));
assert.equal(fs.existsSync(path.join(huskyHooksProjectRoot, '.husky', '_', 'post-checkout')), false);

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
