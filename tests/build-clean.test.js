const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const staleFile = path.resolve('./dist/registry/stale-output.js');
fs.mkdirSync(path.dirname(staleFile), { recursive: true });
fs.writeFileSync(staleFile, 'stale output', 'utf8');

if (process.platform === 'win32') {
  execFileSync('cmd.exe', ['/d', '/s', '/c', 'npm.cmd run build'], { stdio: 'inherit' });
} else {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
}

assert.equal(fs.existsSync(staleFile), false);

console.log('build clean tests passed');
