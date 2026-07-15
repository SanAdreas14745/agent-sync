#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { explainSkill, resolveSkills } from './composer/resolver';
import { ResolveContext } from './composer/types';
import { generateCodexFiles } from './adapters/codex/renderer';
import { codexDefaultOutput } from './adapters/codex/types';
import { writeCodexFiles } from './adapters/codex/writer';
import { readProjectConfig } from './registry/project-config';
import { readRegistry } from './registry/reader';
import { ProjectConfig, ValidationIssue } from './registry/types';

interface CliOptions {
  agent?: string;
  taskType?: string;
  projectRoot?: string;
  dryRun: boolean;
  paths: string[];
  technologies: string[];
}

interface ParsedArgs {
  command?: string;
  positional: string[];
  options: CliOptions;
}

interface Workspace {
  projectRoot: string;
  config: ProjectConfig;
  registryPath: string;
  agent: string;
}

main(process.argv.slice(2));

function main(argv: string[]): void {
  const parsed = parseArgs(argv);

  if (!parsed.command || parsed.command === 'help' || parsed.optionsHelp) {
    printHelp();
    return;
  }

  try {
    const exitCode = runCommand(parsed);
    process.exitCode = exitCode;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function runCommand(parsed: ParsedArgs): number {
  switch (parsed.command) {
    case 'sync':
      return syncCommand(parsed.options);
    case 'status':
      return statusCommand(parsed.options);
    case 'check':
      return checkCommand(parsed.options);
    case 'info':
      return infoCommand(parsed.options, parsed.positional[0]);
    default:
      console.error(`Unknown command: ${parsed.command}`);
      printHelp();
      return 1;
  }
}

function syncCommand(options: CliOptions): number {
  const workspace = loadWorkspace(options);

  if (!workspace) {
    return 1;
  }

  const registry = readRegistry(workspace.registryPath);

  if (printIssues(registry.issues)) {
    return 1;
  }

  const output = getAgentOutput(workspace.agent);

  if (!output) {
    console.error(`No output defaults for agent "${workspace.agent}".`);
    return 1;
  }

  const resolveResult = resolveSkills(
    registry.skills,
    createResolveContext(workspace, options),
  );

  if (options.dryRun) {
    const generated = generateCodexFiles({ resolveResult, output });
    printResolved(resolveResult.included.map((skill) => `${skill.id}@${skill.version}`));
    console.log('');
    console.log('Would generate:');

    for (const file of generated.files) {
      console.log(`- ${file.relativePath}`);
    }
  } else {
    const files = writeCodexFiles({
      projectRoot: workspace.projectRoot,
      resolveResult,
      output,
    });

    printResolved(resolveResult.included.map((skill) => `${skill.id}@${skill.version}`));
    console.log('');
    console.log('Generated:');

    for (const file of files) {
      console.log(`- ${file.relativePath}`);
    }
  }

  printWarnings(resolveResult.warnings);
  return 0;
}

function statusCommand(options: CliOptions): number {
  const workspace = loadWorkspace(options);

  if (!workspace) {
    return 1;
  }

  const output = getAgentOutput(workspace.agent);

  if (!output) {
    console.error(`No output defaults for agent "${workspace.agent}".`);
    return 1;
  }

  const indexPath = join(workspace.projectRoot, output.generatedDir, 'skill-index.json');

  console.log(`Project: ${workspace.config.project}`);
  console.log(`Agent: ${workspace.agent}`);
  console.log('');
  console.log('Generated files:');
  printFileStatus(workspace.projectRoot, output.entry);
  printFileStatus(workspace.projectRoot, join(output.generatedDir, 'active-rules.md'));
  printFileStatus(workspace.projectRoot, join(output.generatedDir, 'rule-scope.md'));
  printFileStatus(workspace.projectRoot, join(output.generatedDir, 'skill-index.json'));

  if (!existsSync(indexPath)) {
    console.log('');
    console.log('No generated skill index found. Run `ai-skills sync` first.');
    return 0;
  }

  const index = JSON.parse(readFileSync(indexPath, 'utf8')) as {
    included?: Array<{ id: string; version: number }>;
    available?: Array<{ id: string; version: number }>;
    warnings?: unknown[];
    generatedFiles?: string[];
    generatedSkillFiles?: string[];
  };

  console.log('');
  console.log('Included skills:');

  for (const skill of index.included || []) {
    console.log(`- ${skill.id}@${skill.version}`);
  }

  console.log('');
  console.log(`Available optional/reference materials: ${(index.available || []).length}`);
  console.log(`Generated rule files: ${(index.generatedFiles || []).length}`);
  console.log(`Generated skill files: ${(index.generatedSkillFiles || []).length}`);
  console.log(`Warnings: ${(index.warnings || []).length}`);
  return 0;
}

function checkCommand(options: CliOptions): number {
  const projectRoot = resolve(options.projectRoot || process.cwd());
  const configPath = join(projectRoot, '.ai-skills.json');
  let hasErrors = false;

  if (!existsSync(configPath)) {
    console.log(`ERROR .ai-skills.json not found at ${configPath}`);
    return 1;
  }

  console.log('OK    project config found');
  const configResult = readProjectConfig(configPath);

  if (printIssues(configResult.issues)) {
    hasErrors = true;
  } else {
    console.log('OK    project config is valid');
  }

  if (!configResult.config) {
    return 1;
  }

  const workspace = createWorkspace(projectRoot, configResult.config, options);

  if (!existsSync(workspace.registryPath)) {
    console.log(`ERROR registry not found: ${workspace.registryPath}`);
    return 1;
  }

  console.log('OK    registry found');
  const registry = readRegistry(workspace.registryPath);

  if (printIssues(registry.issues)) {
    hasErrors = true;
  } else {
    console.log(`OK    ${registry.skills.length} registry items loaded`);
  }

  const output = getAgentOutput(workspace.agent);

  if (!output) {
    console.log(`ERROR no output defaults for agent "${workspace.agent}"`);
    hasErrors = true;
  } else {
    for (const path of [
      output.entry,
      join(output.generatedDir, 'active-rules.md'),
      join(output.generatedDir, 'skill-index.json'),
    ]) {
      if (!isSafeProjectRelativePath(projectRoot, path)) {
        console.log(`ERROR unsafe output path: ${path}`);
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      console.log('OK    output paths are safe');
    }
  }

  if (!hasErrors) {
    const resolveResult = resolveSkills(
      registry.skills,
      createResolveContext(workspace, options),
    );

    if (resolveResult.included.length === 0) {
      console.log('WARN  no active rules resolved for current context');
    } else {
      console.log(`OK    ${resolveResult.included.length} active rules resolved`);
    }

    printWarnings(resolveResult.warnings);
  }

  return hasErrors ? 1 : 0;
}

function infoCommand(options: CliOptions, skillId: string | undefined): number {
  if (!skillId) {
    console.error('Usage: ai-skills info <material-id>');
    return 1;
  }

  const workspace = loadWorkspace(options);

  if (!workspace) {
    return 1;
  }

  const registry = readRegistry(workspace.registryPath);

  if (printIssues(registry.issues)) {
    return 1;
  }

  const resolveResult = resolveSkills(
    registry.skills,
    createResolveContext(workspace, options),
  );
  const explanation = explainSkill(resolveResult, skillId);

  console.log(skillId);
  console.log(`Status: ${explanation.status}`);
  console.log('');
  console.log('Reasons:');

  for (const reason of explanation.reasons) {
    console.log(`- ${reason}`);
  }

  return explanation.status === 'unknown' ? 1 : 0;
}

function loadWorkspace(options: CliOptions): Workspace | undefined {
  const projectRoot = resolve(options.projectRoot || process.cwd());
  const configPath = join(projectRoot, '.ai-skills.json');
  const configResult = readProjectConfig(configPath);

  if (printIssues(configResult.issues) || !configResult.config) {
    return undefined;
  }

  return createWorkspace(projectRoot, configResult.config, options);
}

function createWorkspace(
  projectRoot: string,
  config: ProjectConfig,
  options: CliOptions,
): Workspace {
  return {
    projectRoot,
    config,
    registryPath: resolve(projectRoot, config.registry),
    agent: options.agent || config.agents[0],
  };
}

function createResolveContext(workspace: Workspace, options: CliOptions): ResolveContext {
  return {
    project: workspace.config.project,
    agent: workspace.agent,
    taskType: options.taskType || workspace.config.defaultTaskType,
    paths: options.paths.length > 0 ? options.paths : undefined,
    technologies: options.technologies.length > 0
      ? options.technologies
      : workspace.config.technologies,
  };
}

function getAgentOutput(agent: string) {
  if (agent === 'codex') {
    return codexDefaultOutput;
  }

  return undefined;
}

function parseArgs(argv: string[]): ParsedArgs & { optionsHelp?: boolean } {
  const options: CliOptions = {
    dryRun: false,
    paths: [],
    technologies: [],
  };
  const positional: string[] = [];
  let command: string | undefined;
  let optionsHelp = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!command && !arg.startsWith('-')) {
      command = arg;
      continue;
    }

    switch (arg) {
      case '--help':
      case '-h':
        optionsHelp = true;
        break;
      case '--agent':
        options.agent = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--task-type':
        options.taskType = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--project-root':
        options.projectRoot = requireValue(argv, index, arg);
        index += 1;
        break;
      case '--path':
        options.paths.push(requireValue(argv, index, arg));
        index += 1;
        break;
      case '--technology':
        options.technologies.push(requireValue(argv, index, arg));
        index += 1;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      default:
        positional.push(arg);
        break;
    }
  }

  return {
    command,
    positional,
    options,
    optionsHelp,
  };
}

function requireValue(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];

  if (!value || value.startsWith('-')) {
    throw new Error(`Option ${option} requires a value.`);
  }

  return value;
}

