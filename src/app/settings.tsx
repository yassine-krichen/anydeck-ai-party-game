import { Alert, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { useEconomy } from '@/features/economy/economy';
import { useSettings, type Appearance } from '@/features/settings/settings';
import { accentThemes } from '@/features/theme/colors';
import { useAppTheme } from '@/features/theme/use-app-theme';

const roundOptions = [30, 60, 90, 120];
const skipOptions = [
  { value: 0, label: '∞' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
];
const appearances: { id: Appearance; label: string }[] = [
  { id: 'system', label: 'Auto' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const { settings, update } = useSettings();
  const economy = useEconomy();

  const buyAccent = (id: string, name: string, price: number) => {
    if (economy.state.ownedAccentIds.includes(id)) {
      update({ accentId: id });
      return;
    }
    if (economy.unlockAccent(id, price)) {
      update({ accentId: id });
    } else {
      Alert.alert('Not enough coins', `${name} costs ${price} coins. Play rounds and daily challenges to earn more.`);
    }
  };

  return (
    <Screen>
      <TopBar title="Settings" />

      <Section title="GAME">
        <RowLabel label="Round length" />
        <View style={styles.options}>
          {roundOptions.map((seconds) => (
            <OptionChip
              key={seconds}
              label={`${seconds}s`}
              active={settings.roundSeconds === seconds}
              onPress={() => update({ roundSeconds: seconds })}
            />
          ))}
        </View>
        <RowLabel label="Skips per round" />
        <View style={styles.options}>
          {skipOptions.map((opt) => (
            <OptionChip
              key={opt.value}
              label={opt.label}
              active={settings.maxSkips === opt.value}
              onPress={() => update({ maxSkips: opt.value })}
            />
          ))}
        </View>
        <ToggleRow
          label="Tilt controls"
          value={settings.tiltEnabled}
          onChange={(v) => update({ tiltEnabled: v })}
        />
        <ToggleRow
          label="Sounds"
          value={settings.soundsEnabled}
          onChange={(v) => update({ soundsEnabled: v })}
        />
        <ToggleRow
          label="Haptics"
          value={settings.hapticsEnabled}
          onChange={(v) => update({ hapticsEnabled: v })}
        />
      </Section>

      <Section title="APPEARANCE">
        <View style={styles.options}>
          {appearances.map((a) => (
            <OptionChip
              key={a.id}
              label={a.label}
              active={settings.appearance === a.id}
              onPress={() => update({ appearance: a.id })}
            />
          ))}
        </View>
        <RowLabel label={`Theme color · ${economy.state.coins} coins available`} />
        <View style={styles.swatches}>
          {accentThemes.map((theme) => {
            const owned = economy.state.ownedAccentIds.includes(theme.id);
            const active = settings.accentId === theme.id;
            return (
              <PressableScale
                key={theme.id}
                onPress={() => buyAccent(theme.id, theme.name, theme.price)}
                accessibilityLabel={`${theme.name} theme`}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: theme.accent },
                    active && styles.swatchActive,
                  ]}
                >
                  {!owned && (
                    <AppText variant="caption" color="#FFFFFF">
                      {theme.price}
                    </AppText>
                  )}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </Section>

      <AppText variant="caption" dim center style={styles.version}>
        AnyDeck 1.0.0 · made for game nights
      </AppText>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="caption" dim>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function RowLabel({ label }: { label: string }) {
  return (
    <AppText variant="caption" dim style={styles.rowLabel}>
      {label}
    </AppText>
  );
}

function OptionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale onPress={onPress}>
      <View
        style={[
          styles.chip,
          { backgroundColor: active ? colors.accent : colors.surfaceAlt },
        ]}
      >
        <AppText variant="caption" color={active ? colors.onAccent : colors.text}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.toggleRow}>
      <AppText>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    marginBottom: 14,
  },
  rowLabel: { marginTop: 6 },
  options: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 56,
    alignItems: 'center',
  },
  swatches: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: { borderWidth: 3, borderColor: '#FFFFFF' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  version: { marginTop: 12 },
});
