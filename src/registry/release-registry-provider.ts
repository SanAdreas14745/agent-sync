import { FileRegistryProvider } from './file-registry-provider';
import { RegistryProvider } from './provider';
import { RegistryReleaseCache } from './release-cache';
import { readRegistryReleaseLayout } from './release-layout';
import { ReadRegistryResult, RegistryMaterial, RegistryReleaseIndex, ValidationIssue } from './types';

export interface ReleaseRegistryProviderOptions {
  root: string;
  cache?: RegistryReleaseCache;
  cacheKey?: string;
}

export class ReleaseRegistryProvider implements RegistryProvider {
  readonly type = 'release-layout' as const;

  constructor(private readonly options: ReleaseRegistryProviderOptions) {}

  readRegistry(): ReadRegistryResult {
    const primaryResult = this.readFrom(this.options.root);

    if (!hasErrors(primaryResult)) {
      return this.saveToCache(primaryResult);
    }

    const cachedRelease = this.getCachedRelease();

    if (!cachedRelease) {
      return primaryResult;
    }

    const cachedResult = this.readFrom(cachedRelease.root);

    if (hasErrors(cachedResult)) {
      return primaryResult;
    }

    return {
      ...cachedResult,
      issues: [
        ...cachedResult.issues,
        {
          severity: 'warning',
          code: 'registry_cache_fallback',
          message: `Registry source is unavailable or invalid; using cached release "${cachedRelease.release}".`,
        },
      ],
    };
  }

  private readFrom(root: string): ReadRegistryResult {
    const layout = readRegistryReleaseLayout(root);

    if (!layout.index || !layout.materialRoot) {
      return {
        materials: [],
        skills: [],
        issues: layout.issues,
      };
    }

    const registryResult = new FileRegistryProvider(layout.materialRoot).readRegistry();
    const indexIssues = validateLoadedMaterials(registryResult.skills, layout.index);

    return {
      ...registryResult,
      issues: [...layout.issues, ...registryResult.issues, ...indexIssues],
    };
  }

  private saveToCache(result: ReadRegistryResult): ReadRegistryResult {
    if (!this.options.cache || !this.options.cacheKey) {
      return result;
    }

    const layout = readRegistryReleaseLayout(this.options.root);

    if (!layout.index) {
      return result;
    }

    try {
      this.options.cache.save(
        this.options.cacheKey,
        layout.index.currentRelease.id,
        this.options.root,
      );
      return result;
    } catch (error) {
      return {
        ...result,
        issues: [
          ...result.issues,
          {
            severity: 'warning',
            code: 'registry_cache_write_failed',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }

  private getCachedRelease(): { release: string; root: string } | undefined {
    return this.options.cache && this.options.cacheKey
      ? this.options.cache.load(this.options.cacheKey)
      : undefined;
  }
}

function validateLoadedMaterials(
  materials: RegistryMaterial[],
  index: RegistryReleaseIndex,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const indexedMaterials = new Map(index.materials.map((material) => [material.id, material]));
  const loadedIds = new Set<string>();

  for (const material of materials) {
    loadedIds.add(material.id);
    const indexed = indexedMaterials.get(material.id);

    if (!indexed) {
      issues.push({
        severity: 'error',
        code: 'registry_material_missing_from_index',
        message: `Registry material is missing from index.json: ${material.id}`,
        sourceFile: material.sourceFile,
      });
      continue;
    }

    if (
      indexed.kind !== material.kind ||
      indexed.version !== material.version ||
      indexed.file !== material.sourceFile
    ) {
      issues.push({
        severity: 'error',
        code: 'registry_index_material_mismatch',
        message: `Registry index metadata does not match material: ${material.id}`,
        sourceFile: material.sourceFile,
      });
    }
  }

  for (const material of index.materials) {
    if (!loadedIds.has(material.id)) {
      issues.push({
        severity: 'error',
        code: 'registry_index_material_not_loaded',
        message: `Registry index material was not loaded: ${material.id}`,
        sourceFile: 'index.json',
      });
    }
  }

  return issues;
}

function hasErrors(result: ReadRegistryResult): boolean {
  return result.issues.some((issue) => issue.severity === 'error');
}
