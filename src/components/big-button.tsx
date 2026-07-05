import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/features/theme/use-app-theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?: string;
  textColor?: string;
  disabled?: boolean;
  icon?: IconName;
}

/** Full-width action button, 56pt tall — the app's primary CTA shape. */
export function BigButton({
  label,
  onPress,
  variant = 'primary',
  color,
  textColor,
  disabled,
  icon,
}: BigButtonProps) {
  const { colors } = useAppTheme();

  const background =
    variant === 'primary'
      ? (color ?? colors.accent)
      : variant === 'secondary'
        ? colors.surfaceAlt
        : 'transparent';
  const labelColor = textColor ?? (variant === 'primary' ? colors.onAccent : colors.text);

  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityLabel={label}>
      <View
        style={[
          styles.button,
          { backgroundColor: background },
          variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.border },
        ]}
      >
        {icon && <Icon name={icon} size={20} color={labelColor} />}
        <AppText variant="headline" color={labelColor}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
});
