import {
  AppliesTo,
  LoadMode,
  RegistryMaterialKind,
  RegistryMaterialResourceFile,
  RegistryMaterialResources,
  RegistryMaterial,
  SkillCategory,
  SkillSeverity,
  SkillScope,
  SkillStatus,
  ValidationIssue,
} from './types';

const skillScopes: SkillScope[] = [
  'company',
  'team',
  'project',
  'directory',
  'taskType',
];

const loadModes: LoadMode[] = [
  'always',
  'project',
  'task',
  'onDemand',
  'reference',
];

const materialKinds: RegistryMaterialKind[] = [
  'rule',
  'skill',
  'reference',
];

const skillStatuses: SkillStatus[] = [
  'draft',
  'active',
  'deprecated',
  'disabled',
];

const skillCategories: SkillCategory[] = [
  'general',
  'communication',
  'git',
  'verification',
  'dependencies',
  'frontend',
  'bff',
  'backend',
  'typescript',
  'html',
  'scss',
  'architecture',
  'security',
];

const skillSeverities: SkillSeverity[] = [
  'required',
  'recommended',
];

const appliesToFields: Array<keyof AppliesTo> = [
  'projects',
  'agents',
  'taskTypes',
  'paths',
  'technologies',
];

const forbiddenOrderingFields = ['priority', 'order'];

export interface NormalizeSkillInput {
  frontmatter: Record<string, unknown>;
  body: string;
  sourceFile: string;
  entrypoint?: string;
  resources?: RegistryMaterialResources;
  resourceFiles?: RegistryMaterialResourceFile[];
}

export interface NormalizeSkillResult {
  skill?: RegistryMaterial;
  issues: ValidationIssue[];
}

export function normalizeSkill(input: NormalizeSkillInput): NormalizeSkillResult {
  const issues: ValidationIssue[] = [];
  const sourceFile = input.sourceFile;
  const frontmatter = input.frontmatter;

  const id = readRequiredString(frontmatter, 'id', sourceFile, issues);
  const kind = readEnum(frontmatter, 'kind', materialKinds, sourceFile, issues);
  const title = readRequiredString(frontmatter, 'title', sourceFile, issues);
  const summary = readRequiredString(frontmatter, 'summary', sourceFile, issues);
  const owner = readRequiredString(frontmatter, 'owner', sourceFile, issues);
  const updatedAt = readRequiredString(frontmatter, 'updatedAt', sourceFile, issues);
  const version = readRequiredNumber(frontmatter, 'version', sourceFile, issues);
  const scope = readEnum(frontmatter, 'scope', skillScopes, sourceFile, issues);
  const loadMode = readEnum(frontmatter, 'loadMode', loadModes, sourceFile, issues);
  const status = readEnum(frontmatter, 'status', skillStatuses, sourceFile, issues);
  const category = readOptionalEnum(
    frontmatter,
    'category',
    skillCategories,
    'general',
    sourceFile,
    issues,
  );
  const severity = readOptionalEnum(
    frontmatter,
    'severity',
    skillSeverities,
    'recommended',
    sourceFile,
    issues,
  );
  const appliesTo = readAppliesTo(frontmatter, sourceFile, issues);
  const body = input.body.trim();

  for (const field of forbiddenOrderingFields) {
    if (!Object.prototype.hasOwnProperty.call(frontmatter, field)) {
      continue;
    }

    issues.push({
      severity: 'error',
      code: 'manual_ordering_field_not_allowed',
      message: `Field "${field}" is not allowed. Registry ordering is derived from scope, severity, category, and id.`,
      sourceFile,
      field,
    });
  }

  if (body === '' && loadMode !== 'reference') {
    issues.push({
      severity: 'error',
      code: 'empty_body',
      message: 'Registry material body must not be empty.',
      sourceFile,
      field: 'body',
    });
  }

  if (version !== undefined && version <= 0) {
    issues.push({
      severity: 'error',
      code: 'invalid_version',
      message: 'Skill version must be a positive number.',
      sourceFile,
      field: 'version',
    });
  }

  if (updatedAt && Number.isNaN(Date.parse(updatedAt))) {
    issues.push({
      severity: 'error',
      code: 'invalid_updated_at',
      message: 'Skill updatedAt must be a valid date string.',
      sourceFile,
      field: 'updatedAt',
    });
  }

  if (issues.some((issue) => issue.severity === 'error')) {
    return { issues };
  }

  return {
    skill: {
      id: id as string,
      kind: kind as RegistryMaterialKind,
      title: title as string,
      summary: summary as string,
      body,
      scope: scope as SkillScope,
      loadMode: loadMode as LoadMode,
      status: status as SkillStatus,
      category,
      severity,
      version: version as number,
      owner: owner as string,
      updatedAt: updatedAt as string,
      appliesTo,
      sourceFile,
      entrypoint: input.entrypoint,
      resources: input.resources,
      resourceFiles: input.resourceFiles,
    },
    issues,
  };
}

