import { AppliesTo, RegistryMaterial, ValidationIssue } from './types';

interface RuleDirective {
  polarity: 'positive' | 'negative';
  subject: string;
}

const restrictionFieldByScope: Partial<Record<RegistryMaterial['scope'], keyof AppliesTo>> = {
  project: 'projects',
  directory: 'paths',
  taskType: 'taskTypes',
};

const bundledResourceDirectories = [
  'references',
  'scripts',
  'evals',
  'assets',
  'agents',
];

export interface RegistryReviewResult {
  materialsChecked: number;
  issues: ValidationIssue[];
}

/**
 * Выполняет детерминированные проверки качества registry materials.
 *
 * Проверки не пытаются заменить агентный review: они выявляют повторяемые
 * структурные и семантические проблемы до публикации registry.
 */
export function reviewRegistryMaterials(
  materials: RegistryMaterial[],
): RegistryReviewResult {
  const sortedMaterials = [...materials].sort((left, right) => (
    left.sourceFile.localeCompare(right.sourceFile)
  ));
  const issues = [
    ...findMaterialLayoutIssues(sortedMaterials),
    ...findLoadModeIssues(sortedMaterials),
    ...findScopeRestrictionIssues(sortedMaterials),
    ...findRuleWorkflowIssues(sortedMaterials),
    ...findDuplicateMaterialContentIssues(sortedMaterials),
    ...findConflictingRuleIssues(sortedMaterials),
    ...findMissingSkillResourceIssues(sortedMaterials),
  ];

  return {
    materialsChecked: sortedMaterials.length,
    issues: sortIssues(issues),
  };
}

function findMaterialLayoutIssues(materials: RegistryMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const material of materials) {
    const expectedKind = getExpectedKindForPath(material.sourceFile);

    if (!expectedKind) {
      issues.push({
        severity: 'error',
        code: 'material_outside_registry_structure',
        message: `Material "${material.id}" must be placed in rules/, references/, or skills/<name>/material.md.`,
        sourceFile: material.sourceFile,
      });
      continue;
    }

    if (material.kind !== expectedKind) {
      issues.push({
        severity: 'error',
        code: 'material_path_kind_mismatch',
        message: `Material "${material.id}" has kind "${material.kind}" but its path requires kind "${expectedKind}".`,
        sourceFile: material.sourceFile,
        field: 'kind',
      });
    }
  }

  return issues;
}

function findLoadModeIssues(materials: RegistryMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const material of materials) {
    if (material.kind === 'reference' && material.loadMode !== 'reference') {
      issues.push({
        severity: 'error',
        code: 'reference_in_active_context',
        message: `Reference "${material.id}" must use loadMode "reference" and must not enter active context.`,
        sourceFile: material.sourceFile,
        field: 'loadMode',
      });
    }

    if (
      material.kind === 'skill'
      && material.loadMode !== 'onDemand'
      && material.loadMode !== 'task'
    ) {
      issues.push({
        severity: 'warning',
        code: 'skill_unexpected_load_mode',
        message: `Skill "${material.id}" usually uses loadMode "onDemand" or "task"; found "${material.loadMode}".`,
        sourceFile: material.sourceFile,
        field: 'loadMode',
      });
    }
  }

  return issues;
}

function findScopeRestrictionIssues(materials: RegistryMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const material of materials) {
    const requiredField = restrictionFieldByScope[material.scope];

    if (!requiredField || hasValues(material.appliesTo[requiredField])) {
      continue;
    }

    issues.push({
      severity: 'warning',
      code: 'scope_without_applies_to_restriction',
      message: `Scope "${material.scope}" does not constrain Composer selection. Add appliesTo.${requiredField} to prevent "${material.id}" from applying too broadly.`,
      sourceFile: material.sourceFile,
      field: `appliesTo.${requiredField}`,
    });
  }

  return issues;
}

function findRuleWorkflowIssues(materials: RegistryMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const material of materials) {
    if (material.kind !== 'rule' || !looksLikeWorkflow(material.body)) {
      continue;
    }

    issues.push({
      severity: 'warning',
      code: 'rule_looks_like_workflow',
      message: `Rule "${material.id}" looks like a multi-step workflow. Consider moving it to a skill with loadMode "onDemand" or "task".`,
      sourceFile: material.sourceFile,
      field: 'kind',
    });
  }

  return issues;
}

