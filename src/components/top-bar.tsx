import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/features/theme/use-app-theme';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface TopBarProps {
  title: string;
  right?: ReactNode;
}

/** Screen header: back chevron, title, optional right slot. */
export function TopBar({ title, right }: TopBarProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={styles.bar}>
      <PressableScale
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        style={[styles.back, { backgroundColor: colors.surfaceAlt }]}
      >
        <AppText variant="headline">‹</AppText>
      </PressableScale>
      <AppText variant="title" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
