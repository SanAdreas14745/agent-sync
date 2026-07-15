import { ResolveResult } from '../../composer/types';

export interface CodexOutputConfig {
  entry: string;
  generatedDir: string;
}

export const codexDefaultOutput: CodexOutputConfig = {
  entry: 'AGENTS.md',
  generatedDir: '.agents/generated',
};

export interface CodexAdapterInput {
  resolveResult: ResolveResult;
  output: CodexOutputConfig;
}

export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export interface CodexGeneratedFiles {
  entry: GeneratedFile;
  activeRules: GeneratedFile;
  ruleScope: GeneratedFile;
  skillIndex: GeneratedFile;
  ruleFiles: GeneratedFile[];
  skillFiles: GeneratedFile[];
  files: GeneratedFile[];
}

export interface WriteCodexFilesInput extends CodexAdapterInput {
  projectRoot: string;
}
