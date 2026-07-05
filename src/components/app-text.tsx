import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { useAppTheme } from '@/features/theme/use-app-theme';

type Variant = 'display' | 'title' | 'headline' | 'body' | 'caption';

interface AppTextProps {
  variant?: Variant;
  color?: string;
  dim?: boolean;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
}

/**
 * Single typography component. System font with heavy weights — matches
 * native iOS/Android type instead of shipping a webfont.
 */
export function AppText({
  variant = 'body',
  color,
  dim,
  center,
  style,
  children,
  numberOfLines,
}: AppTextProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles[variant],
        { color: color ?? (dim ? colors.textDim : colors.text) },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 38, fontWeight: '900', letterSpacing: -1, lineHeight: 42 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 33 },
  headline: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2, lineHeight: 17 },
});
