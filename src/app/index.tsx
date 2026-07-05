import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { dailyChallengeDeck } from '@/features/decks/deck-registry';
import { useEconomy } from '@/features/economy/economy';
import { useAppTheme } from '@/features/theme/use-app-theme';

const DAILY_REWARD = 50;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { state, dailyClaimedToday } = useEconomy();
  const daily = dailyChallengeDeck();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="display">
          Any<AppText variant="display" color={colors.accent}>Deck</AppText>
        </AppText>
        <View style={[styles.coins, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="headline">🪙 {state.coins}</AppText>
        </View>
      </View>
      <AppText dim style={styles.tagline}>
        The party game about anything.
      </AppText>

      <PressableScale
        onPress={() => router.push({ pathname: '/deck/[id]', params: { id: daily.id } })}
        accessibilityLabel="Daily challenge"
      >
        <View style={[styles.daily, { backgroundColor: daily.color }]}>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            DAILY CHALLENGE
          </AppText>
          <AppText variant="title" color="#FFFFFF">
            {daily.emoji} {daily.title}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.9)">
            {dailyClaimedToday
              ? 'Done — come back tomorrow'
              : `Play one round, earn ${DAILY_REWARD} coins`}
          </AppText>
        </View>
      </PressableScale>

      <View style={styles.playWrap}>
        <BigButton label="Play" icon="🎉" onPress={() => router.push('/decks')} />
      </View>

      <View style={styles.grid}>
        <HomeTile emoji="✨" label="AI decks" onPress={() => router.push('/generate')} />
        <HomeTile emoji="✍️" label="Create" onPress={() => router.push('/custom')} />
        <HomeTile emoji="📥" label="Import" onPress={() => router.push('/import')} />
        <HomeTile emoji="📊" label="Stats" onPress={() => router.push('/stats')} />
        <HomeTile emoji="⚙️" label="Settings" onPress={() => router.push('/settings')} />
        <HomeTile emoji="👑" label="Premium" onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}

function HomeTile({
  emoji,
  label,
  onPress,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.tileWrap}>
      <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText style={styles.tileEmoji}>{emoji}</AppText>
        <AppText variant="caption">{label}</AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  coins: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagline: { marginTop: 4, marginBottom: 24 },
  daily: {
    borderRadius: 24,
    padding: 20,
    gap: 6,
    marginBottom: 16,
  },
  playWrap: { marginBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileWrap: { width: '30.5%', flexGrow: 1 },
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  tileEmoji: { fontSize: 30, lineHeight: 36 },
});
