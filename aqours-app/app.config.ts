import type { ExpoConfig, ConfigContext } from 'expo/config';

export default function configure({ config }: ConfigContext): ExpoConfig {
  return {
    ...config,
    name: 'Aqours',
    slug: 'aqours-app',
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', {
        android: { usesCleartextTraffic: process.env.EXPO_PUBLIC_API_URL?.startsWith('http://') ?? false },
      }],
    ],
  };
}
