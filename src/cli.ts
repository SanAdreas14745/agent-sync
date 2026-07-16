#!/usr/bin/env node

import {existsSync, readFileSync} from 'node:fs';
import {isAbsolute, join, relative, resolve} from 'node:path';
import {explainSkill, resolveSkills} from './composer/resolver';
import {ResolveContext} from './composer/types';
import {getAgentAdapter, normalizeAgentId} from './adapters/agent-registry';
import {RegistryProvider} from './registry/provider';
import {createRegistryProvider} from './registry/provider-factory';
import {readProjectConfig} from './registry/project-config';
import {reviewRegistryMaterials} from './registry/reviewer';
import {ProjectConfig, ValidationIssue} from './registry/types';

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
  registryPath?: string;
  registryProvider: RegistryProvider;
  agent: string;
}

void main(process.argv.slice(2));

async function main(argv: string[]): Promise<void> {
  if (isVersionRequest(argv)) {
    printVersion();
    return;
  }

  const parsed = parseArgs(argv);

  if (!parsed.command || parsed.command === 'help' || parsed.optionsHelp) {
    printHelp();
    return;
  }

  try {
    process.exitCode = await runCommand(parsed);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function isVersionRequest(argv: string[]): boolean {
  return argv.length === 1 && (argv[0] === '--version' || argv[0] === '-v');
}

function printVersion(): void {
  const packagePath = join(__dirname, '..', 'package.json');
  const packageMetadata = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    version?: unknown;
  };

  if (typeof packageMetadata.version !== 'string') {
    throw new Error(`Package version is missing in ${packagePath}.`);
  }

  console.log(packageMetadata.version);
}

async function runCommand(parsed: ParsedArgs): Promise<number> {
  switch (parsed.command) {
    case 'sync':
      return syncCommand(parsed.options);
    case 'status':
      return statusCommand(parsed.options);
    case 'check':
      return checkCommand(parsed.options);
    case 'info':
      return infoCommand(parsed.options, parsed.positional[0]);
    case 'registry':
      return registryCommand(parsed.options, parsed.positional);
    default:
      console.error(`Unknown command: ${parsed.command}`);
      printHelp();
      return 1;
  }
}

async function registryCommand(
  options: CliOptions,
  positional: string[],
): Promise<number> {
  if (positional.length !== 1 || positional[0] !== 'review') {
    console.error('Usage: ai-skills registry review [options]');
    return 1;
  }

  return registryReviewCommand(options);
}

async function registryReviewCommand(options: CliOptions): Promise<number> {
  const workspace = loadWorkspace(options);

  if (!workspace) {
    return 1;
  }

  const registry = await workspace.registryProvider.readRegistry();
  const reviewResult = reviewRegistryMaterials(registry.materials);
  const issues = [...registry.issues, ...reviewResult.issues];

  console.log(`Registry review: ${reviewResult.materialsChecked} material(s) checked.`);
  const hasErrors = printIssues(issues);
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;

  if (hasErrors) {
    console.log(`Registry review failed with ${warnings} warning(s).`);
    return 1;
  }

  console.log(`Registry review passed with ${warnings} warning(s).`);
  return 0;
}

async function syncCommand(options: CliOptions): Promise<number> {
  const workspace = loadWorkspace(options);

  if (!workspace) {
    return 1;
  }

  const registry = await workspace.registryProvider.readRegistry();

  if (printIssues(registry.issues)) {
    return 1;
  }

  const adapter = getAgentAdapter(workspace.agent);

  if (!adapter) {
    console.error(`No adapter is available for agent "${workspace.agent}".`);
    return 1;
  }

  const resolveResult = resolveSkills(
    registry.skills,
    createResolveContext(workspace, options),
  );

  if (options.dryRun) {
    const files = adapter.generateFiles(resolveResult);
    printResolved(resolveResult.included.map((skill) => `${skill.id}@${skill.version}`));
    console.log('');
    console.log('Would generate:');

    for (const file of files) {
      console.log(`- ${file.relativePath}`);
    }
  } else {
    const files = adapter.writeFiles(workspace.projectRoot, resolveResult);

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

  const adapter = getAgentAdapter(workspace.agent);

  if (!adapter) {
    console.error(`No adapter is available for agent "${workspace.agent}".`);
    return 1;
  }

  const indexPath = join(workspace.projectRoot, adapter.skillIndexPath);

  console.log(`Project: ${workspace.config.project}`);
  console.log(`Agent: ${workspace.agent}`);
  console.log('');
  console.log('Generated files:');
  for (const path of adapter.statusPaths) {
    printFileStatus(workspace.projectRoot, path);
  }

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

async function checkCommand(options: CliOptions): Promise<number> {
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

  console.log(`OK    registry provider: ${workspace.registryProvider.type}`);
  const registry = await workspace.registryProvider.readRegistry();

  if (
    workspace.registryPath &&
    registry.issues.some((issue) => issue.code === 'registry_root_not_found')
  ) {
    console.log(`ERROR registry not found: ${workspace.registryPath}`);
    return 1;
  }

  const registryHasErrors = registry.issues.some((issue) => issue.severity === 'error');

  if (
    !registryHasErrors &&
    (workspace.registryProvider.type === 'file' || workspace.registryProvider.type === 'bundled')
  ) {
    console.log('OK    registry found');
  }

  if (printIssues(registry.issues)) {
    hasErrors = true;
  } else {
    console.log(`OK    ${registry.skills.length} registry items loaded`);
  }

  const adapter = getAgentAdapter(workspace.agent);

  if (!adapter) {
    console.log(`ERROR no adapter is available for agent "${workspace.agent}"`);
    hasErrors = true;
  } else {
    for (const path of adapter.managedPaths) {
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

async function infoCommand(
  options: CliOptions,
  skillId: string | undefined,
): Promise<number> {
  if (!skillId) {
    console.error('Usage: ai-skills info <material-id>');
    return 1;
  }

  const workspace = loadWorkspace(options);

  if (!workspace) {
    return 1;
  }

  const registry = await workspace.registryProvider.readRegistry();

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
  const registryPath = typeof config.registry === 'string'
    ? resolve(projectRoot, config.registry)
    : undefined;

  return {
    projectRoot,
    config,
    registryPath,
    registryProvider: createRegistryProvider(projectRoot, config.registry),
    agent: normalizeAgentId(options.agent || config.agents[0]),
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
  registry review      Review registry material quality

Options:
  --agent <name>       codex | claude-code | cursor | github-copilot
  --task-type <name>   Current task type
  --project-root <dir> Project root, default is current directory
  --technology <name>  Add current technology context
  --path <path>        Add current changed path context
  --dry-run            Show sync output without writing files
`);
}
