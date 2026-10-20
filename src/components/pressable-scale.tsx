import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PressableScaleProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  accessibilityLabel?: string;
}

/**
 * Flex-participation keys only — everything else (background, padding,
 * margin, border...) stays on the inner Animated.View as before. `style` is
 * commonly a flex hint like `{ flex: 1 }` meant to size this component
 * within a parent row/column; without forwarding it here, the outer
 * `Pressable` (the actual flex item) ignores it and collapses to content
 * size while the inner View silently stretches inside that wrong-sized box.
 */
const LAYOUT_KEYS = [
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
] as const;

function layoutStyle(style: StyleProp<ViewStyle> | undefined): ViewStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const picked: ViewStyle = {};
  for (const key of LAYOUT_KEYS) {
    if (flat[key] !== undefined) (picked as Record<string, unknown>)[key] = flat[key];
  }
  return picked;
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
      style={layoutStyle(style)}
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
