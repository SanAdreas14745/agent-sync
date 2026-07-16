import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { isSha256Checksum, sha256 } from './checksum';
import {
  RegistryMaterialKind,
  RegistryReleaseIndex,
  RegistryReleaseIndexMaterial,
  RegistryReleaseManifest,
  RegistryReleaseManifestFile,
  ValidationIssue,
} from './types';

export interface ReadRegistryReleaseLayoutResult {
  index?: RegistryReleaseIndex;
  manifest?: RegistryReleaseManifest;
  materialRoot?: string;
  issues: ValidationIssue[];
}

export function readRegistryReleaseLayout(
  root: string,
): ReadRegistryReleaseLayoutResult {
  const issues: ValidationIssue[] = [];
  const indexPath = join(root, 'index.json');

  if (!existsSync(indexPath)) {
    return {
      issues: [
        {
          severity: 'error',
          code: 'registry_index_not_found',
          message: `Registry index was not found: ${indexPath}`,
        },
      ],
    };
  }

  const index = readRegistryReleaseIndex(indexPath, issues);

  if (!index) {
    return { issues };
  }

  const manifestPath = resolveInsideRoot(root, index.currentRelease.manifest);

  if (!manifestPath) {
    issues.push({
      severity: 'error',
      code: 'registry_manifest_path_unsafe',
      message: `Registry manifest path escapes the registry root: ${index.currentRelease.manifest}`,
      sourceFile: 'index.json',
    });
    return { issues };
  }

  if (!existsSync(manifestPath)) {
    issues.push({
      severity: 'error',
      code: 'registry_manifest_not_found',
      message: `Registry manifest was not found: ${index.currentRelease.manifest}`,
      sourceFile: 'index.json',
    });
    return { issues };
  }

  const manifestContent = readFileSync(manifestPath, 'utf8');

  if (sha256(manifestContent) !== index.currentRelease.checksum) {
    issues.push({
      severity: 'error',
      code: 'registry_manifest_checksum_mismatch',
      message: `Registry manifest checksum does not match index.json: ${index.currentRelease.manifest}`,
      sourceFile: index.currentRelease.manifest,
    });
    return { issues };
  }

  const manifest = normalizeRegistryReleaseManifest(
    parseJson(manifestContent, index.currentRelease.manifest, issues),
    index.currentRelease.manifest,
    issues,
  );

  if (!manifest) {
    return { issues };
  }

  if (manifest.release !== index.currentRelease.id) {
    issues.push({
      severity: 'error',
      code: 'registry_release_mismatch',
      message: 'Registry manifest release does not match index.json current release.',
      sourceFile: index.currentRelease.manifest,
    });
    return { issues };
  }

  const materialRoot = resolveInsideRoot(root, manifest.materialRoot);

  if (!materialRoot) {
    issues.push({
      severity: 'error',
      code: 'registry_material_root_unsafe',
      message: `Registry material root escapes the registry root: ${manifest.materialRoot}`,
      sourceFile: index.currentRelease.manifest,
    });
    return { issues };
  }

  if (!existsSync(materialRoot) || !statSync(materialRoot).isDirectory()) {
    issues.push({
      severity: 'error',
      code: 'registry_material_root_not_found',
      message: `Registry material root was not found: ${manifest.materialRoot}`,
      sourceFile: index.currentRelease.manifest,
    });
    return { issues };
  }

  validateManifestFiles(materialRoot, manifest, issues);
  validateIndexMaterials(index, manifest, issues);

  return issues.some((issue) => issue.severity === 'error')
    ? { issues }
    : { index, manifest, materialRoot, issues };
}

function readRegistryReleaseIndex(
  indexPath: string,
  issues: ValidationIssue[],
): RegistryReleaseIndex | undefined {
  return normalizeRegistryReleaseIndex(
    parseJson(readFileSync(indexPath, 'utf8'), 'index.json', issues),
    issues,
  );
}

function parseJson(
  content: string,
  sourceFile: string,
  issues: ValidationIssue[],
): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    issues.push({
      severity: 'error',
      code: 'registry_release_json_invalid',
      message: error instanceof Error ? error.message : String(error),
      sourceFile,
    });
    return undefined;
  }
}