function findDuplicateMaterialContentIssues(
  materials: RegistryMaterial[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, RegistryMaterial>();

  for (const material of materials) {
    const normalizedBody = normalizeReviewText(material.body);

    if (normalizedBody.length < 20) {
      continue;
    }

    const key = `${material.kind}:${normalizedBody}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, material);
      continue;
    }

    issues.push({
      severity: 'warning',
      code: 'duplicate_material_content',
      message: `Material "${material.id}" duplicates the body of "${existing.id}". Combine the materials or make their scopes explicit.`,
      sourceFile: material.sourceFile,
      field: 'body',
    });
  }

  return issues;
}

function findConflictingRuleIssues(materials: RegistryMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rules = materials.filter((material) => material.kind === 'rule');

  for (let leftIndex = 0; leftIndex < rules.length; leftIndex += 1) {
    const left = rules[leftIndex];
    const leftDirectives = getRuleDirectives(left.body);

    if (leftDirectives.length === 0) {
      continue;
    }

    for (let rightIndex = leftIndex + 1; rightIndex < rules.length; rightIndex += 1) {
      const right = rules[rightIndex];

      if (
        left.scope !== right.scope
        || left.category !== right.category
        || !haveOverlappingAppliesTo(left.appliesTo, right.appliesTo)
      ) {
        continue;
      }

      const rightDirectives = getRuleDirectives(right.body);
      const conflictingDirective = leftDirectives.find((leftDirective) => (
        rightDirectives.some((rightDirective) => (
          leftDirective.subject === rightDirective.subject
          && leftDirective.polarity !== rightDirective.polarity
        ))
      ));

      if (!conflictingDirective) {
        continue;
      }

      issues.push({
        severity: 'error',
        code: 'conflicting_rule_directive',
        message: `Rules "${left.id}" and "${right.id}" give opposing instructions for "${conflictingDirective.subject}" in an overlapping context. Narrow, merge, or rewrite them.`,
        sourceFile: right.sourceFile,
        field: 'body',
      });
    }
  }

  return issues;
}

function findMissingSkillResourceIssues(materials: RegistryMaterial[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const material of materials) {
    if (material.kind !== 'skill') {
      continue;
    }

    const resourcePaths = new Set(
      (material.resourceFiles || []).map((resource) => (
        normalizeResourcePath(resource.relativePath)
      )),
    );

    for (const target of extractMarkdownLinkTargets(material.body)) {
      const resourcePath = normalizeResourcePath(target);

      if (!isBundledResourcePath(resourcePath) || resourcePaths.has(resourcePath)) {
        continue;
      }

      issues.push({
        severity: 'error',
        code: 'missing_skill_resource',
        message: `Skill "${material.id}" links to bundled resource "${resourcePath}", but that file was not found.`,
        sourceFile: material.sourceFile,
        field: 'body',
      });
    }
  }

  return issues;
}

function getExpectedKindForPath(
  sourceFile: string,
): RegistryMaterial['kind'] | undefined {
  const normalizedPath = sourceFile.replace(/\\/g, '/');

  if (normalizedPath.startsWith('rules/')) {
    return 'rule';
  }

  if (normalizedPath.startsWith('references/')) {
    return 'reference';
  }

  if (/^skills\/[^/]+(?:\/[^/]+)*\/material\.md$/.test(normalizedPath)) {
    return 'skill';
  }

  return undefined;
}

function hasValues(values: string[] | undefined): values is string[] {
  return values !== undefined && values.length > 0;
}

function looksLikeWorkflow(body: string): boolean {
  if (/^#{1,6}\s+(workflow|процесс|порядок действий)\b/im.test(body)) {
    return true;
  }

  return (body.match(/^\s*\d+\.\s+/gm) || []).length >= 3;
}

function normalizeReviewText(value: string): string {
  return value
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getRuleDirectives(body: string): RuleDirective[] {
  const directives: RuleDirective[] = [];

  for (const rawLine of body.split('\n')) {
    const line = rawLine
      .trim()
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '');
    const negativeMatch = line.match(
      /^(?:не\s+используй|не\s+использовать|запрещено\s+использовать|avoid|do not use|don't use)\s+(.+)$/i,
    );

    if (negativeMatch) {
      addDirective(directives, 'negative', negativeMatch[1]);
      continue;
    }

    const positiveMatch = line.match(
      /^(?:используй|использовать|предпочитай|use|prefer)\s+(.+)$/i,
    );

    if (positiveMatch) {
      addDirective(directives, 'positive', positiveMatch[1]);
    }
  }

  return directives;
}

function addDirective(
  directives: RuleDirective[],
  polarity: RuleDirective['polarity'],
  rawSubject: string,
): void {
  const subject = normalizeDirectiveSubject(rawSubject);

  if (
    subject.length < 3
    || directives.some((directive) => (
      directive.polarity === polarity && directive.subject === subject
    ))
  ) {
    return;
  }

  directives.push({ polarity, subject });
}

function normalizeDirectiveSubject(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`"'«»]/g, '')
    .replace(/[.!;:]+$/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function haveOverlappingAppliesTo(left: AppliesTo, right: AppliesTo): boolean {
  const fields: Array<keyof AppliesTo> = [
    'projects',
    'agents',
    'taskTypes',
    'paths',
    'technologies',
  ];

  for (const field of fields) {
    const leftValues = left[field];
    const rightValues = right[field];

    if (!hasValues(leftValues) || !hasValues(rightValues)) {
      continue;
    }

    if (!leftValues.some((value) => rightValues.includes(value))) {
      return false;
    }
  }

  return true;
}

function extractMarkdownLinkTargets(body: string): string[] {
  const targets: string[] = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
  let match = pattern.exec(body);

  while (match) {
    targets.push(match[1]);
    match = pattern.exec(body);
  }

  return targets;
}

function normalizeResourcePath(value: string): string {
  let normalized = value.trim().split(/\s+/)[0].replace(/^<|>$/g, '');
  const queryOrAnchorIndex = normalized.search(/[?#]/);

  if (queryOrAnchorIndex !== -1) {
    normalized = normalized.slice(0, queryOrAnchorIndex);
  }

  normalized = normalized.replace(/\\/g, '/');

  while (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }

  return normalized;
}

function isBundledResourcePath(value: string): boolean {
  return bundledResourceDirectories.some((directory) => (
    value.startsWith(`${directory}/`)
  ));
}

function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return [...issues].sort((left, right) => {
    const severityOrder = issueSeverityOrder(left) - issueSeverityOrder(right);

    if (severityOrder !== 0) {
      return severityOrder;
    }

    const sourceFileOrder = (left.sourceFile || '').localeCompare(right.sourceFile || '');

    if (sourceFileOrder !== 0) {
      return sourceFileOrder;
    }

    return left.code.localeCompare(right.code);
  });
}

function issueSeverityOrder(issue: ValidationIssue): number {
  return issue.severity === 'error' ? 0 : 1;
}
