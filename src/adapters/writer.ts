import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { GeneratedFile } from './codex/types';

export function writeGeneratedFiles(
  projectRootValue: string,
  files: GeneratedFile[],
): GeneratedFile[] {
  const projectRoot = resolve(projectRootValue);

  for (const file of files) {
    const absolutePath = resolveOutputPath(projectRoot, file.relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, file.content, 'utf8');
  }

  return files;
}

function resolveOutputPath(projectRoot: string, relativePath: string): string {
  if (isAbsolute(relativePath)) {
    throw new Error(`Output path must be relative: ${relativePath}`);
  }

  const absolutePath = resolve(join(projectRoot, relativePath));
  const relativePathFromRoot = relative(projectRoot, absolutePath);

  if (
    relativePathFromRoot === '' ||
    relativePathFromRoot.startsWith('..') ||
    isAbsolute(relativePathFromRoot)
  ) {
    throw new Error(`Output path escapes project root: ${relativePath}`);
  }

  return absolutePath;
}
