import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parseMarkdownWithFrontmatter } from './frontmatter';
import { RegistryProvider } from './provider';
import { ReadRegistryResult, RegistryMaterial, ValidationIssue } from './types';
import { findDuplicateSkillIssues, normalizeSkill } from './validation';

export class FileRegistryProvider implements RegistryProvider {
  readonly type = 'file' as const;

  constructor(private readonly registryRoot: string) {}

  readRegistry(): ReadRegistryResult {
    const issues: ValidationIssue[] = [];
    const skills: RegistryMaterial[] = [];

    if (!existsSync(this.registryRoot)) {
      return {
        materials: skills,
        skills,
        issues: [
          {
            severity: 'error',
            code: 'registry_root_not_found',
            message: `Registry root was not found: ${this.registryRoot}`,
          },
        ],
      };
    }

    if (!statSync(this.registryRoot).isDirectory()) {
      return {
        materials: skills,
        skills,
        issues: [
          {
            severity: 'error',
            code: 'registry_root_not_directory',
            message: `Registry root is not a directory: ${this.registryRoot}`,
          },
        ],
      };
    }

    for (const filePath of findMaterialFiles(this.registryRoot)) {
      const sourceFile = normalizeRelativePath(relative(this.registryRoot, filePath));

      try {
        const skillResources = isDirectorySkillEntrypoint(sourceFile)
          ? findSkillResources(this.registryRoot, dirname(sourceFile))
          : undefined;
        const content = readFileSync(filePath, 'utf8');
        const parsed = parseMarkdownWithFrontmatter(content);
        const result = normalizeSkill({
          frontmatter: parsed.frontmatter,
          body: parsed.body,
          sourceFile,
          entrypoint: isDirectorySkillEntrypoint(sourceFile) ? sourceFile : undefined,
          resources: skillResources?.resources,
          resourceFiles: skillResources?.resourceFiles,
        });

        issues.push(...result.issues);

        if (result.skill) {
          skills.push(result.skill);
        }
      } catch (error) {
        issues.push({
          severity: 'error',
          code: 'skill_parse_failed',
          message: error instanceof Error ? error.message : String(error),
          sourceFile,
        });
      }
    }

    issues.push(...findDuplicateSkillIssues(skills));

    return {
      materials: skills.sort((left, right) => left.id.localeCompare(right.id)),
      skills: skills.sort((left, right) => left.id.localeCompare(right.id)),
      issues,
    };
  }
}

function findMaterialFiles(root: string, relativeDir = ''): string[] {
  const result: string[] = [];

  for (const entry of readdirSync(join(root, relativeDir), { withFileTypes: true })) {
    const childRelativePath = normalizeRelativePath(join(relativeDir, entry.name));
    const fullPath = join(root, childRelativePath);

    if (entry.isDirectory()) {
      if (!isBundledSkillResourceDir(childRelativePath)) {
        result.push(...findMaterialFiles(root, childRelativePath));
      }
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      result.push(fullPath);
    }
  }

  return result.sort((left, right) => left.localeCompare(right));
}

function findSkillResources(registryRoot: string, skillDir: string) {
  const resourceDirs = ['references', 'scripts', 'evals', 'assets', 'agents'] as const;
  const resources: Record<string, string[]> = {};
  const resourceFiles: Array<{ sourceFile: string; relativePath: string; content: string }> = [];

  for (const resourceDir of resourceDirs) {
    const relativeResourceDir = normalizeRelativePath(join(skillDir, resourceDir));
    const absoluteResourceDir = join(registryRoot, relativeResourceDir);

    if (!existsSync(absoluteResourceDir) || !statSync(absoluteResourceDir).isDirectory()) {
      continue;
    }

    const files = findFiles(absoluteResourceDir)
      .map((filePath) => normalizeRelativePath(relative(registryRoot, filePath)))
      .sort((left, right) => left.localeCompare(right));

    if (files.length > 0) {
      resources[resourceDir] = files;

      for (const file of files) {
        resourceFiles.push({
          sourceFile: file,
          relativePath: normalizeRelativePath(relative(skillDir, file)),
          content: readFileSync(join(registryRoot, file), 'utf8'),
        });
      }
    }
  }

  return Object.keys(resources).length > 0
    ? { resources, resourceFiles }
    : undefined;
}

function findFiles(root: string): string[] {
  const result: string[] = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);

    if (entry.isDirectory()) {
      result.push(...findFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      result.push(fullPath);
    }
  }

  return result;
}

function isDirectorySkillEntrypoint(sourceFile: string): boolean {
  return /^skills\/[^/]+(?:\/[^/]+)*\/material\.md$/.test(sourceFile);
}

function isBundledSkillResourceDir(relativePath: string): boolean {
  return /^skills\/[^/]+(?:\/[^/]+)*\/(references|scripts|evals|assets|agents)(?:\/|$)/.test(relativePath);
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, '/');
}
