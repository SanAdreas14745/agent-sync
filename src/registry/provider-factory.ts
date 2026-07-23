import { resolve } from 'node:path';
import { BundledRegistryProvider } from './bundled-registry-provider';
import { FileRegistryProvider } from './file-registry-provider';
import { GitRegistryProvider } from './git-registry-provider';
import { RegistryProvider } from './provider';
import { RegistryConfig } from './types';
import { UnavailableRegistryProvider } from './unavailable-registry-provider';

export function createRegistryProvider(
  projectRoot: string,
  registryConfig: RegistryConfig,
  gitCommit?: string,
): RegistryProvider {
  if (typeof registryConfig === 'string') {
    return new FileRegistryProvider(resolve(projectRoot, registryConfig));
  }

  if (registryConfig.type === 'bundled') {
    return new BundledRegistryProvider();
  }

  if (gitCommit) {
    return new GitRegistryProvider({
      url: registryConfig.url,
      commit: gitCommit,
    });
  }

  return new UnavailableRegistryProvider(registryConfig.type);
}
