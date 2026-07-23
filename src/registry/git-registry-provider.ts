import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileRegistryProvider } from './file-registry-provider';
import { gitRegistryMaterialRoot } from './git-registry';
import { GitRegistryCache } from './git-registry-cache';
import { RegistryProvider } from './provider';
import { ReadRegistryResult, ValidationIssue } from './types';

export interface GitRegistryProviderOptions {
  url: string;
  commit: string;
  cache?: GitRegistryCache;
  materialRoot?: string;
}

/** Загружает registry строго по pinned Git commit и кэширует его локально. */
export class GitRegistryProvider implements RegistryProvider {
  readonly type = 'git' as const;

  private readonly cache: GitRegistryCache;
  private readonly materialRoot: string;

  constructor(private readonly options: GitRegistryProviderOptions) {
    this.cache = options.cache || new GitRegistryCache();
    this.materialRoot = options.materialRoot || gitRegistryMaterialRoot;
  }

  readRegistry(): ReadRegistryResult {
    const cachedRoot = this.cache.load(this.options.url, this.options.commit);

    if (cachedRoot) {
      return new FileRegistryProvider(cachedRoot).readRegistry();
    }

    const temporaryRoot = mkdtempSync(join(tmpdir(), 'ai-skills-git-registry-'));

    try {
      const checkoutRoot = join(temporaryRoot, 'checkout');
      const actualCommit = checkoutGitCommit(this.options.url, this.options.commit, checkoutRoot);

      if (actualCommit.toLowerCase() !== this.options.commit.toLowerCase()) {
        return failedResult({
          severity: 'error',
          code: 'git_registry_commit_mismatch',
          message: `Git checkout resolved "${actualCommit}", expected "${this.options.commit}".`,
        });
      }

      const sourceMaterialRoot = join(checkoutRoot, this.materialRoot);
      if (!existsSync(sourceMaterialRoot) || !statSync(sourceMaterialRoot).isDirectory()) {
        return failedResult({
          severity: 'error',
          code: 'git_registry_material_root_not_found',
          message: `Git registry material root was not found: ${this.materialRoot}.`,
        });
      }

      const cachedMaterialRoot = this.cache.save(
        this.options.url,
        this.options.commit,
        sourceMaterialRoot,
      );
      return new FileRegistryProvider(cachedMaterialRoot).readRegistry();
    } catch (error) {
      return failedResult({
        severity: 'error',
        code: 'git_registry_fetch_failed',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
}

/** Разрешает branch, tag или другой Git ref в полный commit SHA. */
export function resolveGitRegistryRef(url: string, ref: string): string {
  const output = runGit(['ls-remote', url, ref]);
  const lines = output.trim().split(/\r?\n/).filter((line) => line !== '');
  const peeledSuffix = `\t${ref}^{}`;
  const resolvedLine = lines.find((line) => line.endsWith(peeledSuffix)) || lines[0];
  const commit = resolvedLine?.split(/\s+/)[0];

  if (!commit || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(commit)) {
    throw new Error(`Git ref "${ref}" was not found in ${url}.`);
  }

  return commit.toLowerCase();
}

function checkoutGitCommit(url: string, commit: string, destination: string): string {
  runGit(['init', destination]);
  runGit(['-C', destination, 'remote', 'add', 'origin', url]);
  runGit(['-C', destination, 'fetch', '--depth=1', 'origin', commit]);
  runGit(['-C', destination, 'checkout', '--detach', 'FETCH_HEAD']);
  return runGit(['-C', destination, 'rev-parse', 'HEAD']).trim();
}

function runGit(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function failedResult(issue: ValidationIssue): ReadRegistryResult {
  return {
    materials: [],
    skills: [],
    issues: [issue],
  };
}
