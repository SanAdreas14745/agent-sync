import { FileRegistryProvider } from './file-registry-provider';
import { ReadRegistryResult } from './types';

export function readRegistry(registryRoot: string): ReadRegistryResult {
  return new FileRegistryProvider(registryRoot).readRegistry();
}
