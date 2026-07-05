import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/features/theme/use-app-theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Themed screen container with safe-area padding. */
export function Screen({ children, scroll = true, style }: ScreenProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + 8,
    paddingBottom: insets.bottom + 24,
    paddingLeft: Math.max(insets.left, 20),
    paddingRight: Math.max(insets.right, 20),
  };

  if (!scroll) {
    return (
      <View style={[styles.base, { backgroundColor: colors.bg }, padding, style]}>{children}</View>
    );
  }
  return (
    <ScrollView
      style={[styles.base, { backgroundColor: colors.bg }]}
      contentContainerStyle={[padding, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
