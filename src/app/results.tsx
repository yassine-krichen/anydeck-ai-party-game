import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Confetti } from '@/components/confetti';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { getBundledDeck } from '@/features/decks/deck-registry';
import { getDeck } from '@/features/decks/deck-storage';
import { useMatch } from '@/features/game/match-store';
import { recordMatch } from '@/features/stats/stats-storage';
import { rankColors } from '@/features/theme/colors';
import { useAppTheme } from '@/features/theme/use-app-theme';

export default function ResultsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { coins, daily } = useLocalSearchParams<{ coins?: string; daily?: string }>();
  const match = useMatch();
  const matchRecorded = useRef(false);
  const [revealedTitle, setRevealedTitle] = useState<string | null>(null);

  const { config, rounds, turnIndex, totalTurns, standings } = match;
  const lastRound = rounds[rounds.length - 1];
  const isMatchOver = config ? turnIndex >= totalTurns - 1 : true;
  const winner = standings[0];
  const deckColor = lastRound ? (getBundledDeck(lastRound.deckId)?.color ?? colors.accent) : colors.accent;

  useEffect(() => {
    if (!config?.mystery || !isMatchOver || !lastRound) return;
    getDeck(lastRound.deckId).then((d) => setRevealedTitle(d?.title ?? null));
  }, [config?.mystery, isMatchOver, lastRound?.deckId]);

  useEffect(() => {
    // Only `!config` means there's truly no active match (e.g. deep-linked
    // here directly). `lastRound` goes briefly empty during "Play again"
    // (startMatch resets rounds before the /play navigation completes) —
    // redirecting on that would race the intended navigation.
    if (!config) {
      router.replace('/');
    }
  }, [config, router]);

  useEffect(() => {
    if (!isMatchOver || !config || matchRecorded.current || config.mode === 'quick') return;
    matchRecorded.current = true;
    const top = standings[0]?.points ?? 0;
    recordMatch({
      entries: config.entries,
      winners: standings.filter((s) => s.points === top).map((s) => s.entry),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMatchOver, config]);

  if (!config || !lastRound) return null;

  const nextEntry = config.entries[(turnIndex + 1) % config.entries.length];

  const onShare = () => {
    const lines =
      config.mode === 'quick'
        ? `I scored ${lastRound.points} in AnyDeck!`
        : `AnyDeck match results:\n${standings
            .map((s, i) => `${i + 1}. ${s.entry} — ${s.points}`)
            .join('\n')}`;
    Share.share({ message: `${lines}\n\nThe party game about anything.` });
  };

  const onPlayAgain = () => {
    match.startMatch(config);
    router.replace('/play');
  };

  const onHome = () => {
    match.resetMatch();
    router.dismissTo('/');
  };

  return (
    <Screen>
      <View style={styles.headerBlock}>
        <AppText variant="caption" dim>
          {isMatchOver ? 'FINAL RESULTS' : `ROUND ${rounds.length} OF ${totalTurns}`}
        </AppText>
        {isMatchOver && winner && config.mode !== 'quick' ? (
          <View style={styles.winnerRow}>
            <Icon name="trophy" size={30} color={colors.gold} />
            <AppText variant="display" center>
              {winner.entry} wins!
            </AppText>
          </View>
        ) : (
          <AppText variant="display" center>
            {lastRound.points} point{lastRound.points === 1 ? '' : 's'}
          </AppText>
        )}
        <AppText dim>
          {lastRound.entry} · best streak {lastRound.bestStreak}
          {coins && Number(coins) > 0 ? ` · +${coins} coins` : ''}
          {daily === '1' ? ' · daily bonus +50' : ''}
        </AppText>
        {config.mystery && revealedTitle && (
          <View style={styles.revealRow}>
            <Icon name="eye-off" size={14} color={colors.textDim} />
            <AppText variant="caption" dim>
              You played: {revealedTitle}
            </AppText>
          </View>
        )}
      </View>

      {isMatchOver && config.mode !== 'quick' && (
        <View style={[styles.standings, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {standings.map((s, i) => (
            <View key={s.entry} style={styles.standingRow}>
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: rankColors[i] ?? colors.surfaceAlt },
                ]}
              >
                <AppText
                  variant="caption"
                  color={i < rankColors.length ? '#1B1B20' : colors.textDim}
                >
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="headline" style={styles.standingName} numberOfLines={1}>
                {s.entry}
              </AppText>
              <AppText variant="headline">{s.points}</AppText>
            </View>
          ))}
        </View>
      )}

      <AppText variant="caption" dim style={styles.cardsLabel}>
        THIS ROUND
      </AppText>
      <View style={styles.cards}>
        {lastRound.results.map((r, i) => (
          <View
            key={`${r.card}-${i}`}
            style={[
              styles.cardChip,
              {
                backgroundColor: r.correct ? 'rgba(76,175,109,0.16)' : colors.surfaceAlt,
              },
            ]}
          >
            <Icon
              name={r.correct ? 'check' : 'x'}
              size={12}
              color={r.correct ? colors.success : colors.textDim}
              strokeWidth={3}
            />
            <AppText variant="caption" color={r.correct ? colors.success : colors.textDim}>
              {r.card}
            </AppText>
          </View>
        ))}
        {lastRound.results.length === 0 && (
          <AppText dim>No cards played — that was fast.</AppText>
        )}
      </View>

      <View style={styles.actions}>
        {!isMatchOver ? (
          <BigButton
            label={`Next up: ${nextEntry}`}
            icon="chevron-right"
            color={deckColor}
            textColor="#FFFFFF"
            onPress={() => {
              match.advanceTurn();
              router.replace('/play');
            }}
          />
        ) : (
          <BigButton label="Play again" icon="rotate-ccw" onPress={onPlayAgain} />
        )}
        <BigButton variant="secondary" icon="share" label="Share score" onPress={onShare} />
        <BigButton variant="ghost" label="Home" onPress={onHome} />
      </View>

      {isMatchOver && <Confetti colors={[deckColor, colors.accent, '#FFD60A', '#30D158', '#0A84FF']} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBlock: { alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 20 },
  revealRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  standings: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  standingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  standingName: { flex: 1 },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsLabel: { marginBottom: 8 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actions: { gap: 10 },
});
