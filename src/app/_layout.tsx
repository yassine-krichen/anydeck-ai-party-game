import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { EconomyProvider } from '@/features/economy/economy';
import { MatchProvider } from '@/features/game/match-store';
import { SettingsProvider, useSettings } from '@/features/settings/settings';
import { darkColors } from '@/features/theme/colors';
import { useAppTheme } from '@/features/theme/use-app-theme';

/**
 * Shown by expo-router when a screen throws. Providers may not be mounted,
 * so it only uses hard-coded dark palette values.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={[styles.errorScreen, { backgroundColor: darkColors.bg }]}>
      <AppText variant="title" color={darkColors.text} center>
        Something went wrong
      </AppText>
      <AppText color={darkColors.textDim} center>
        {error.message}
      </AppText>
      <View style={styles.errorAction}>
        <BigButton label="Try again" onPress={() => retry()} />
      </View>
    </View>
  );
}

function ThemedStack() {
  const { dark, colors } = useAppTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="play" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="results" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  // App is portrait everywhere except the play screen, which locks landscape
  // itself. app.json orientation stays "default" so iOS permits both.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  return (
    <SettingsProvider>
      <EconomyProvider>
        <MatchProvider>
          <ThemedStack />
        </MatchProvider>
      </EconomyProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorAction: { alignSelf: 'stretch', marginTop: 12 },
});
