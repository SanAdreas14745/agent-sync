import { ReadRegistryResult } from './types';

export type RegistryProviderType =
  | 'file'
  | 'bundled'
  | 'release-layout'
  | 'git';

export type RegistryProviderReadResult =
  | ReadRegistryResult
  | Promise<ReadRegistryResult>;

export interface RegistryProvider {
  readonly type: RegistryProviderType;
  readRegistry(): RegistryProviderReadResult;
}
