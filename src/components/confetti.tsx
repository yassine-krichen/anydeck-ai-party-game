import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const PIECE_COUNT = 42;

interface ConfettiProps {
  /** Palette the pieces draw from — pass the deck color + theme accents. */
  colors: string[];
}

interface PieceSpec {
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  spin: number;
}

function Piece({ spec, height }: { spec: PieceSpec; height: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1)
    );
  }, [progress, spec]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 + progress.value * (height + 80) },
      { translateX: Math.sin(progress.value * Math.PI * 3) * 40 },
      { rotate: `${progress.value * spec.spin}deg` },
    ],
    opacity: progress.value < 0.02 ? 0 : 1,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        style,
        {
          left: spec.x,
          width: spec.size,
          height: spec.size * 1.6,
          backgroundColor: spec.color,
          borderRadius: spec.size / 4,
        },
      ]}
    />
  );
}

/** Full-screen falling confetti. Mount to celebrate, unmount to stop. */
export function Confetti({ colors }: ConfettiProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const pieces = useMemo<PieceSpec[]>(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        x: Math.random() * width,
        delay: Math.random() * 1800,
        duration: 2600 + Math.random() * 2200,
        size: 8 + Math.random() * 8,
        color: colors[i % colors.length],
        spin: (Math.random() - 0.5) * 1080,
      })),
    [colors, width]
  );

  if (reducedMotion) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container]}>
      {pieces.map((spec, i) => (
        <Piece key={i} spec={spec} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 50, elevation: 50 },
  piece: { position: 'absolute', top: 0 },
});
