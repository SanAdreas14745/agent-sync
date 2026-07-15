import {
  AppliesTo,
  LoadMode,
  RegistryMaterial,
  SkillScope,
} from '../registry/types';
import {
  AvailableSkill,
  ComposerWarning,
  ResolveContext,
  ResolveManifest,
  ResolveResult,
  ResolvedSkill,
  SkillCandidate,
  SkillExplanation,
  SkippedSkill,
} from './types';

const scopeOrder: Record<SkillScope, number> = {
  company: 0,
  team: 1,
  project: 2,
  directory: 3,
  taskType: 4,
};

const activeLoadModes: LoadMode[] = ['always', 'project', 'task'];

export function resolveSkills(
  skills: RegistryMaterial[],
  context: ResolveContext,
): ResolveResult {
  const included: ResolvedSkill[] = [];
  const available: AvailableSkill[] = [];
  const skipped: SkippedSkill[] = [];
  const warnings: ComposerWarning[] = [];

  for (const skill of skills) {
    warnings.push(...getStatusWarnings(skill));

    if (skill.status !== 'active') {
      skipped.push(toSkipped(skill, [`status ${skill.status} is not active`]));
      continue;
    }

    const match = matchAppliesTo(skill, context);

    if (!match.matches) {
      skipped.push(toSkipped(skill, match.reasons));
      warnings.push(...getMatchWarnings(skill, context, match.reasons));
      continue;
    }

    warnings.push(...getSizeWarnings(skill));

    const candidate: SkillCandidate = {
      skill,
      reasons: match.reasons,
    };

    if (skill.kind !== 'rule') {
      available.push(toAvailable(candidate));
      continue;
    }

    if (skill.loadMode === 'onDemand' || skill.loadMode === 'reference') {
      available.push(toAvailable(candidate));
      continue;
    }

    if (!activeLoadModes.includes(skill.loadMode)) {
      skipped.push(toSkipped(skill, [`loadMode ${skill.loadMode} is not included in active context`]));
      continue;
    }

    if (skill.loadMode === 'task' && !context.taskType) {
      skipped.push(toSkipped(skill, ['loadMode task requires current taskType']));
      continue;
    }

    included.push(toIncluded(candidate));
  }

  included.sort(compareResolvedSkills);
  available.sort(compareAvailableSkills);
  skipped.sort((left, right) => left.id.localeCompare(right.id));

  const estimatedTokens = included.reduce(
    (sum, skill) => sum + skill.estimatedTokens,
    0,
  );

  return {
    included,
    available,
    skipped,
    warnings,
    manifest: createManifest(context, included, available, estimatedTokens),
  };
}

export function explainSkill(result: ResolveResult, skillId: string): SkillExplanation {
  const included = result.included.find((skill) => skill.id === skillId);

  if (included) {
    return {
      id: skillId,
      status: 'included',
      reasons: included.reasons,
    };
  }

  const available = result.available.find((skill) => skill.id === skillId);

  if (available) {
    return {
      id: skillId,
      status: 'available',
      reasons: available.reasons,
    };
  }

  const skipped = result.skipped.find((skill) => skill.id === skillId);

  if (skipped) {
    return {
      id: skillId,
      status: 'skipped',
      reasons: skipped.reasons,
    };
  }

  return {
    id: skillId,
    status: 'unknown',
    reasons: ['skill id was not present in ResolveResult'],
  };
}

function matchAppliesTo(
  skill: RegistryMaterial,
  context: ResolveContext,
): { matches: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const appliesTo = skill.appliesTo;

  const checks: Array<{ field: keyof AppliesTo; current?: string; label: string }> = [
    { field: 'agents', current: context.agent, label: 'agent' },
    { field: 'projects', current: context.project, label: 'project' },
    { field: 'taskTypes', current: context.taskType, label: 'taskType' },
  ];

  for (const check of checks) {
    const allowedValues = appliesTo[check.field];

    if (!allowedValues || allowedValues.length === 0) {
      reasons.push(`${check.label} has no restriction`);
      continue;
    }

    if (!check.current) {
      reasons.push(`${check.label} is required by appliesTo.${check.field}`);
      return { matches: false, reasons };
    }

    if (!allowedValues.includes(check.current)) {
      reasons.push(`${check.label} ${check.current} does not match appliesTo.${check.field}`);
      return { matches: false, reasons };
    }

    reasons.push(`${check.label} ${check.current} matches appliesTo.${check.field}`);
  }

  const technologyMatch = matchListRestriction(
    appliesTo.technologies,
    context.technologies,
    'technology',
  );

  reasons.push(...technologyMatch.reasons);

  if (!technologyMatch.matches) {
    return { matches: false, reasons };
  }

  const pathMatch = matchPathRestriction(appliesTo.paths, context.paths);
  reasons.push(...pathMatch.reasons);

  if (!pathMatch.matches) {
    return { matches: false, reasons };
  }

  return { matches: true, reasons };
}

