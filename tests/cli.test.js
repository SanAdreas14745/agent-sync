const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { setupTestProject } = require('./helpers/test-project');

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

const checkOutput = runCli(['check', '--project-root', projectRoot]);
assert.match(checkOutput, /project config is valid/);
assert.match(checkOutput, /registry found/);
assert.match(checkOutput, /active rules resolved/);

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
