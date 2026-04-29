import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { authService } from '@/src/modules/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await authService.isAuthenticated();
      const firstSegment = segments[0] as string;
      const inAuthGroup = firstSegment === '(auth)';
      const inSuperAdminGroup = firstSegment === '(super-admin)';

      if (!authenticated && !inAuthGroup) {
        // Redirigir a login si no está autenticado y no está en el grupo de auth
        router.replace('/(auth)/login');
      } else if (authenticated && inAuthGroup) {
        // Redirigir según tipo de usuario si está autenticado y en auth
        const user = await authService.getCurrentUser();
        if (user?.is_super_admin) {
          router.replace('/(super-admin)' as any);
        } else {
          router.replace('/(tabs)');
        }
      }
      setIsReady(true);
    };

    checkAuth();
  }, [segments]);

  if (!isReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(super-admin)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

