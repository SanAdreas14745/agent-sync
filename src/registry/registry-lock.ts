import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { GitRegistryConfig, ValidationIssue } from './types';
import { isValidGitRegistryRef, normalizeGitRegistryUrl } from './git-registry';

export const registryLockFileName = '.ai-skills.lock.json';

export interface GitRegistryLock {
  source: string;
  requestedRef: string;
  resolvedCommit: string;
}

export interface ReadRegistryLockResult {
  lock?: GitRegistryLock;
  issues: ValidationIssue[];
}

/** Читает и валидирует lock-файл Git registry. */
export function readRegistryLock(lockPath: string): ReadRegistryLockResult {
  try {
    return normalizeGitRegistryLock(JSON.parse(readFileSync(lockPath, 'utf8')), lockPath);
  } catch (error) {
    return {
      issues: [
        {
          severity: 'error',
          code: 'registry_lock_read_failed',
          message: error instanceof Error ? error.message : String(error),
          sourceFile: lockPath,
        },
      ],
    };
  }
}

/** Атомарно записывает нормализованный lock-файл. */
export function writeRegistryLock(lockPath: string, lock: GitRegistryLock): void {
  const normalized = normalizeGitRegistryLock(lock, lockPath);

  if (!normalized.lock || normalized.issues.length > 0) {
    throw new Error('Cannot write an invalid Git registry lock.');
  }

  const directory = dirname(lockPath);
  const temporaryPath = `${lockPath}.tmp-${process.pid}`;
  mkdirSync(directory, { recursive: true });

  try {
    writeFileSync(temporaryPath, `${JSON.stringify(normalized.lock, null, 2)}\n`, 'utf8');
    renameSync(temporaryPath, lockPath);
  } catch (error) {
    throw error;
  }
}

/** Валидирует JSON-представление lock-файла. */
export function normalizeGitRegistryLock(
  value: unknown,
  sourceFile?: string,
): ReadRegistryLockResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return invalidLock('Registry lock must be a JSON object.', sourceFile);
  }

  for (const field of Object.keys(value)) {
    if (!['source', 'requestedRef', 'resolvedCommit'].includes(field)) {
      issues.push({
        severity: 'error',
        code: 'unknown_registry_lock_field',
        message: `Registry lock field "${field}" is not supported.`,
        sourceFile,
        field,
      });
    }
  }

  const source = typeof value.source === 'string'
    ? normalizeGitRegistryUrl(value.source)
    : undefined;
  if (!source) {
    issues.push({
      severity: 'error',
      code: 'invalid_registry_lock_source',
      message: 'Registry lock field "source" must be an HTTPS Git repository URL.',
      sourceFile,
      field: 'source',
    });
  }

  const requestedRef = typeof value.requestedRef === 'string' && isValidGitRegistryRef(value.requestedRef)
    ? value.requestedRef
    : undefined;
  if (!requestedRef) {
    issues.push({
      severity: 'error',
      code: 'invalid_registry_lock_ref',
      message: 'Registry lock field "requestedRef" must be a valid Git ref.',
      sourceFile,
      field: 'requestedRef',
    });
  }

  const resolvedCommit = typeof value.resolvedCommit === 'string' && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value.resolvedCommit)
    ? value.resolvedCommit.toLowerCase()
    : undefined;
  if (!resolvedCommit) {
    issues.push({
      severity: 'error',
      code: 'invalid_registry_lock_commit',
      message: 'Registry lock field "resolvedCommit" must be a full 40- or 64-character Git commit SHA.',
      sourceFile,
      field: 'resolvedCommit',
    });
  }

  if (issues.length > 0 || !source || !requestedRef || !resolvedCommit) {
    return { issues };
  }

  return {
    lock: { source, requestedRef, resolvedCommit },
    issues,
  };
}

/** Проверяет, что lock соответствует выбранному Git registry в проектном config. */
export function validateGitRegistryLock(
  lock: GitRegistryLock,
  registry: GitRegistryConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (lock.source !== registry.url) {
    issues.push({
      severity: 'error',
      code: 'registry_lock_source_mismatch',
      message: 'Registry lock source does not match registry.url in .ai-skills.json.',
      field: 'source',
    });
  }

  if (lock.requestedRef !== registry.ref) {
    issues.push({
      severity: 'error',
      code: 'registry_lock_ref_mismatch',
      message: 'Registry lock requestedRef does not match registry.ref in .ai-skills.json.',
      field: 'requestedRef',
    });
  }

  return issues;
}

function invalidLock(message: string, sourceFile?: string): ReadRegistryLockResult {
  return {
    issues: [{
      severity: 'error',
      code: 'invalid_registry_lock',
      message,
      sourceFile,
    }],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
