import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { sha256 } from './checksum';

/** Неизменяемый локальный кэш Git registry snapshots. */
export class GitRegistryCache {
  readonly root: string;

  constructor(root = join(homedir(), '.ai-skills', 'cache', 'git')) {
    this.root = root;
  }

  load(source: string, commit: string): string | undefined {
    const materialRoot = join(this.snapshotRoot(source, commit), 'registry');
    return existsSync(materialRoot) && statSync(materialRoot).isDirectory()
      ? materialRoot
      : undefined;
  }

  save(source: string, commit: string, materialRoot: string): string {
    const destination = this.snapshotRoot(source, commit);
    const cachedMaterialRoot = join(destination, 'registry');

    if (existsSync(cachedMaterialRoot)) {
      return cachedMaterialRoot;
    }

    const parent = join(this.root, this.toPathSegment(source));
    const temporary = join(parent, `${commit}.tmp-${process.pid}-${Date.now()}`);

    mkdirSync(parent, { recursive: true });

    try {
      copyDirectory(materialRoot, join(temporary, 'registry'));
      writeFileSync(
        join(temporary, 'metadata.json'),
        JSON.stringify({ source, commit }, null, 2),
        'utf8',
      );

      if (existsSync(destination)) {
        rmSync(temporary, { recursive: true, force: true });
      } else {
        renameSync(temporary, destination);
      }
    } catch (error) {
      rmSync(temporary, { recursive: true, force: true });
      throw error;
    }

    return cachedMaterialRoot;
  }

  private snapshotRoot(source: string, commit: string): string {
    return join(this.root, this.toPathSegment(source), commit.toLowerCase());
  }

  private toPathSegment(value: string): string {
    return sha256(value).slice('sha256:'.length);
  }
}

function copyDirectory(source: string, destination: string): void {
  mkdirSync(destination, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, destinationPath);
    }
  }
}
