import { ResolveResult } from '../composer/types';
import { GeneratedFile } from './codex/types';

export interface AgentAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly managedPaths: string[];
  readonly statusPaths: string[];
  readonly skillIndexPath: string;
  generateFiles(resolveResult: ResolveResult): GeneratedFile[];
  writeFiles(projectRoot: string, resolveResult: ResolveResult): GeneratedFile[];
}
