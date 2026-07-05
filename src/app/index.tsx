import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon, type IconName } from '@/components/icon';
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
        <View>
          <AppText variant="display">AnyDeck</AppText>
          <AppText variant="caption" dim>
            THE PARTY GAME ABOUT ANYTHING
          </AppText>
        </View>
        <View style={[styles.coins, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="coins" size={16} color={colors.gold} />
          <AppText variant="headline">{state.coins}</AppText>
        </View>
      </View>

      <PressableScale
        onPress={() => router.push({ pathname: '/deck/[id]', params: { id: daily.id } })}
        accessibilityLabel="Daily challenge"
      >
        <View style={[styles.daily, { backgroundColor: daily.color }]}>
          <View style={styles.dailyBody}>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">
              DAILY CHALLENGE
            </AppText>
            <AppText variant="title" color="#FFFFFF">
              {daily.title}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.9)">
              {dailyClaimedToday
                ? 'Done — back tomorrow'
                : `One round pays ${DAILY_REWARD} coins`}
            </AppText>
          </View>
          <View style={styles.dailyIcon}>
            <Icon name={daily.icon} size={40} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      </PressableScale>

      <View style={styles.playWrap}>
        <BigButton label="Play" icon="play" onPress={() => router.push('/decks')} />
      </View>

      <View style={styles.grid}>
        <HomeTile icon="sparkles" label="AI decks" hint="Any topic, instantly" onPress={() => router.push('/generate')} />
        <HomeTile icon="pencil" label="Create" hint="Your own cards" onPress={() => router.push('/custom')} />
        <HomeTile icon="download" label="Import" hint="Code or QR scan" onPress={() => router.push('/import')} />
        <HomeTile icon="bar-chart" label="Stats" hint="Streaks & wins" onPress={() => router.push('/stats')} />
        <HomeTile icon="crown" label="Premium" hint="Unlock everything" onPress={() => router.push('/settings')} />
        <HomeTile icon="settings" label="Settings" hint="Timer, sound, theme" onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}

function HomeTile({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.tileWrap}>
      <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.tileIcon, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name={icon} size={20} color={colors.accent} />
        </View>
        <View style={styles.tileText}>
          <AppText variant="headline">{label}</AppText>
          <AppText variant="caption" dim numberOfLines={1}>
            {hint}
          </AppText>
        </View>
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
    marginBottom: 24,
  },
  coins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  daily: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyBody: { flex: 1, gap: 5 },
  dailyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playWrap: { marginBottom: 24 },
  grid: { gap: 10 },
  tileWrap: {},
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { flex: 1, gap: 2 },
});
