import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { SUBSCRIPTION_COIN_BONUS, useEconomy } from '@/features/economy/economy';
import { useAppTheme } from '@/features/theme/use-app-theme';

const benefits: { icon: IconName; label: string }[] = [
  { icon: 'lock', label: 'Every premium deck, unlocked forever' },
  { icon: 'sparkles', label: 'Unlimited AI deck generation' },
  { icon: 'star', label: 'All future deck packs, included' },
  { icon: 'coins', label: `+${SUBSCRIPTION_COIN_BONUS.toLocaleString()} coins to spend on themes` },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { state, purchaseSubscription } = useEconomy();
  const [processing, setProcessing] = useState(false);

  const onSubscribe = async () => {
    setProcessing(true);
    // Mock checkout delay so the confirmation feels intentional, not instant.
    await new Promise((resolve) => setTimeout(resolve, 900));
    await purchaseSubscription();
    setProcessing(false);
  };

  return (
    <Screen>
      <TopBar title="AnyDeck+" />

      <View style={[styles.hero, { backgroundColor: colors.gold }]}>
        <Icon name="crown" size={44} color="#1B1B20" />
        <AppText variant="display" color="#1B1B20" center>
          AnyDeck+
        </AppText>
        <AppText color="rgba(27,27,32,0.75)" center>
          Everything AnyDeck can do, unlocked.
        </AppText>
      </View>

      {state.subscriptionActive ? (
        <View style={styles.active}>
          <Icon name="check" size={40} color={colors.success} />
          <AppText variant="title" center>
            You're subscribed — thank you!
          </AppText>
          <AppText dim center>
            Every premium deck and unlimited AI generation are unlocked, plus{' '}
            {SUBSCRIPTION_COIN_BONUS.toLocaleString()} coins landed in your balance.
          </AppText>
        </View>
      ) : (
        <>
          <View style={styles.benefits}>
            {benefits.map((b) => (
              <View key={b.label} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon name={b.icon} size={18} color={colors.gold} />
                </View>
                <AppText style={styles.benefitLabel}>{b.label}</AppText>
              </View>
            ))}
          </View>

          <View style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="display" center>
              $2.99
            </AppText>
            <AppText dim center>
              per month · cancel anytime
            </AppText>
          </View>

          <AppText variant="caption" dim center style={styles.disclaimer}>
            Testing build — this does not charge a real card.
          </AppText>

          <BigButton
            label={processing ? 'Processing…' : 'Subscribe'}
            icon="crown"
            color={colors.gold}
            textColor="#1B1B20"
            disabled={processing}
            onPress={onSubscribe}
          />
        </>
      )}

      <View style={styles.done}>
        <BigButton
          variant="ghost"
          label={state.subscriptionActive ? 'Done' : 'Not now'}
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 26,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  benefits: { gap: 14, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: { flex: 1 },
  priceCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    marginBottom: 12,
  },
  disclaimer: { marginBottom: 16 },
  active: { alignItems: 'center', gap: 10, paddingVertical: 32, marginBottom: 12 },
  done: { marginTop: 12 },
});