function normalizeRegistryReleaseIndex(
  value: unknown,
  issues: ValidationIssue[],
): RegistryReleaseIndex | undefined {
  if (!isRecord(value)) {
    issues.push(invalidReleaseIssue('index.json', 'Registry index must be a JSON object.'));
    return undefined;
  }

  const formatVersion = value.formatVersion;
  const updatedAt = readRequiredString(value, 'updatedAt', 'index.json', issues);
  const currentRelease = normalizeCurrentRelease(value.currentRelease, issues);
  const materials = normalizeIndexMaterials(value.materials, issues);

  if (formatVersion !== 1) {
    issues.push(invalidReleaseIssue('index.json', 'Registry index formatVersion must be 1.'));
  }

  if (!updatedAt || !currentRelease || !materials || formatVersion !== 1) {
    return undefined;
  }

  return {
    formatVersion: 1,
    updatedAt,
    currentRelease,
    materials,
  };
}

function normalizeCurrentRelease(
  value: unknown,
  issues: ValidationIssue[],
): RegistryReleaseIndex['currentRelease'] | undefined {
  if (!isRecord(value)) {
    issues.push(invalidReleaseIssue('index.json', 'Registry index currentRelease must be an object.'));
    return undefined;
  }

  const id = readRequiredString(value, 'id', 'index.json', issues);
  const manifest = readRequiredString(value, 'manifest', 'index.json', issues);
  const checksum = value.checksum;

  if (!isSha256Checksum(checksum)) {
    issues.push(invalidReleaseIssue('index.json', 'Registry index currentRelease checksum must be SHA-256.'));
  }

  if (!id || !manifest || !isSha256Checksum(checksum)) {
    return undefined;
  }

  return { id, manifest, checksum };
}

function normalizeIndexMaterials(
  value: unknown,
  issues: ValidationIssue[],
): RegistryReleaseIndexMaterial[] | undefined {
  if (!Array.isArray(value)) {
    issues.push(invalidReleaseIssue('index.json', 'Registry index materials must be an array.'));
    return undefined;
  }

  const ids = new Set<string>();
  const files = new Set<string>();
  const materials: RegistryReleaseIndexMaterial[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      issues.push(invalidReleaseIssue('index.json', 'Registry index material must be an object.'));
      continue;
    }

    const id = readRequiredString(item, 'id', 'index.json', issues);
    const kind = item.kind;
    const version = item.version;
    const file = readRequiredString(item, 'file', 'index.json', issues);
    const checksum = item.checksum;

    if (!isRegistryMaterialKind(kind)) {
      issues.push(invalidReleaseIssue('index.json', 'Registry index material kind is invalid.'));
    }

    if (!Number.isInteger(version) || typeof version !== 'number' || version < 1) {
      issues.push(invalidReleaseIssue('index.json', 'Registry index material version must be a positive integer.'));
    }

    if (!file || !isSafeRelativePath(file)) {
      issues.push(invalidReleaseIssue('index.json', 'Registry index material file must be a safe relative path.'));
    }

    if (!isSha256Checksum(checksum)) {
      issues.push(invalidReleaseIssue('index.json', 'Registry index material checksum must be SHA-256.'));
    }

    if (!id || !isRegistryMaterialKind(kind) || !file || !isSafeRelativePath(file) ||
      !isSha256Checksum(checksum) || typeof version !== 'number' ||
      !Number.isInteger(version) || version < 1) {
      continue;
    }

    if (ids.has(id) || files.has(file)) {
      issues.push(invalidReleaseIssue('index.json', 'Registry index materials must have unique ids and files.'));
      continue;
    }

    ids.add(id);
    files.add(file);
    materials.push({ id, kind, version, file, checksum });
  }

  return issues.some((issue) => issue.severity === 'error') ? undefined : materials;
}

function normalizeRegistryReleaseManifest(
  value: unknown,
  sourceFile: string,
  issues: ValidationIssue[],
): RegistryReleaseManifest | undefined {
  if (!isRecord(value)) {
    issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest must be a JSON object.'));
    return undefined;
  }

  const formatVersion = value.formatVersion;
  const release = readRequiredString(value, 'release', sourceFile, issues);
  const createdAt = readRequiredString(value, 'createdAt', sourceFile, issues);
  const materialRoot = readRequiredString(value, 'materialRoot', sourceFile, issues);
  const files = normalizeManifestFiles(value.files, sourceFile, issues);

  if (formatVersion !== 1) {
    issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest formatVersion must be 1.'));
  }

  if (!materialRoot || !isSafeRelativePath(materialRoot)) {
    issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest materialRoot must be a safe relative path.'));
  }

  if (!release || !createdAt || !materialRoot || !isSafeRelativePath(materialRoot) ||
    !files || formatVersion !== 1) {
    return undefined;
  }

  return {
    formatVersion: 1,
    release,
    createdAt,
    materialRoot,
    files,
  };
}

