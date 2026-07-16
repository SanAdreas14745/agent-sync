import { resolve } from 'node:path';
import { FileRegistryProvider } from './file-registry-provider';
import { RegistryProvider } from './provider';
import { RegistryConfig } from './types';
import { UnavailableRegistryProvider } from './unavailable-registry-provider';

export function createRegistryProvider(
  projectRoot: string,
  registryConfig: RegistryConfig,
): RegistryProvider {
  if (typeof registryConfig === 'string') {
    return new FileRegistryProvider(resolve(projectRoot, registryConfig));
  }

  return new UnavailableRegistryProvider(registryConfig.type);
}
