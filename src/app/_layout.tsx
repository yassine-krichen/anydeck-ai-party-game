import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { EconomyProvider } from '@/features/economy/economy';
import { MatchProvider } from '@/features/game/match-store';
import { SettingsProvider, useSettings } from '@/features/settings/settings';
import { useAppTheme } from '@/features/theme/use-app-theme';

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
