export type SkillScope =
  | 'company'
  | 'team'
  | 'project'
  | 'directory'
  | 'taskType';

export type LoadMode =
  | 'always'
  | 'project'
  | 'task'
  | 'onDemand'
  | 'reference';

export type RegistryMaterialKind =
  | 'rule'
  | 'skill'
  | 'reference';

export type SkillStatus =
  | 'draft'
  | 'active'
  | 'deprecated'
  | 'disabled';

export type SkillCategory =
  | 'general'
  | 'communication'
  | 'git'
  | 'verification'
  | 'dependencies'
  | 'frontend'
  | 'bff'
  | 'backend'
  | 'typescript'
  | 'html'
  | 'scss'
  | 'architecture'
  | 'security';

export type SkillSeverity =
  | 'required'
  | 'recommended';

export interface AppliesTo {
  projects?: string[];
  agents?: string[];
  taskTypes?: string[];
  paths?: string[];
  technologies?: string[];
}

export interface RegistryMaterial {
  id: string;
  kind: RegistryMaterialKind;
  title: string;
  summary: string;
  body: string;
  scope: SkillScope;
  loadMode: LoadMode;
  status: SkillStatus;
  category: SkillCategory;
  severity: SkillSeverity;
  version: number;
  owner: string;
  updatedAt: string;
  appliesTo: AppliesTo;
  sourceFile: string;
  entrypoint?: string;
  resources?: RegistryMaterialResources;
  resourceFiles?: RegistryMaterialResourceFile[];
}

export type RegistrySkill = RegistryMaterial;

export interface RegistryIndex {
  version: number;
  generatedAt: string;
  skills: Omit<RegistryMaterial, 'body'>[];
}

export interface ProjectConfig {
  project: string;
  agents: string[];
  registry: string;
  technologies?: string[];
  defaultTaskType?: string;
}

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  sourceFile?: string;
  field?: string;
}

export interface ReadRegistryResult {
  materials: RegistryMaterial[];
  skills: RegistryMaterial[];
  issues: ValidationIssue[];
}

export interface RegistryMaterialResources {
  references?: string[];
  scripts?: string[];
  evals?: string[];
  assets?: string[];
  agents?: string[];
}

export interface RegistryMaterialResourceFile {
  sourceFile: string;
  relativePath: string;
  content: string;
}