function printResolved(included: string[]): void {
  console.log(`Resolved ${included.length} active rules:`);

  for (const skill of included) {
    console.log(`- ${skill}`);
  }
}

function printWarnings(warnings: Array<{ code: string; message: string }>): void {
  console.log('');
  console.log(`Warnings: ${warnings.length}`);

  for (const warning of warnings) {
    console.log(`WARN  ${warning.code}: ${warning.message}`);
  }
}

function printIssues(issues: ValidationIssue[]): boolean {
  let hasErrors = false;

  for (const issue of issues) {
    const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN ';
    const source = issue.sourceFile ? ` ${issue.sourceFile}` : '';
    const field = issue.field ? ` ${issue.field}` : '';
    console.log(`${prefix} ${issue.code}${source}${field}: ${issue.message}`);

    if (issue.severity === 'error') {
      hasErrors = true;
    }
  }

  return hasErrors;
}

function printFileStatus(projectRoot: string, relativePath: string): void {
  const displayPath = normalizeRelativePath(relativePath);
  const status = existsSync(join(projectRoot, relativePath)) ? 'exists' : 'missing';
  console.log(`- ${displayPath}: ${status}`);
}

function isSafeProjectRelativePath(projectRoot: string, relativePath: string): boolean {
  if (isAbsolute(relativePath)) {
    return false;
  }

  const absolutePath = resolve(join(projectRoot, relativePath));
  const relativePathFromRoot = relative(projectRoot, absolutePath);

  return (
    relativePathFromRoot !== '' &&
    !relativePathFromRoot.startsWith('..') &&
    !isAbsolute(relativePathFromRoot)
  );
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, '/');
}

function printHelp(): void {
  console.log(`ai-skills <command> [options]

Commands:
  sync                 Generate local agent files
  status               Show generated state
  check                Validate project config and registry
  info <material-id>   Show material status in current project context

Options:
  --agent <name>       Agent to resolve, default is first config agent
  --task-type <name>   Current task type
  --project-root <dir> Project root, default is current directory
  --technology <name>  Add current technology context
  --path <path>        Add current changed path context
  --dry-run            Show sync output without writing files
`);
}
