import { ReadRegistryResult } from './types';

export type RegistryProviderType =
  | 'file'
  | 'bundled'
  | 'release-layout'
  | 'yandex-object-storage';

export type RegistryProviderReadResult =
  | ReadRegistryResult
  | Promise<ReadRegistryResult>;

export interface RegistryProvider {
  readonly type: RegistryProviderType;
  readRegistry(): RegistryProviderReadResult;
}
