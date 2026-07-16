import { readFileSync } from 'node:fs';
import {
  ProjectConfig,
  RegistryConfig,
  ValidationIssue,
  YandexObjectStorageRegistryConfig,
} from './types';

const projectConfigFields = new Set([
  'project',
  'agents',
  'registry',
  'technologies',
  'defaultTaskType',
]);

const yandexObjectStorageRegistryFields = new Set([
  'type',
  'bucket',
  'prefix',
  'endpoint',
]);

export interface ReadProjectConfigResult {
  config?: ProjectConfig;
  issues: ValidationIssue[];
}

export function readProjectConfig(configPath: string): ReadProjectConfigResult {
  try {
    const content = readFileSync(configPath, 'utf8');
    return normalizeProjectConfig(JSON.parse(content));
  } catch (error) {
    return {
      issues: [
        {
          severity: 'error',
          code: 'project_config_read_failed',
          message: error instanceof Error ? error.message : String(error),
          sourceFile: configPath,
        },
      ],
    };
  }
}

export function normalizeProjectConfig(value: unknown): ReadProjectConfigResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return {
      issues: [
        {
          severity: 'error',
          code: 'invalid_project_config',
          message: 'Project config must be a JSON object.',
        },
      ],
    };
  }

  validateProjectConfigFields(value, issues);

  const project = readString(value, 'project', issues);
  const registry = readRegistryConfig(value, issues);
  const agents = readStringArray(value, 'agents', issues);
  const technologies = readOptionalStringArray(value, 'technologies', issues);
  const defaultTaskType = readOptionalString(value, 'defaultTaskType', issues);

  if (issues.some((issue) => issue.severity === 'error')) {
    return { issues };
  }

  return {
    config: {
      project: project as string,
      registry: registry as RegistryConfig,
      agents,
      technologies,
      defaultTaskType,
    },
    issues,
  };
}

function validateProjectConfigFields(
  source: Record<string, unknown>,
  issues: ValidationIssue[],
): void {
  for (const field of Object.keys(source)) {
    if (!projectConfigFields.has(field)) {
      issues.push({
        severity: 'error',
        code: 'unknown_project_config_field',
        message: `Project config field "${field}" is not supported.`,
        field,
      });
    }
  }
}

function readString(
  source: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = source[field];

  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({
      severity: 'error',
      code: 'missing_project_config_string',
      message: `Project config field "${field}" must be a non-empty string.`,
      field,
    });
    return undefined;
  }

  return value;
}

function readRegistryConfig(
  source: Record<string, unknown>,
  issues: ValidationIssue[],
): RegistryConfig | undefined {
  const value = source.registry;

  if (typeof value === 'string') {
    if (value.trim() === '') {
      issues.push({
        severity: 'error',
        code: 'missing_project_config_string',
        message: 'Project config field "registry" must be a non-empty string.',
        field: 'registry',
      });
      return undefined;
    }

    return value;
  }

  if (!isRecord(value)) {
    issues.push({
      severity: 'error',
      code: 'invalid_registry_config',
      message: 'Project config field "registry" must be a non-empty string or an object.',
      field: 'registry',
    });
    return undefined;
  }

  validateYandexObjectStorageRegistryFields(value, issues);

  if (value.type !== 'yandex-object-storage') {
    issues.push({
      severity: 'error',
      code: 'unsupported_registry_provider',
      message: 'Registry config field "type" must be "yandex-object-storage".',
      field: 'registry.type',
    });
    return undefined;
  }

  const bucket = readRegistryConfigString(value, 'bucket', issues);
  const prefix = readRegistryConfigString(value, 'prefix', issues);
  const endpoint = readRegistryConfigString(value, 'endpoint', issues);

  if (!bucket || !prefix || !endpoint) {
    return undefined;
  }

  return {
    type: 'yandex-object-storage',
    bucket,
    prefix,
    endpoint,
  } satisfies YandexObjectStorageRegistryConfig;
}

function validateYandexObjectStorageRegistryFields(
  source: Record<string, unknown>,
  issues: ValidationIssue[],
): void {
  for (const field of Object.keys(source)) {
    if (yandexObjectStorageRegistryFields.has(field)) {
      continue;
    }

    const isSecretField = /secret|token|credential|accesskey|serviceaccount|password|privatekey/i.test(field);
    issues.push({
      severity: 'error',
      code: isSecretField
        ? 'registry_config_secret_not_allowed'
        : 'unknown_registry_config_field',
      message: isSecretField
        ? `Registry config field "${field}" must not contain credentials or secrets.`
        : `Registry config field "${field}" is not supported.`,
      field: `registry.${field}`,
    });
  }
}

function readRegistryConfigString(
  source: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = source[field];

  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({
      severity: 'error',
      code: 'invalid_registry_config_field',
      message: `Registry config field "${field}" must be a non-empty string.`,
      field: `registry.${field}`,
    });
    return undefined;
  }

  return value;
}

function readOptionalString(
  source: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = source[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({
      severity: 'error',
      code: 'invalid_project_config_string',
      message: `Project config field "${field}" must be a non-empty string when present.`,
      field,
    });
    return undefined;
  }

  return value;
}

function readStringArray(
  source: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): string[] {
  const value = source[field];

  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    issues.push({
      severity: 'error',
      code: 'missing_project_config_string_array',
      message: `Project config field "${field}" must be an array of strings.`,
      field,
    });
    return [];
  }

  return value;
}

function readOptionalStringArray(
  source: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): string[] | undefined {
  const value = source[field];

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    issues.push({
      severity: 'error',
      code: 'invalid_project_config_string_array',
      message: `Project config field "${field}" must be an array of strings when present.`,
      field,
    });
    return undefined;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
