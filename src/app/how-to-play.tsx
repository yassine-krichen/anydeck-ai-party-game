import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon, type IconName } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { useAppTheme } from '@/features/theme/use-app-theme';

const steps: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'smartphone',
    title: 'Hold it to your forehead',
    body: 'Screen facing your friends, landscape. They see the card, you don’t.',
  },
  {
    icon: 'zap',
    title: 'Tilt to answer',
    body: 'Tilt the phone down when you guess it right, tilt up to skip. Tap zones work too if tilt is off.',
  },
  {
    icon: 'timer',
    title: 'Beat the clock',
    body: 'Race through as many cards as you can before the round timer hits zero.',
  },
  {
    icon: 'trophy',
    title: 'Highest score wins',
    body: 'In Players or Teams mode, everyone takes a turn and the best total score wins.',
  },
];

export default function HowToPlayScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen>
      <TopBar title="How to play" />
      {steps.map((step) => (
        <View key={step.title} style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name={step.icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.text}>
            <AppText variant="headline">{step.title}</AppText>
            <AppText dim style={styles.body}>
              {step.body}
            </AppText>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 4 },
  body: { lineHeight: 20 },
});
