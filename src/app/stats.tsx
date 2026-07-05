import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { getBundledDeck } from '@/features/decks/deck-registry';
import { emptyStats, getStats, type Stats } from '@/features/stats/stats-storage';
import { useAppTheme } from '@/features/theme/use-app-theme';

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const [stats, setStats] = useState<Stats>(emptyStats);

  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
    }, [])
  );

  const totalGuesses = stats.totalCorrect + stats.totalSkipped;
  const accuracy = totalGuesses > 0 ? Math.round((stats.totalCorrect / totalGuesses) * 100) : 0;

  const favoriteDeck = useMemo(() => {
    const entries = Object.entries(stats.deckPlays);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    const [id, plays] = entries[0];
    const deck = getBundledDeck(id);
    return { title: deck ? deck.title : 'Custom deck', plays };
  }, [stats.deckPlays]);

  const playerRows = useMemo(
    () =>
      Object.entries(stats.playerGames)
        .map(([name, games]) => ({
          name,
          games,
          wins: stats.playerWins[name] ?? 0,
          rate: games > 0 ? Math.round(((stats.playerWins[name] ?? 0) / games) * 100) : 0,
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 8),
    [stats]
  );

  const tiles = [
    { label: 'Rounds played', value: String(stats.roundsPlayed) },
    { label: 'Matches', value: String(stats.matchesPlayed) },
    { label: 'Correct guesses', value: String(stats.totalCorrect) },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Best round', value: String(stats.bestRoundScore) },
    { label: 'Best streak', value: String(stats.bestStreak) },
  ];

  return (
    <Screen>
      <TopBar title="Statistics" />
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <View
            key={tile.label}
            style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <AppText variant="title">{tile.value}</AppText>
            <AppText variant="caption" dim>
              {tile.label}
            </AppText>
          </View>
        ))}
      </View>

      {favoriteDeck && (
        <View
          style={[styles.wide, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="caption" dim>
            FAVORITE DECK
          </AppText>
          <AppText variant="headline">
            {favoriteDeck.title} · {favoriteDeck.plays} rounds
          </AppText>
        </View>
      )}

      {playerRows.length > 0 && (
        <View
          style={[styles.wide, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="caption" dim>
            WIN RATES
          </AppText>
          {playerRows.map((p) => (
            <View key={p.name} style={styles.playerRow}>
              <AppText>{p.name}</AppText>
              <AppText dim>
                {p.wins}/{p.games} · {p.rate}%
              </AppText>
            </View>
          ))}
        </View>
      )}

      {stats.roundsPlayed === 0 && (
        <AppText dim center style={styles.empty}>
          Play your first round — stats will show up here.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  wide: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    marginTop: 12,
  },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: 40 },
});
