import { RegistryProvider, RegistryProviderType } from './provider';
import { ReadRegistryResult } from './types';

export class UnavailableRegistryProvider implements RegistryProvider {
  constructor(readonly type: Exclude<RegistryProviderType, 'file'>) {}

  readRegistry(): ReadRegistryResult {
    return {
      materials: [],
      skills: [],
      issues: [
        {
          severity: 'error',
          code: 'registry_provider_not_available',
          message: `Registry provider "${this.type}" is not available yet. Use a file registry or upgrade to a version with remote registry support.`,
        },
      ],
    };
  }
}
