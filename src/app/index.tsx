import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { BackHandler, StyleSheet, ToastAndroid, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon, type IconName } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { bundledDecks, dailyChallengeDeck } from '@/features/decks/deck-registry';
import { getUserDecks } from '@/features/decks/deck-storage';
import { isDeckPlayable, useEconomy } from '@/features/economy/economy';
import { useAppTheme } from '@/features/theme/use-app-theme';

const DAILY_REWARD = 50;
const EXIT_PRESS_WINDOW_MS = 2000;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { state, sessionUnlocks, dailyClaimedToday } = useEconomy();
  const daily = dailyChallengeDeck();
  const lastBackPress = useRef(0);

  const onSurpriseMe = async () => {
    const userDecks = await getUserDecks();
    const candidates = [...bundledDecks, ...userDecks].filter((d) =>
      isDeckPlayable(d, state, sessionUnlocks)
    );
    if (candidates.length === 0) return;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    router.push({ pathname: '/setup', params: { deckId: picked.id, mystery: '1' } });
  };

  // Owns hardware back on this screen so it always confirms-exit here,
  // regardless of whatever screens are still sitting under it in history.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (Date.now() - lastBackPress.current < EXIT_PRESS_WINDOW_MS) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPress.current = Date.now();
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true;
      });
      return () => sub.remove();
    }, [])
  );

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
        <BigButton
          variant="secondary"
          label="Surprise me"
          icon="dices"
          onPress={onSurpriseMe}
        />
      </View>

      <View style={styles.grid}>
        <HomeTile icon="sparkles" label="AI decks" hint="Any topic, instantly" onPress={() => router.push('/generate')} />
        <HomeTile icon="pencil" label="Create" hint="Your own cards" onPress={() => router.push('/custom')} />
        <HomeTile icon="download" label="Import" hint="Code or QR scan" onPress={() => router.push('/import')} />
        <HomeTile icon="bar-chart" label="Stats" hint="Streaks & wins" onPress={() => router.push('/stats')} />
        <HomeTile
          icon="crown"
          label={state.subscriptionActive ? 'AnyDeck+' : 'Premium'}
          hint={state.subscriptionActive ? 'Active — thank you!' : 'Unlock everything'}
          special={state.subscriptionActive}
          onPress={() => router.push('/premium')}
        />
        <HomeTile icon="settings" label="Settings" hint="Timer, sound, theme" onPress={() => router.push('/settings')} />
        <HomeTile icon="circle-help" label="How to play" hint="Rules in 30 seconds" onPress={() => router.push('/how-to-play')} />
      </View>
    </Screen>
  );
}

function HomeTile({
  icon,
  label,
  hint,
  special,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint: string;
  special?: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.tileWrap}>
      <View
        style={[
          styles.tile,
          { backgroundColor: colors.surface, borderColor: colors.border },
          special && { borderColor: colors.gold, borderWidth: 2 },
        ]}
      >
        <View style={[styles.tileIcon, { backgroundColor: special ? colors.gold : colors.surfaceAlt }]}>
          <Icon name={icon} size={20} color={special ? '#1B1B20' : colors.accent} />
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
  playWrap: { gap: 10, marginBottom: 24 },
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
