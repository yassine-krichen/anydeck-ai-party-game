import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PressableScaleProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  accessibilityLabel?: string;
}

/** Standard touchable: springs to 96% on press. Every tappable surface uses this. */
export function PressableScale({
  onPress,
  onLongPress,
  disabled,
  style,
  children,
  accessibilityLabel,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
    >
      <Animated.View style={[style, animatedStyle, disabled && { opacity: 0.45 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
