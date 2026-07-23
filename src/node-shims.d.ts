declare module 'node:fs' {
  export interface Buffer {
    readonly length: number;
  }

  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export function existsSync(path: string): boolean;
  export function copyFileSync(source: string, destination: string): void;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function mkdtempSync(prefix: string): string;
  export function readFileSync(path: string): Buffer;
  export function readFileSync(path: string, encoding: string): string;
  export function readdirSync(path: string, options: { withFileTypes: true }): Dirent[];
  export function statSync(path: string): { isDirectory(): boolean; isFile(): boolean };
  export function writeFileSync(path: string, data: string, encoding: string): void;
  export function rmSync(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): void;
  export function renameSync(oldPath: string, newPath: string): void;
}

declare module 'node:child_process' {
  export function execFileSync(
    file: string,
    args: string[],
    options: {
      encoding: string;
      stdio: ['ignore', 'pipe', 'pipe'];
    },
  ): string;
}

declare module 'node:crypto' {
  export function createHash(algorithm: string): {
    update(value: string | import('node:fs').Buffer): {
      digest(encoding: 'hex'): string;
    };
  };
}

declare module 'node:os' {
  export function homedir(): string;
  export function tmpdir(): string;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function isAbsolute(path: string): boolean;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
  export function normalize(path: string): string;
  export const sep: string;
}

declare const process: {
  argv: string[];
  cwd(): string;
  exit(code?: number): never;
  exitCode?: number;
  pid: number;
};

declare const __dirname: string;
