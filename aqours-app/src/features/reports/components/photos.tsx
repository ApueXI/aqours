import type { Attachment } from '@aqours/contracts';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { useSession } from '@/features/auth/hooks/session';
import { Body, Button, ErrorNotice, Section, styles } from '@/components/ui';
import { useCommand } from '@/hooks/use-command';
import { apiUrl, errorText } from '@/services/http-client';
import { createPhotoUploadBody } from '@/features/reports/services/photo-upload';
import { protectedImageSources } from '@/features/reports/utils/protected-image';

export type Photo = { uri: string; name: string; type: string };

export function PhotoPicker({ photos, onChange, disabled }: { photos: Photo[]; onChange(value: Photo[]): void; disabled: boolean }) {
  const [error, setError] = useState<string | null>(null);
  async function pick() {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true, selectionLimit: Math.max(1, 4 - photos.length) });
      if (result.canceled) return;
      const selected: Photo[] = [];
      for (const asset of result.assets) {
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('Each photo must be at most 5 MiB.');
        const type = asset.mimeType ?? 'image/jpeg';
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('Choose JPEG, PNG, or WebP photos.');
        selected.push({ uri: asset.uri, name: asset.fileName ?? `report-photo.${type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}`, type });
      }
      onChange([...photos, ...selected].slice(0, 4));
    } catch (failure) { setError(errorText(failure)); }
  }
  return <Section title="Photos (optional)">
    <Body muted>JPEG, PNG, or WebP · up to 5 MiB each. Photos upload after your report is saved.</Body>
    {photos.map((photo, index) => <View key={`${photo.uri}-${index}`} style={styles.item}>
      <Image source={{ uri: photo.uri }} style={{ width: 140, height: 110 }} accessibilityLabel="Selected report photo" />
      <Button title={`Remove photo ${index + 1}`} secondary disabled={disabled} onPress={() => onChange(photos.filter((_, item) => item !== index))} />
    </View>)}
    <ErrorNotice error={error} />
    <Button title="Choose photos" secondary disabled={disabled || photos.length >= 4} onPress={() => void pick()} />
  </Section>;
}

export function PhotoUpload({ reportId, photo }: { reportId: string; photo: Photo }) {
  const upload = useCommand<Attachment>();
  const body = useRef<FormData | null>(null);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  async function send() {
    setPreparationError(null);
    try {
      body.current ??= createPhotoUploadBody(photo.uri);
    } catch {
      setPreparationError('The selected photo could not be prepared. Choose it again.');
      return;
    }
    await upload.execute(`/reports/${reportId}/attachments`, body.current, { fingerprint: JSON.stringify(photo) });
  }
  return <View style={styles.item}>
    <Body>{photo.name}</Body>
    {upload.result ? <Body>Photo attached successfully.</Body> : <>
      <ErrorNotice error={preparationError ?? upload.error} />
      <Body muted>Your report is saved. {upload.uncertain ? 'Retry to confirm this same upload.' : 'This photo has not been confirmed attached.'}</Body>
      <Button title={upload.busy ? 'Uploading…' : preparationError || upload.error ? 'Retry this photo' : 'Upload photo'} secondary disabled={upload.busy} onPress={() => void send()} />
    </>}
  </View>;
}

export function ProtectedPhoto({ attachment }: { attachment: Attachment }) {
  const { token } = useSession();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  return <View style={styles.item}>
    <Body>{attachment.filename}</Body>
    {error ? <Button title="Retry protected photo" secondary onPress={() => { setError(false); setRetry(retry + 1); }} />
      : <Image key={retry} source={protectedImageSources(`${apiUrl}/attachments/${attachment.id}`, token)}
        style={{ width: '100%', height: 220 }} resizeMode="contain" accessibilityLabel={attachment.filename} onError={() => setError(true)} />}
  </View>;
}
