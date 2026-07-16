import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import {
  AvailableSkill,
  ResolveResult,
  ResolvedSkill,
} from '../composer/types';
import { renderSkillIndex } from './codex/renderer';
import { GeneratedFile } from './codex/types';
import { AgentAdapter } from './types';
import { writeGeneratedFiles } from './writer';

const bootstrapRequiredCategories = [
  'communication',
  'git',
  'general',
  'verification',
  'dependencies',
  'security',
];

export type NativeRuleFormat = 'claude' | 'cursor' | 'github-copilot';

export interface NativeAgentOutput {
  rulesDir: string;
  skillsDir: string;
  skillIndexPath: string;
  ruleFormat: NativeRuleFormat;
}

export interface NativeAdapterInput {
  resolveResult: ResolveResult;
  output: NativeAgentOutput;
}

export interface NativeGeneratedFiles {
  ruleFiles: GeneratedFile[];
  skillIndex: GeneratedFile;
  skillFiles: GeneratedFile[];
  files: GeneratedFile[];
}

export interface NativeAgentDefinition {
  id: string;
  displayName: string;
  output: NativeAgentOutput;
}

export function createNativeAgentAdapter(
  definition: NativeAgentDefinition,
): AgentAdapter {
  const requiredRulePath = getNativeRulePath(definition.output, 'required');

  return {
    id: definition.id,
    displayName: definition.displayName,
    managedPaths: [
      definition.output.rulesDir,
      definition.output.skillsDir,
      definition.output.skillIndexPath,
    ],
    statusPaths: [requiredRulePath, definition.output.skillIndexPath],
    skillIndexPath: definition.output.skillIndexPath,
    generateFiles: (resolveResult) => generateNativeFiles({
      resolveResult,
      output: definition.output,
    }).files,
    writeFiles: (projectRoot, resolveResult) => writeNativeFiles({
      projectRoot,
      resolveResult,
      output: definition.output,
    }),
  };
}

export function generateNativeFiles(input: NativeAdapterInput): NativeGeneratedFiles {
  const ruleFiles = createRuleFiles(input.resolveResult, input.output);
  const skillFiles = createSkillFiles(input.resolveResult, input.output.skillsDir);
  const skillIndex: GeneratedFile = {
    relativePath: normalizeRelativePath(input.output.skillIndexPath),
    content: renderSkillIndex(input.resolveResult, ruleFiles, skillFiles),
  };

  return {
    ruleFiles,
    skillIndex,
    skillFiles,
    files: [...ruleFiles, skillIndex, ...skillFiles],
  };
}

export function writeNativeFiles(
  input: NativeAdapterInput & { projectRoot: string },
): GeneratedFile[] {
  cleanNativeOutput(input.projectRoot, input.output);
  return writeGeneratedFiles(input.projectRoot, generateNativeFiles(input).files);
}

export function getNativeRulePath(
  output: NativeAgentOutput,
  category: string,
): string {
  const extension = output.ruleFormat === 'cursor'
    ? '.mdc'
    : '.instructions.md';
  const name = output.ruleFormat === 'claude'
    ? `${category}.md`
    : `agentsync-${category}${extension}`;

  return normalizeRelativePath(join(output.rulesDir, name));
}

function createRuleFiles(
  resolveResult: ResolveResult,
  output: NativeAgentOutput,
): GeneratedFile[] {
  const groups = new Map<string, ResolvedSkill[]>();
  const requiredSkills = resolveResult.included.filter((skill) => (
    skill.severity === 'required' &&
    bootstrapRequiredCategories.includes(skill.category)
  ));
  const requiredIds = new Set(requiredSkills.map((skill) => skill.id));

  for (const skill of resolveResult.included) {
    if (requiredIds.has(skill.id)) {
      continue;
    }

    const current = groups.get(skill.category) || [];
    current.push(skill);
    groups.set(skill.category, current);
  }

  const files: GeneratedFile[] = [
    {
      relativePath: getNativeRulePath(output, 'required'),
      content: renderRuleFile(output.ruleFormat, 'required', requiredSkills),
    },
  ];

  for (const category of Array.from(groups.keys()).sort()) {
    files.push({
      relativePath: getNativeRulePath(output, category),
      content: renderRuleFile(
        output.ruleFormat,
        category,
        groups.get(category) || [],
      ),
    });
  }

  return files;
}

function createSkillFiles(
  resolveResult: ResolveResult,
  skillsDir: string,
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const skill of resolveResult.available) {
    if (skill.kind !== 'skill') {
      continue;
    }

    const skillDir = getSkillOutputDirName(skill);

    if (!skillDir) {
      continue;
    }

    const outputSkillDir = `agentsync-${skillDir}`;
    const outputDir = normalizeRelativePath(join(skillsDir, outputSkillDir));
    files.push({
      relativePath: normalizeRelativePath(join(outputDir, 'SKILL.md')),
      content: renderAgentSkill(skill, outputSkillDir),
    });

    for (const resourceFile of skill.resourceFiles || []) {
      if (!isSafeSkillRelativePath(resourceFile.relativePath)) {
        continue;
      }

      files.push({
        relativePath: normalizeRelativePath(join(outputDir, resourceFile.relativePath)),
        content: normalizeNewlines(resourceFile.content),
      });
    }
  }

  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function renderRuleFile(
  format: NativeRuleFormat,
  category: string,
  skills: ResolvedSkill[],
): string {
  const title = category === 'required'
    ? 'AgentSync required rules'
    : `AgentSync ${category} rules`;
  const sections = skills
    .map((skill) => renderRuleSection(skill))
    .join('\n\n');
  const body = normalizeNewlines(`<!-- Generated by ai-skills. Do not edit manually; run ai-skills sync. -->

# ${title}

${sections || 'No rules were resolved for this category.'}
`);

  if (format === 'claude') {
    return body;
  }

  if (format === 'cursor') {
    const description = category === 'required'
      ? 'AgentSync bootstrap rules. Always apply these instructions.'
      : `AgentSync ${category} rules. Apply when they are relevant to the task.`;

    return normalizeNewlines(`---
description: ${JSON.stringify(description)}
alwaysApply: ${category === 'required' ? 'true' : 'false'}
---

${body}`);
  }

  return normalizeNewlines(`---
applyTo: "**"
---

${body}`);
}

