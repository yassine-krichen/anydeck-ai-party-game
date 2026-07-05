import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

/**
 * Forehead tilt detection.
 *
 * With the phone held landscape against the forehead, gravity sits on the
 * device X axis and the Z axis (out of the screen) reads ~0. Tilting the
 * screen toward the floor pushes normalized Z toward +1 (correct); toward
 * the ceiling pushes it toward -1 (skip).
 *
 * iOS and Android report opposite accelerometer signs, so Android is flipped
 * to match the iOS convention before thresholding.
 */
const FIRE_THRESHOLD = 0.62;
const REARM_THRESHOLD = 0.35;
const UPDATE_INTERVAL_MS = 60;

interface TiltHandlers {
  enabled: boolean;
  onTiltDown: () => void;
  onTiltUp: () => void;
  /** Smoothed normalized tilt (-1..1) on every sample, for reactive visuals. */
  onSample?: (tilt: number) => void;
}

export function useTiltControls({ enabled, onTiltDown, onTiltUp, onSample }: TiltHandlers): void {
  const armed = useRef(true);
  const handlers = useRef({ onTiltDown, onTiltUp, onSample });
  handlers.current = { onTiltDown, onTiltUp, onSample };

  useEffect(() => {
    if (!enabled) return;
    armed.current = true;
    Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
    let smoothed = 0;

    const sub = Accelerometer.addListener(({ z }) => {
      const normalized = Platform.OS === 'android' ? -z : z;
      // Light low-pass filter so a hand jolt doesn't fire an action.
      smoothed = smoothed * 0.5 + normalized * 0.5;
      handlers.current.onSample?.(smoothed);

      if (armed.current && Math.abs(smoothed) > FIRE_THRESHOLD) {
        armed.current = false;
        if (smoothed > 0) handlers.current.onTiltDown();
        else handlers.current.onTiltUp();
      } else if (!armed.current && Math.abs(smoothed) < REARM_THRESHOLD) {
        armed.current = true;
      }
    });

    return () => sub.remove();
  }, [enabled]);
}
