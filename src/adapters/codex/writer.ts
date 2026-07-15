import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { generateCodexFiles } from './renderer';
import {
  GeneratedFile,
  WriteCodexFilesInput,
} from './types';

export function writeCodexFiles(input: WriteCodexFilesInput): GeneratedFile[] {
  const generated = generateCodexFiles(input);
  const projectRoot = resolve(input.projectRoot);

  for (const file of generated.files) {
    const absolutePath = resolveOutputPath(projectRoot, file.relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, encodeGeneratedContent(file), 'utf8');
  }

  return generated.files;
}

function encodeGeneratedContent(file: GeneratedFile): string {
  if (!file.relativePath.toLowerCase().endsWith('.md')) {
    return file.content;
  }

  return file.content.startsWith('\uFEFF')
    ? file.content
    : `\uFEFF${file.content}`;
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