function matchListRestriction(
  allowedValues: string[] | undefined,
  currentValues: string[] | undefined,
  label: string,
): { matches: boolean; reasons: string[] } {
  if (!allowedValues || allowedValues.length === 0) {
    return {
      matches: true,
      reasons: [`${label} has no restriction`],
    };
  }

  if (!currentValues || currentValues.length === 0) {
    return {
      matches: false,
      reasons: [`${label} is required by restriction`],
    };
  }

  for (const currentValue of currentValues) {
    if (allowedValues.includes(currentValue)) {
      return {
        matches: true,
        reasons: [`${label} ${currentValue} matches restriction`],
      };
    }
  }

  return {
    matches: false,
    reasons: [`${label} values do not match restriction`],
  };
}

function matchPathRestriction(
  patterns: string[] | undefined,
  currentPaths: string[] | undefined,
): { matches: boolean; reasons: string[] } {
  if (!patterns || patterns.length === 0) {
    return {
      matches: true,
      reasons: ['path has no restriction'],
    };
  }

  if (!currentPaths || currentPaths.length === 0) {
    return {
      matches: false,
      reasons: ['path is required by appliesTo.paths'],
    };
  }

  for (const currentPath of currentPaths) {
    const normalizedPath = normalizePath(currentPath);

    for (const pattern of patterns) {
      if (matchesGlob(normalizedPath, normalizePath(pattern))) {
        return {
          matches: true,
          reasons: [`path ${normalizedPath} matches appliesTo.paths`],
        };
      }
    }
  }

  return {
    matches: false,
    reasons: ['path values do not match appliesTo.paths'],
  };
}

function toIncluded(candidate: SkillCandidate): ResolvedSkill {
  const skill = candidate.skill;
  const estimatedTokens = estimateTokens(skill.body);
  const reasons = [
    'status active',
    ...candidate.reasons,
    `loadMode ${skill.loadMode} is included in active context`,
  ];

  return {
    id: skill.id,
    kind: skill.kind,
    title: skill.title,
    summary: skill.summary,
    body: skill.body,
    scope: skill.scope,
    category: skill.category,
    severity: skill.severity,
    loadMode: skill.loadMode,
    version: skill.version,
    sourceFile: skill.sourceFile,
    estimatedTokens,
    includeReason: reasons[reasons.length - 1],
    reasons,
  };
}

function toAvailable(candidate: SkillCandidate): AvailableSkill {
  const skill = candidate.skill;

  return {
    id: skill.id,
    kind: skill.kind,
    title: skill.title,
    summary: skill.summary,
    body: skill.body,
    scope: skill.scope,
    category: skill.category,
    severity: skill.severity,
    loadMode: skill.loadMode,
    version: skill.version,
    sourceFile: skill.sourceFile,
    entrypoint: skill.entrypoint,
    resources: skill.resources,
    resourceFiles: skill.resourceFiles,
    reasons: [
      'status active',
      ...candidate.reasons,
      skill.kind === 'rule'
        ? `loadMode ${skill.loadMode} is available through skill index`
        : `kind ${skill.kind} is available through skill index`,
    ],
  };
}

function toSkipped(skill: RegistryMaterial, reasons: string[]): SkippedSkill {
  return {
    id: skill.id,
    title: skill.title,
    reason: reasons[reasons.length - 1] || 'skipped',
    reasons,
  };
}

function compareResolvedSkills(left: ResolvedSkill, right: ResolvedSkill): number {
  return compareSkillOrder(left, right);
}

