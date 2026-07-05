import * as Haptics from 'expo-haptics';

/**
 * Fire-and-forget haptics honoring the user setting.
 * Callers pass `enabled` from settings so this stays a pure utility.
 */
export function tapHaptic(enabled: boolean): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function correctHaptic(enabled: boolean): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function skipHaptic(enabled: boolean): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function roundEndHaptic(enabled: boolean): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
