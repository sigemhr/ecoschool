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
      const inTabsGroup = firstSegment === '(tabs)';

      if (!authenticated) {
        // Si no está autenticado y no está en login, mandar a login
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
      } else {
        // Usuario autenticado
        const user = await authService.getCurrentUser();
        const isSuperAdmin = user?.is_super_admin || user?.role === 'super_admin';

        if (inAuthGroup || !firstSegment) {
          // Redirigir según tipo de usuario si está en auth o en la raíz
          if (isSuperAdmin) {
            router.replace('/(super-admin)');
          } else {
            router.replace('/(tabs)');
          }
        } else if (inSuperAdminGroup && !isSuperAdmin) {
          // Si un profesor intenta entrar a super-admin, mandarlo a sus tabs
          router.replace('/(tabs)');
        } else if (inTabsGroup && isSuperAdmin) {
          // Opcional: si un super-admin entra a tabs, podrías dejarlo o mandarlo a su dashboard
          // Por ahora lo dejamos pasar o lo mandamos si es el index
          if (segments.length === 1) {
            router.replace('/(super-admin)');
          }
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

