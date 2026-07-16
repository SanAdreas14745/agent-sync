import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { sha256 } from './checksum';

interface CachePointer {
  release: string;
}

export class RegistryReleaseCache {
  readonly root: string;

  constructor(root = join(homedir(), '.ai-skills', 'cache')) {
    this.root = root;
  }

  save(cacheKey: string, release: string, sourceRoot: string): void {
    const cacheRoot = this.getCacheRoot(cacheKey);
    const releaseRoot = join(cacheRoot, this.toPathSegment(release));

    if (!existsSync(releaseRoot)) {
      copyDirectory(sourceRoot, releaseRoot);
    }

    mkdirSync(cacheRoot, { recursive: true });
    writeFileSync(
      join(cacheRoot, 'current.json'),
      JSON.stringify({ release } satisfies CachePointer, null, 2),
      'utf8',
    );
  }

  load(cacheKey: string): { release: string; root: string } | undefined {
    const cacheRoot = this.getCacheRoot(cacheKey);
    const pointerPath = join(cacheRoot, 'current.json');

    if (!existsSync(pointerPath)) {
      return undefined;
    }

    try {
      const pointer = JSON.parse(readFileSync(pointerPath, 'utf8')) as Partial<CachePointer>;

      if (typeof pointer.release !== 'string' || pointer.release.trim() === '') {
        return undefined;
      }

      const root = join(cacheRoot, this.toPathSegment(pointer.release));
      return existsSync(root) && statSync(root).isDirectory()
        ? { release: pointer.release, root }
        : undefined;
    } catch {
      return undefined;
    }
  }

  private getCacheRoot(cacheKey: string): string {
    return join(this.root, this.toPathSegment(cacheKey));
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
