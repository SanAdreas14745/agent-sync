import { resolve } from 'node:path';
import { FileRegistryProvider } from './file-registry-provider';
import { RegistryProvider } from './provider';
import { ReadRegistryResult } from './types';

const bundledRegistryRoot = resolve(__dirname, '..', '..', 'registry');

/**
 * Reads the canonical registry bundled into the installed npm package.
 */
export class BundledRegistryProvider implements RegistryProvider {
  readonly type = 'bundled' as const;

  private readonly fileProvider = new FileRegistryProvider(bundledRegistryRoot);

  readRegistry(): ReadRegistryResult {
    return this.fileProvider.readRegistry();
  }
}
