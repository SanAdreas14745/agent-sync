import {
  LoadMode,
  RegistryMaterialKind,
  RegistryMaterial,
  SkillCategory,
  SkillSeverity,
  SkillScope,
} from '../registry/types';

export interface ResolveContext {
  project: string;
  agent: string;
  taskType?: string;
  paths?: string[];
  technologies?: string[];
}

export interface ResolvedSkill {
  id: string;
  kind: RegistryMaterialKind;
  title: string;
  summary: string;
  body: string;
  scope: SkillScope;
  category: SkillCategory;
  severity: SkillSeverity;
  loadMode: LoadMode;
  version: number;
  sourceFile: string;
  estimatedTokens: number;
  includeReason: string;
  reasons: string[];
}

export interface AvailableSkill {
  id: string;
  kind: RegistryMaterialKind;
  title: string;
  summary: string;
  body: string;
  scope: SkillScope;
  category: SkillCategory;
  severity: SkillSeverity;
  loadMode: LoadMode;
  version: number;
  sourceFile: string;
  entrypoint?: string;
  resources?: RegistryMaterial['resources'];
  resourceFiles?: RegistryMaterial['resourceFiles'];
  reasons: string[];
}

export interface SkippedSkill {
  id: string;
  title: string;
  reason: string;
  reasons: string[];
}

export type ComposerWarningCode =
  | 'deprecated_skill_found'
  | 'disabled_skill_found'
  | 'draft_skill_found'
  | 'reference_too_large'
  | 'skill_matches_project_but_not_agent';

export interface ComposerWarning {
  code: ComposerWarningCode;
  message: string;
  skillId?: string;
}

export interface ResolveManifestSkill {
  id: string;
  version: number;
  sourceFile: string;
}

export interface ResolveManifest {
  project: string;
  agent: string;
  taskType?: string;
  included: ResolveManifestSkill[];
  available: ResolveManifestSkill[];
  estimatedTokens: number;
  checksum: string;
}

export interface ResolveResult {
  included: ResolvedSkill[];
  available: AvailableSkill[];
  skipped: SkippedSkill[];
  warnings: ComposerWarning[];
  manifest: ResolveManifest;
}

export interface SkillExplanation {
  id: string;
  status: 'included' | 'available' | 'skipped' | 'unknown';
  reasons: string[];
}

export interface SkillCandidate {
  skill: RegistryMaterial;
  reasons: string[];
}