function normalizeManifestFiles(
  value: unknown,
  sourceFile: string,
  issues: ValidationIssue[],
): RegistryReleaseManifestFile[] | undefined {
  if (!Array.isArray(value)) {
    issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest files must be an array.'));
    return undefined;
  }

  const paths = new Set<string>();
  const files: RegistryReleaseManifestFile[] = [];

  for (const item of value) {
    if (!isRecord(item)) {
      issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest file must be an object.'));
      continue;
    }

    const path = readRequiredString(item, 'path', sourceFile, issues);
    const checksum = item.checksum;
    const size = item.size;

    if (!path || !isSafeRelativePath(path)) {
      issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest file path must be a safe relative path.'));
    }

    if (!isSha256Checksum(checksum)) {
      issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest file checksum must be SHA-256.'));
    }

    if (!Number.isInteger(size) || typeof size !== 'number' || size < 0) {
      issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest file size must be a non-negative integer.'));
    }

    if (!path || !isSafeRelativePath(path) || !isSha256Checksum(checksum) ||
      typeof size !== 'number' || !Number.isInteger(size) || size < 0) {
      continue;
    }

    if (paths.has(path)) {
      issues.push(invalidReleaseIssue(sourceFile, 'Registry manifest file paths must be unique.'));
      continue;
    }

    paths.add(path);
    files.push({ path, checksum, size });
  }

  return issues.some((issue) => issue.severity === 'error') ? undefined : files;
}

function validateManifestFiles(
  materialRoot: string,
  manifest: RegistryReleaseManifest,
  issues: ValidationIssue[],
): void {
  for (const file of manifest.files) {
    const filePath = resolveInsideRoot(materialRoot, file.path);

    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
      issues.push({
        severity: 'error',
        code: 'registry_release_file_not_found',
        message: `Registry release file was not found: ${file.path}`,
        sourceFile: file.path,
      });
      continue;
    }

    const content = readFileSync(filePath);

    if (content.length !== file.size) {
      issues.push({
        severity: 'error',
        code: 'registry_release_file_size_mismatch',
        message: `Registry release file size does not match manifest: ${file.path}`,
        sourceFile: file.path,
      });
    }

    if (sha256(content) !== file.checksum) {
      issues.push({
        severity: 'error',
        code: 'registry_release_file_checksum_mismatch',
        message: `Registry release file checksum does not match manifest: ${file.path}`,
        sourceFile: file.path,
      });
    }
  }
}

function validateIndexMaterials(
  index: RegistryReleaseIndex,
  manifest: RegistryReleaseManifest,
  issues: ValidationIssue[],
): void {
  const manifestFiles = new Map(manifest.files.map((file) => [file.path, file]));

  for (const material of index.materials) {
    const manifestFile = manifestFiles.get(material.file);

    if (!manifestFile) {
      issues.push({
        severity: 'error',
        code: 'registry_index_material_not_in_manifest',
        message: `Registry index material is not listed in manifest: ${material.file}`,
        sourceFile: 'index.json',
      });
    } else if (material.checksum !== manifestFile.checksum) {
      issues.push({
        severity: 'error',
        code: 'registry_index_material_checksum_mismatch',
        message: `Registry index material checksum does not match manifest: ${material.file}`,
        sourceFile: 'index.json',
      });
    }
  }
}

function readRequiredString(
  source: Record<string, unknown>,
  field: string,
  sourceFile: string,
  issues: ValidationIssue[],
): string | undefined {
  const value = source[field];

  if (typeof value !== 'string' || value.trim() === '') {
    issues.push(invalidReleaseIssue(sourceFile, `Registry release field "${field}" must be a non-empty string.`));
    return undefined;
  }

  return value;
}

function invalidReleaseIssue(sourceFile: string, message: string): ValidationIssue {
  return {
    severity: 'error',
    code: 'invalid_registry_release',
    message,
    sourceFile,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRegistryMaterialKind(value: unknown): value is RegistryMaterialKind {
  return value === 'rule' || value === 'skill' || value === 'reference';
}

function isSafeRelativePath(value: string): boolean {
  return resolveInsideRoot('.', value) !== undefined;
}

function resolveInsideRoot(root: string, path: string): string | undefined {
  if (isAbsolute(path)) {
    return undefined;
  }

  const absolutePath = resolve(root, path);
  const relativePath = relative(root, absolutePath);

  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath)
    ? absolutePath
    : undefined;
}
