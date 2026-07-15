import { readFileSync } from 'node:fs';
import { ProjectConfig, ValidationIssue } from './types';

const projectConfigFields = new Set([
  'project',
  'agents',
  'registry',
  'technologies',
  'defaultTaskType',
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
  const registry = readString(value, 'registry', issues);
  const agents = readStringArray(value, 'agents', issues);
  const technologies = readOptionalStringArray(value, 'technologies', issues);
  const defaultTaskType = readOptionalString(value, 'defaultTaskType', issues);

  if (issues.some((issue) => issue.severity === 'error')) {
    return { issues };
  }

  return {
    config: {
      project: project as string,
      registry: registry as string,
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
