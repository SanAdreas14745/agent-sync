import { ReadRegistryResult } from './types';

export type RegistryProviderType =
  | 'file'
  | 'release-layout'
  | 'yandex-object-storage';

export type RegistryProviderReadResult =
  | ReadRegistryResult
  | Promise<ReadRegistryResult>;

export interface RegistryProvider {
  readonly type: RegistryProviderType;
  readRegistry(): RegistryProviderReadResult;
}
