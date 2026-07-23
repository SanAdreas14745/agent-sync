const { existsSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { dirname, resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const distRoot = resolve(projectRoot, 'dist');

if (dirname(distRoot) !== projectRoot) {
  throw new Error(`Refusing to clean unexpected path: ${distRoot}`);
}

if (process.platform === 'win32') {
  process.env.AGENTSYNC_DIST_PATH = distRoot;
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      'if (Test-Path -LiteralPath $env:AGENTSYNC_DIST_PATH) { Remove-Item -LiteralPath $env:AGENTSYNC_DIST_PATH -Recurse -Force }',
    ],
    { stdio: 'inherit' },
  );
} else {
  rmSync(distRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

if (existsSync(distRoot)) {
  throw new Error(`Build output directory was not removed: ${distRoot}`);
}
