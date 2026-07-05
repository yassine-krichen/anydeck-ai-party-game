import { useColorScheme } from 'react-native';

import { useSettings } from '@/features/settings/settings';

import { darkColors, getAccentTheme, lightColors, type ThemeColors } from './colors';

export interface AppTheme {
  dark: boolean;
  colors: ThemeColors;
}

export function useAppTheme(): AppTheme {
  const system = useColorScheme();
  const { settings } = useSettings();

  const dark =
    settings.appearance === 'system' ? system !== 'light' : settings.appearance === 'dark';
  const accent = getAccentTheme(settings.accentId);

  return {
    dark,
    colors: {
      ...(dark ? darkColors : lightColors),
      accent: accent.accent,
      onAccent: accent.onAccent,
    },
  };
}
