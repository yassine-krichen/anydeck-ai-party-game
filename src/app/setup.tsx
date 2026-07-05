import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { getDeck } from '@/features/decks/deck-storage';
import type { Deck } from '@/features/decks/deck.types';
import { useMatch } from '@/features/game/match-store';
import type { MatchMode } from '@/features/game/game.types';
import { useSettings } from '@/features/settings/settings';
import { useAppTheme } from '@/features/theme/use-app-theme';

const modes: { id: MatchMode; label: string; hint: string }[] = [
  { id: 'quick', label: 'Quick', hint: 'One phone, one round, no setup' },
  { id: 'players', label: 'Players', hint: 'Everyone plays, highest score wins' },
  { id: 'teams', label: 'Teams', hint: 'Two teams take turns' },
];

export default function SetupScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings } = useSettings();
  const { startMatch } = useMatch();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [mode, setMode] = useState<MatchMode>('quick');
  const [players, setPlayers] = useState<string[]>(['Player 1', 'Player 2']);
  const [teams, setTeams] = useState<string[]>(['Team Red', 'Team Blue']);
  const [rounds, setRounds] = useState(1);

  useEffect(() => {
    if (deckId) getDeck(deckId).then((d) => setDeck(d ?? null));
  }, [deckId]);

  if (!deck) {
    return (
      <Screen>
        <TopBar title="Set up" />
        <AppText dim>Deck not found.</AppText>
      </Screen>
    );
  }

  const entries = mode === 'quick' ? ['You'] : mode === 'players' ? players : teams;
  const setEntries = mode === 'players' ? setPlayers : setTeams;
  const canStart = entries.every((e) => e.trim().length > 0);

  const onStart = () => {
    startMatch({
      deckId: deck.id,
      mode,
      roundSeconds: settings.roundSeconds,
      maxSkips: settings.maxSkips,
      entries: entries.map((e) => e.trim()),
      roundsPerEntry: mode === 'quick' ? 1 : rounds,
    });
    router.push('/play');
  };

  return (
    <Screen>
      <TopBar title={`${deck.emoji} ${deck.title}`} />

      <AppText variant="caption" dim style={styles.label}>
        MODE
      </AppText>
      <View style={styles.modes}>
        {modes.map((m) => (
          <PressableScale key={m.id} onPress={() => setMode(m.id)} style={styles.modeWrap}>
            <View
              style={[
                styles.mode,
                {
                  backgroundColor: mode === m.id ? colors.accent : colors.surface,
                  borderColor: mode === m.id ? colors.accent : colors.border,
                },
              ]}
            >
              <AppText
                variant="headline"
                color={mode === m.id ? colors.onAccent : colors.text}
              >
                {m.label}
              </AppText>
            </View>
          </PressableScale>
        ))}
      </View>
      <AppText variant="caption" dim style={styles.hint}>
        {modes.find((m) => m.id === mode)?.hint}
      </AppText>

      {mode !== 'quick' && (
        <>
          <AppText variant="caption" dim style={styles.label}>
            {mode === 'players' ? 'PLAYERS' : 'TEAMS'}
          </AppText>
          {entries.map((entry, i) => (
            <View key={i} style={styles.playerRow}>
              <TextInput
                value={entry}
                onChangeText={(text) =>
                  setEntries((prev) => prev.map((p, j) => (j === i ? text : p)))
                }
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text },
                ]}
                placeholderTextColor={colors.textDim}
                accessibilityLabel={`Name ${i + 1}`}
              />
              {entries.length > 2 && (
                <PressableScale
                  onPress={() => setEntries((prev) => prev.filter((_, j) => j !== i))}
                  accessibilityLabel="Remove"
                >
                  <AppText variant="headline" dim>
                    ✕
                  </AppText>
                </PressableScale>
              )}
            </View>
          ))}
          {mode === 'players' && (
            <BigButton
              variant="ghost"
              label="Add player"
              icon="＋"
              onPress={() =>
                setEntries((prev) => [...prev, `Player ${prev.length + 1}`])
              }
            />
          )}

          <AppText variant="caption" dim style={styles.label}>
            ROUNDS EACH
          </AppText>
          <View style={styles.stepper}>
            {[1, 2, 3].map((n) => (
              <PressableScale key={n} onPress={() => setRounds(n)} style={styles.modeWrap}>
                <View
                  style={[
                    styles.mode,
                    {
                      backgroundColor: rounds === n ? colors.accent : colors.surface,
                      borderColor: rounds === n ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <AppText
                    variant="headline"
                    color={rounds === n ? colors.onAccent : colors.text}
                  >
                    {n}
                  </AppText>
                </View>
              </PressableScale>
            ))}
          </View>
        </>
      )}

      <View style={styles.info}>
        <AppText variant="caption" dim>
          ⏱ {settings.roundSeconds}s per round ·{' '}
          {settings.maxSkips === 0 ? 'unlimited skips' : `${settings.maxSkips} skips`} — change
          in Settings
        </AppText>
      </View>

      <BigButton
        label="Start"
        icon="🚀"
        color={deck.color}
        textColor="#FFFFFF"
        disabled={!canStart}
        onPress={onStart}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 20, marginBottom: 8 },
  modes: { flexDirection: 'row', gap: 10 },
  modeWrap: { flex: 1 },
  mode: {
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingVertical: 14,
  },
  hint: { marginTop: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  stepper: { flexDirection: 'row', gap: 10 },
  info: { marginVertical: 20 },
});
