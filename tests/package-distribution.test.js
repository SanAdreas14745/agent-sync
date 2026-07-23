const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const packageJson = require('../package.json');
const npmrcExample = fs.readFileSync(path.resolve('.npmrc.example'), 'utf8');
const publishWorkflow = fs.readFileSync(
  path.resolve('.github/workflows/publish-package.yml'),
  'utf8',
);

assert.equal(packageJson.private, undefined);
assert.equal(packageJson.publishConfig.registry, 'https://npm.pkg.github.com');
assert.ok(packageJson.files.includes('dist'));
assert.equal(packageJson.files.includes('registry'), false);
assert.equal(packageJson.bin['ai-skills'], 'dist/cli.js');
assert.equal(packageJson.scripts.prepack, 'npm run build');
assert.equal(packageJson.scripts.prepublishOnly, 'npm run verify');
assert.match(npmrcExample, /^@harness-system:registry=https:\/\/npm\.pkg\.github\.com$/m);
assert.match(npmrcExample, /:_authToken=\$\{NODE_AUTH_TOKEN\}/);
assert.match(publishWorkflow, /packages: write/);
assert.match(publishWorkflow, /GH_PACKAGES_TOKEN/);
assert.match(publishWorkflow, /npm publish/);

console.log('package distribution tests passed');
