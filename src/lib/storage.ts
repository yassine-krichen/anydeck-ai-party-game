import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Namespaced JSON storage. All persistence goes through here so keys stay
 * consistent and parse failures never crash a feature.
 */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(`anydeck:${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(`anydeck:${key}`, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — never crash gameplay over persistence.
  }
}
