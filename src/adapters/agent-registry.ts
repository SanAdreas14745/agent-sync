import { join } from 'node:path';
import { codexDefaultOutput } from './codex/types';
import { generateCodexFiles } from './codex/renderer';
import { writeCodexFiles } from './codex/writer';
import { claudeCodeAdapter } from './claude-code';
import { cursorAdapter } from './cursor';
import { githubCopilotAdapter } from './github-copilot';
import { AgentAdapter } from './types';

export const codexAdapter: AgentAdapter = {
  id: 'codex',
  displayName: 'Codex',
  managedPaths: [
    codexDefaultOutput.entry,
    join(codexDefaultOutput.generatedDir, 'active-rules.md'),
    join(codexDefaultOutput.generatedDir, 'rule-scope.md'),
    join(codexDefaultOutput.generatedDir, 'skill-index.json'),
    join(codexDefaultOutput.generatedDir, 'rules'),
    join(codexDefaultOutput.generatedDir, 'skills'),
  ],
  statusPaths: [
    codexDefaultOutput.entry,
    join(codexDefaultOutput.generatedDir, 'active-rules.md'),
    join(codexDefaultOutput.generatedDir, 'rule-scope.md'),
    join(codexDefaultOutput.generatedDir, 'skill-index.json'),
  ],
  skillIndexPath: join(codexDefaultOutput.generatedDir, 'skill-index.json'),
  generateFiles: (resolveResult) => generateCodexFiles({
    resolveResult,
    output: codexDefaultOutput,
  }).files,
  writeFiles: (projectRoot, resolveResult) => writeCodexFiles({
    projectRoot,
    resolveResult,
    output: codexDefaultOutput,
  }),
};

const adapters: AgentAdapter[] = [
  codexAdapter,
  claudeCodeAdapter,
  cursorAdapter,
  githubCopilotAdapter,
];

const agentAliases: Record<string, string> = {
  claude: 'claude-code',
  copilot: 'github-copilot',
};

export const supportedAgentIds = adapters.map((adapter) => adapter.id);

export function normalizeAgentId(agent: string): string {
  return agentAliases[agent] || agent;
}

export function getAgentAdapter(agent: string): AgentAdapter | undefined {
  const normalizedAgent = normalizeAgentId(agent);
  return adapters.find((adapter) => adapter.id === normalizedAgent);
}
