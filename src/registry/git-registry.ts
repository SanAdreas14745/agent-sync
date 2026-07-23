/** Корневой каталог canonical materials в отдельном Git-репозитории registry. */
export const gitRegistryMaterialRoot = 'registry';

/** Нормализует допустимый HTTPS URL Git-репозитория. */
export function normalizeGitRegistryUrl(value: string): string | undefined {
  try {
    const url = new URL(value);

    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.search !== '' ||
      url.hash !== '' ||
      url.pathname === '/'
    ) {
      return undefined;
    }

    return url.toString().replace(/\/$/, '').replace(/\.git$/, '');
  } catch {
    return undefined;
  }
}

/** Проверяет ref, поддерживаемый первым этапом Git registry. */
export function isValidGitRegistryRef(value: string): boolean {
  return (
    /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) &&
    !value.includes('..') &&
    !value.includes('//') &&
    !value.includes('@{') &&
    !value.endsWith('.') &&
    !value.endsWith('/')
  );
}