function compareAvailableSkills(left: AvailableSkill, right: AvailableSkill): number {
  return compareSkillOrder(left, right);
}

function compareSkillOrder(
  left: Pick<ResolvedSkill, 'scope' | 'severity' | 'category' | 'id'>,
  right: Pick<ResolvedSkill, 'scope' | 'severity' | 'category' | 'id'>,
): number {
  const scopeCompare = scopeOrder[left.scope] - scopeOrder[right.scope];

  if (scopeCompare !== 0) {
    return scopeCompare;
  }

  const severityCompare = severityOrder(left.severity) - severityOrder(right.severity);

  if (severityCompare !== 0) {
    return severityCompare;
  }

  const categoryCompare = left.category.localeCompare(right.category);

  if (categoryCompare !== 0) {
    return categoryCompare;
  }

  return left.id.localeCompare(right.id);
}

function severityOrder(severity: ResolvedSkill['severity']): number {
  return severity === 'required' ? 0 : 1;
}

function getStatusWarnings(skill: RegistryMaterial): ComposerWarning[] {
  if (skill.status === 'deprecated') {
    return [
      {
        code: 'deprecated_skill_found',
        message: `Deprecated skill "${skill.id}" was found and skipped.`,
        skillId: skill.id,
      },
    ];
  }

  if (skill.status === 'disabled') {
    return [
      {
        code: 'disabled_skill_found',
        message: `Disabled skill "${skill.id}" was found and skipped.`,
        skillId: skill.id,
      },
    ];
  }

  if (skill.status === 'draft') {
    return [
      {
        code: 'draft_skill_found',
        message: `Draft skill "${skill.id}" was found and skipped.`,
        skillId: skill.id,
      },
    ];
  }

  return [];
}

function getMatchWarnings(
  skill: RegistryMaterial,
  context: ResolveContext,
  reasons: string[],
): ComposerWarning[] {
  const appliesTo = skill.appliesTo;

  if (
    listMatches(appliesTo.projects, context.project) &&
    appliesTo.agents &&
    appliesTo.agents.length > 0 &&
    !appliesTo.agents.includes(context.agent)
  ) {
    return [
      {
        code: 'skill_matches_project_but_not_agent',
        message: `Skill "${skill.id}" matches project context but not agent "${context.agent}".`,
        skillId: skill.id,
      },
    ];
  }

  void reasons;
  return [];
}

function getSizeWarnings(skill: RegistryMaterial): ComposerWarning[] {
  if ((skill.kind === 'reference' || skill.loadMode === 'reference') && estimateTokens(skill.body) > 8000) {
    return [
      {
        code: 'reference_too_large',
        message: `Reference "${skill.id}" is estimated to be very large.`,
        skillId: skill.id,
      },
    ];
  }

  return [];
}

function listMatches(allowedValues: string[] | undefined, currentValue: string | undefined): boolean {
  if (!allowedValues || allowedValues.length === 0) {
    return true;
  }

  return currentValue !== undefined && allowedValues.includes(currentValue);
}

function createManifest(
  context: ResolveContext,
  included: ResolvedSkill[],
  available: AvailableSkill[],
  estimatedTokens: number,
): ResolveManifest {
  const manifestSkills = included.map((skill) => ({
    id: skill.id,
    version: skill.version,
    sourceFile: skill.sourceFile,
  }));
  const availableSkills = available.map((skill) => ({
    id: skill.id,
    version: skill.version,
    sourceFile: skill.sourceFile,
  }));

  return {
    project: context.project,
    agent: context.agent,
    taskType: context.taskType,
    included: manifestSkills,
    available: availableSkills,
    estimatedTokens,
    checksum: stableHash(JSON.stringify({
      context,
      included: manifestSkills,
      available: availableSkills,
    })),
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function matchesGlob(value: string, pattern: string): boolean {
  const regex = new RegExp(`^${escapeRegex(pattern).replace(/\\\*\\\*/g, '.*').replace(/\\\*/g, '[^/]*')}$`);
  return regex.test(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.*]/g, '\\$&');
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return leftPad((hash >>> 0).toString(16), 8, '0');
}

function leftPad(value: string, targetLength: number, fill: string): string {
  let result = value;

  while (result.length < targetLength) {
    result = fill + result;
  }

  return result;
}
