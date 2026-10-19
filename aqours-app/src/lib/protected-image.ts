import type { ImageURISource } from 'react-native';

export function protectedImageSources(uri: string, token: string | null): ImageURISource[] {
  // RN 0.86 Android forwards source headers only through its array-source branch.
  return [{ uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'reload' }];
}
