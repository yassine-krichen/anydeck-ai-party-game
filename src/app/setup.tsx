import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { getDeck } from '@/features/decks/deck-storage';
import type { Deck } from '@/features/decks/deck.types';
import { useMatch } from '@/features/game/match-store';
import type { MatchMode } from '@/features/game/game.types';
import { useSettings } from '@/features/settings/settings';
import { useAppTheme } from '@/features/theme/use-app-theme';

const SOLO_TIME_MULTIPLIER = 1.5;

const modes: { id: MatchMode; label: string; hint: string }[] = [
  { id: 'quick', label: 'Quick', hint: 'One phone, one round, no setup' },
  { id: 'players', label: 'Players', hint: 'Everyone plays, highest score wins' },
  { id: 'teams', label: 'Teams', hint: 'Two teams take turns' },
  { id: 'solo', label: 'Solo', hint: 'Guess from clue words, type your answer' },
];

export default function SetupScreen() {
  const { deckId, mystery, extraDeckIds } = useLocalSearchParams<{
    deckId: string;
    mystery?: string;
    extraDeckIds?: string;
  }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings } = useSettings();
  const { startMatch } = useMatch();

  const isMystery = mystery === '1';
  const extraIds = extraDeckIds ? extraDeckIds.split(',').filter(Boolean) : [];

  const [deck, setDeck] = useState<Deck | null>(null);
  const [extraDecks, setExtraDecks] = useState<Deck[]>([]);
  const [mode, setMode] = useState<MatchMode>('quick');
  const [players, setPlayers] = useState<string[]>(['Player 1', 'Player 2']);
  const [teams, setTeams] = useState<string[]>(['Team Red', 'Team Blue']);
  const [rounds, setRounds] = useState(1);
  const [soloClueCount, setSoloClueCount] = useState(2);

  useEffect(() => {
    if (deckId) getDeck(deckId).then((d) => setDeck(d ?? null));
  }, [deckId]);

  useEffect(() => {
    if (extraIds.length === 0) {
      setExtraDecks([]);
      return;
    }
    Promise.all(extraIds.map((id) => getDeck(id))).then((decks) =>
      setExtraDecks(decks.filter((d): d is Deck => !!d))
    );
    // extraIds is derived fresh from the route param string each render; join it for a stable dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraDeckIds]);

  if (!deck) {
    return (
      <Screen>
        <TopBar title="Set up" />
        <AppText dim>Deck not found.</AppText>
      </Screen>
    );
  }

  const hasSoloCoverage = !!deck.hintWords && Object.keys(deck.hintWords).length > 0;
  const availableModes = modes.filter((m) => m.id !== 'solo' || hasSoloCoverage);

  const title = isMystery
    ? 'Mystery Deck'
    : extraDecks.length === 0
      ? deck.title
      : extraDecks.length <= 2
        ? [deck, ...extraDecks].map((d) => d.title).join(' + ')
        : `${extraDecks.length + 1} decks mixed`;

  const entries = mode === 'quick' || mode === 'solo' ? ['You'] : mode === 'players' ? players : teams;
  const setEntries = mode === 'players' ? setPlayers : setTeams;
  const canStart = entries.every((e) => e.trim().length > 0);

  const onStart = () => {
    const isSolo = mode === 'solo';
    const roundSeconds =
      isSolo && settings.roundSeconds > 0
        ? Math.round(settings.roundSeconds * SOLO_TIME_MULTIPLIER)
        : settings.roundSeconds;

    startMatch({
      deckId: deck.id,
      extraDeckIds: extraIds.length > 0 ? extraIds : undefined,
      mode,
      roundSeconds,
      maxSkips: settings.maxSkips,
      entries: entries.map((e) => e.trim()),
      roundsPerEntry: mode === 'quick' || mode === 'solo' ? 1 : rounds,
      mystery: isMystery,
      soloClueCount: isSolo ? soloClueCount : undefined,
    });
    router.push('/play');
  };

  return (
    <Screen>
      <TopBar title={title} />

      <AppText variant="caption" dim style={styles.label}>
        MODE
      </AppText>
      <View style={styles.modes}>
        {availableModes.map((m) => (
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

      {mode === 'solo' && (
        <>
          <AppText variant="caption" dim style={styles.label}>
            CLUE WORDS
          </AppText>
          <View style={styles.stepper}>
            {[1, 2, 3, 4].map((n) => (
              <PressableScale key={n} onPress={() => setSoloClueCount(n)}>
                <View
                  style={[
                    styles.stepperChip,
                    {
                      backgroundColor: soloClueCount === n ? colors.accent : colors.surface,
                      borderColor: soloClueCount === n ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <AppText
                    variant="headline"
                    color={soloClueCount === n ? colors.onAccent : colors.text}
                  >
                    {n}
                  </AppText>
                </View>
              </PressableScale>
            ))}
          </View>
          <AppText variant="caption" dim style={styles.hint}>
            Fewer words = harder. More letters give it away faster.
          </AppText>
        </>
      )}

      {(mode === 'players' || mode === 'teams') && (
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
                  <Icon name="x" size={20} color={colors.textDim} />
                </PressableScale>
              )}
            </View>
          ))}
          {mode === 'players' && (
            <BigButton
              variant="ghost"
              label="Add player"
              icon="plus"
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
              <PressableScale key={n} onPress={() => setRounds(n)}>
                <View
                  style={[
                    styles.stepperChip,
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
        <Icon name="timer" size={14} color={colors.textDim} />
        <AppText variant="caption" dim>
          {settings.roundSeconds === 0 ? 'Unlimited round' : `${settings.roundSeconds}s per round`} ·{' '}
          {settings.maxSkips === 0 ? 'unlimited skips' : `${settings.maxSkips} skips`} — change
          in Settings
        </AppText>
      </View>

      <BigButton
        label="Start"
        icon="play"
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
  modes: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  modeWrap: { flex: 1, minWidth: '45%' },
  mode: {
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stepperChip: {
    width: 64,
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
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 20,
  },
});