function renderRuleSection(skill: ResolvedSkill): string {
  return `## ${skill.title}

Metadata: \`${skill.id}@${skill.version}\`, category: \`${skill.category}\`, severity: \`${skill.severity}\`

${skill.body.trim()}`;
}

function renderAgentSkill(skill: AvailableSkill, name: string): string {
  return normalizeNewlines(`---
name: ${name}
description: ${JSON.stringify(skill.summary)}
---

${skill.body.trim()}
`);
}

function getSkillOutputDirName(skill: AvailableSkill): string | undefined {
  const match = skill.entrypoint?.match(/^skills\/(.+)\/material\.md$/);

  return match?.[1];
}

function isSafeSkillRelativePath(relativePath: string): boolean {
  return (
    normalizeRelativePath(relativePath) === relativePath &&
    relativePath !== '' &&
    !relativePath.startsWith('/') &&
    !relativePath.startsWith('../') &&
    !relativePath.includes('/../')
  );
}

function cleanNativeOutput(projectRoot: string, output: NativeAgentOutput): void {
  cleanGeneratedRules(projectRoot, output);
  cleanGeneratedSkillDirectories(projectRoot, output);
}

function cleanGeneratedRules(projectRoot: string, output: NativeAgentOutput): void {
  const rulesDir = resolveManagedPath(projectRoot, output.rulesDir);

  if (!rulesDir || !existsSync(rulesDir)) {
    return;
  }

  if (output.ruleFormat === 'claude') {
    rmSync(rulesDir, { recursive: true, force: true });
    return;
  }

  for (const entry of readdirSync(rulesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !isGeneratedNativeRuleName(entry.name, output.ruleFormat)) {
      continue;
    }

    rmSync(join(rulesDir, entry.name), { force: true });
  }
}

function cleanGeneratedSkillDirectories(
  projectRoot: string,
  output: NativeAgentOutput,
): void {
  const indexPath = resolveManagedPath(projectRoot, output.skillIndexPath);
  const skillsDir = resolveManagedPath(projectRoot, output.skillsDir);

  if (!indexPath || !skillsDir || !existsSync(indexPath)) {
    return;
  }

  const generatedSkillFiles = readGeneratedSkillFiles(indexPath);
  const skillPrefix = normalizeRelativePath(output.skillsDir).replace(/\/$/, '') + '/';
  const generatedSkillDirs = new Set<string>();

  for (const generatedFile of generatedSkillFiles) {
    const normalizedFile = normalizeRelativePath(generatedFile);

    if (!normalizedFile.startsWith(skillPrefix)) {
      continue;
    }

    const skillDir = normalizedFile.slice(skillPrefix.length).split('/')[0];

    if (!skillDir || !skillDir.startsWith('agentsync-') || !isSafePathSegment(skillDir)) {
      continue;
    }

    generatedSkillDirs.add(skillDir);
  }

  for (const skillDir of generatedSkillDirs) {
    rmSync(join(skillsDir, skillDir), { recursive: true, force: true });
  }
}

function readGeneratedSkillFiles(indexPath: string): string[] {
  try {
    const value = JSON.parse(readFileSync(indexPath, 'utf8')) as {
      generatedSkillFiles?: unknown;
    };

    return Array.isArray(value.generatedSkillFiles)
      ? value.generatedSkillFiles.filter((file): file is string => typeof file === 'string')
      : [];
  } catch {
    return [];
  }
}

function isGeneratedNativeRuleName(
  name: string,
  format: Exclude<NativeRuleFormat, 'claude'>,
): boolean {
  if (!name.startsWith('agentsync-')) {
    return false;
  }

  return format === 'cursor'
    ? name.endsWith('.mdc')
    : name.endsWith('.instructions.md');
}

function resolveManagedPath(projectRootValue: string, relativePath: string): string | undefined {
  if (isAbsolute(relativePath)) {
    return undefined;
  }

  const projectRoot = resolve(projectRootValue);
  const absolutePath = resolve(join(projectRoot, relativePath));
  const relativePathFromRoot = relative(projectRoot, absolutePath);

  if (
    relativePathFromRoot === '' ||
    relativePathFromRoot.startsWith('..') ||
    isAbsolute(relativePathFromRoot)
  ) {
    return undefined;
  }

  return absolutePath;
}

function isSafePathSegment(value: string): boolean {
  return value !== '.' && value !== '..' && !value.includes('\\') && !value.includes('/');
}

function normalizeNewlines(value: string): string {
  return `${value.replace(/\r\n/g, '\n').trim()}\n`;
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, '/');
}
