import { File } from 'expo-file-system';

export function createPhotoUploadBody(uri: string): FormData {
  const body = new FormData();
  // Expo 57 fetch reads File bytes; React Native's plain URI descriptors are unsupported.
  // The selected friendly name stays in the UI; multipart uses the cache file's name.
  body.append('file', new File(uri));
  return body;
}
