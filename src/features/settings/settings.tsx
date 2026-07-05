import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { readJson, writeJson } from '@/lib/storage';

export type Appearance = 'system' | 'dark' | 'light';

export interface Settings {
  appearance: Appearance;
  accentId: string;
  roundSeconds: number;
  maxSkips: number;
  soundsEnabled: boolean;
  hapticsEnabled: boolean;
  tiltEnabled: boolean;
}

export const defaultSettings: Settings = {
  appearance: 'system',
  accentId: 'coral',
  roundSeconds: 60,
  maxSkips: 0,
  soundsEnabled: true,
  hapticsEnabled: true,
  tiltEnabled: true,
};

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    readJson<Settings>('settings', defaultSettings).then((stored) =>
      setSettings({ ...defaultSettings, ...stored })
    );
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson('settings', next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