export function findDuplicateSkillIssues(skills: RegistryMaterial[]): ValidationIssue[] {
  const seen = new Map<string, RegistryMaterial>();
  const issues: ValidationIssue[] = [];

  for (const skill of skills) {
    const existing = seen.get(skill.id);

    if (existing) {
      issues.push({
        severity: 'error',
        code: 'duplicate_skill_id',
        message: `Duplicate skill id "${skill.id}" in ${existing.sourceFile} and ${skill.sourceFile}.`,
        sourceFile: skill.sourceFile,
        field: 'id',
      });
      continue;
    }

    seen.set(skill.id, skill);
  }

  return issues;
}

function readRequiredString(
  source: Record<string, unknown>,
  field: string,
  sourceFile: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = source[field];

  if (typeof value !== 'string' || value.trim() === '') {
    issues.push({
      severity: 'error',
      code: 'missing_string_field',
      message: `Required field "${field}" must be a non-empty string.`,
      sourceFile,
      field,
    });
    return undefined;
  }

  return value;
}

function readRequiredNumber(
  source: Record<string, unknown>,
  field: string,
  sourceFile: string,
  issues: ValidationIssue[],
): number | undefined {
  const value = source[field];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({
      severity: 'error',
      code: 'missing_number_field',
      message: `Required field "${field}" must be a finite number.`,
      sourceFile,
      field,
    });
    return undefined;
  }

  return value;
}

function readEnum<T extends string>(
  source: Record<string, unknown>,
  field: string,
  allowedValues: T[],
  sourceFile: string,
  issues: ValidationIssue[],
): T | undefined {
  const value = source[field];

  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    issues.push({
      severity: 'error',
      code: 'invalid_enum_field',
      message: `Field "${field}" must be one of: ${allowedValues.join(', ')}.`,
      sourceFile,
      field,
    });
    return undefined;
  }

  return value as T;
}

function readOptionalEnum<T extends string>(
  source: Record<string, unknown>,
  field: string,
  allowedValues: T[],
  defaultValue: T,
  sourceFile: string,
  issues: ValidationIssue[],
): T {
  const value = source[field];

  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    issues.push({
      severity: 'error',
      code: 'invalid_enum_field',
      message: `Field "${field}" must be one of: ${allowedValues.join(', ')}.`,
      sourceFile,
      field,
    });
    return defaultValue;
  }

  return value as T;
}

function readAppliesTo(
  source: Record<string, unknown>,
  sourceFile: string,
  issues: ValidationIssue[],
): AppliesTo {
  const appliesTo = source.appliesTo;

  if (!isRecord(appliesTo)) {
    issues.push({
      severity: 'error',
      code: 'missing_applies_to',
      message: 'Required field "appliesTo" must be an object.',
      sourceFile,
      field: 'appliesTo',
    });
    return {};
  }

  const normalized: AppliesTo = {};

  for (const field of appliesToFields) {
    const value = appliesTo[field];

    if (value === undefined) {
      continue;
    }

    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      issues.push({
        severity: 'error',
        code: 'invalid_applies_to_field',
        message: `appliesTo.${field} must be an array of strings.`,
        sourceFile,
        field: `appliesTo.${field}`,
      });
      continue;
    }

    normalized[field] = value;
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
