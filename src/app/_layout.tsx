import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useAppStore, initializeApp } from '@/store/app';
import { useTheme } from '@/theme/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const ready = useAppStore((state) => state.ready);
  const initError = useAppStore((state) => state.initError);

  useEffect(() => {
    try {
      initializeApp();
    } catch (error) {
      useAppStore.setState({
        initError: error instanceof Error ? error.message : 'No se pudo iniciar la base de datos',
        ready: true,
      });
    } finally {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  const baseTheme = isDark ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      border: colors.border,
      card: colors.surface,
      notification: colors.primary,
      primary: colors.primary,
      text: colors.text,
    },
  };

  if (!ready) return null;

  if (initError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <AppText variant="subtitle">No se pudo iniciar la app</AppText>
        <AppText variant="body" color="textSecondary" align="center">
          {initError}
        </AppText>
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
});
