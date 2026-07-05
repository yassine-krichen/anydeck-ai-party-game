import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { useGameSounds } from '@/features/audio/use-game-sounds';
import { getDeck } from '@/features/decks/deck-storage';
import { dailyChallengeDeck } from '@/features/decks/deck-registry';
import type { Deck } from '@/features/decks/deck.types';
import { useEconomy } from '@/features/economy/economy';
import { useMatch } from '@/features/game/match-store';
import { useGameEngine, type EngineSummary } from '@/features/game/use-game-engine';
import { useTiltControls } from '@/features/game/use-tilt-controls';
import {
  correctHaptic,
  roundEndHaptic,
  skipHaptic,
  tapHaptic,
} from '@/features/haptics/haptics';
import { useSettings } from '@/features/settings/settings';
import { recordRound } from '@/features/stats/stats-storage';

const DAILY_REWARD = 50;

export default function PlayScreen() {
  const router = useRouter();
  const { config, turnIndex, currentEntry } = useMatch();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [phase, setPhase] = useState<'handoff' | 'round'>('handoff');

  useKeepAwake();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!config) {
      router.replace('/');
      return;
    }
    getDeck(config.deckId).then((d) => setDeck(d ?? null));
  }, [config, router]);

  // New turn -> back to handoff.
  useEffect(() => {
    setPhase('handoff');
  }, [turnIndex]);

  if (!config || !deck) return <View style={styles.blank} />;

  if (phase === 'handoff') {
    return (
      <View style={[styles.handoff, { backgroundColor: deck.color }]}>
        <AppText variant="caption" color="rgba(255,255,255,0.85)">
          {deck.emoji} {deck.title.toUpperCase()}
        </AppText>
        <AppText variant="display" color="#FFFFFF" center>
          {config.mode === 'quick' ? 'Get ready' : `Pass the phone to ${currentEntry}`}
        </AppText>
        <AppText color="rgba(255,255,255,0.9)" center style={styles.handoffHint}>
          Hold the phone on your forehead, screen facing your friends.{'\n'}
          Tilt down when you guess it · tilt up to skip.
        </AppText>
        <View style={styles.handoffButton}>
          <BigButton
            label="I'm ready"
            color="rgba(0,0,0,0.35)"
            textColor="#FFFFFF"
            onPress={() => setPhase('round')}
          />
        </View>
      </View>
    );
  }

  return <Round key={turnIndex} deck={deck} />;
}

function Round({ deck }: { deck: Deck }) {
  const router = useRouter();
  const { config, currentEntry, finishRound } = useMatch();
  const { settings } = useSettings();
  const { addCoins, claimDaily, dailyClaimedToday } = useEconomy();
  const sounds = useGameSounds();

  const tilt = useSharedValue(0);
  const [feedback, setFeedback] = useState<{ kind: 'correct' | 'skip'; key: number } | null>(
    null
  );
  const finishing = useRef(false);

  const onEnd = (summary: EngineSummary) => {
    if (finishing.current || !config) return;
    finishing.current = true;
    sounds.playRoundEnd();
    roundEndHaptic(settings.hapticsEnabled);

    const correct = summary.results.filter((r) => r.correct).length;
    const skipped = summary.results.length - correct;
    const isDaily = deck.id === dailyChallengeDeck().id && !dailyClaimedToday;

    addCoins(summary.points);
    if (isDaily) claimDaily(DAILY_REWARD);
    recordRound({
      deckId: deck.id,
      correct,
      skipped,
      points: summary.points,
      bestStreak: summary.bestStreak,
    });
    finishRound({
      entry: currentEntry ?? 'You',
      deckId: deck.id,
      results: summary.results,
      points: summary.points,
      bestStreak: summary.bestStreak,
    });

    setTimeout(() => {
      router.replace({
        pathname: '/results',
        params: { coins: String(summary.points), daily: isDaily ? '1' : '0' },
      });
    }, 900);
  };

  const engine = useGameEngine({
    cards: deck.cards,
    roundSeconds: config?.roundSeconds ?? 60,
    maxSkips: config?.maxSkips ?? 0,
    onSecondTick: (s) => {
      if (s <= 5) sounds.playTick();
    },
    onEnd,
  });

  const correct = () => {
    if (engine.phase !== 'playing') return;
    sounds.playCorrect();
    correctHaptic(settings.hapticsEnabled);
    setFeedback({ kind: 'correct', key: Date.now() });
    engine.markCorrect();
  };

  const skip = () => {
    if (engine.phase !== 'playing') return;
    if (engine.skipsLeft <= 0) return;
    sounds.playSkip();
    skipHaptic(settings.hapticsEnabled);
    setFeedback({ kind: 'skip', key: Date.now() });
    engine.markSkip();
  };

  useTiltControls({
    enabled: settings.tiltEnabled && engine.phase === 'playing',
    onTiltDown: correct,
    onTiltUp: skip,
    onSample: (value) => {
      tilt.value = withTiming(value, { duration: 80 });
    },
  });

  // Countdown beeps.
  useEffect(() => {
    if (engine.phase === 'countdown') {
      sounds.playCountdown();
      tapHaptic(settings.hapticsEnabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.phase, engine.countdown]);

  const tiltOverlay = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      tilt.value,
      [-1, -0.25, 0, 0.25, 1],
      [
        'rgba(255,159,10,0.55)',
        'rgba(255,159,10,0)',
        'rgba(0,0,0,0)',
        'rgba(48,209,88,0)',
        'rgba(48,209,88,0.55)',
      ]
    ),
  }));

  const cardFontSize =
    engine.card.length <= 12 ? 64 : engine.card.length <= 20 ? 52 : engine.card.length <= 32 ? 42 : 34;

  return (
    <View style={[styles.round, { backgroundColor: deck.color }]}>
      <Animated.View style={[StyleSheet.absoluteFill, tiltOverlay]} pointerEvents="none" />

      {engine.phase === 'countdown' && (
        <View style={styles.center}>
          <AppText style={styles.countdown} color="#FFFFFF">
            {engine.countdown}
          </AppText>
          <AppText variant="headline" color="rgba(255,255,255,0.9)">
            On your forehead!
          </AppText>
        </View>
      )}

      {engine.phase === 'playing' && (
        <>
          <View style={styles.hud}>
            <View style={styles.hudPill}>
              <AppText variant="headline" color="#FFFFFF">
                ✓ {engine.points}
              </AppText>
            </View>
            <View style={[styles.hudPill, engine.secondsLeft <= 5 && styles.hudUrgent]}>
              <AppText variant="title" color="#FFFFFF">
                {engine.secondsLeft}
              </AppText>
            </View>
            <View style={styles.hudPill}>
              <AppText variant="headline" color="#FFFFFF">
                {config && config.maxSkips > 0 ? `⤴ ${engine.skipsLeft}` : '⤴ ∞'}
              </AppText>
            </View>
          </View>

          <View style={styles.center} pointerEvents="none">
            <AppText
              center
              color="#FFFFFF"
              style={{ fontSize: cardFontSize, fontWeight: '900', lineHeight: cardFontSize * 1.1 }}
            >
              {engine.card}
            </AppText>
          </View>

          <View style={styles.touchZones}>
            <Pressable style={styles.zone} onPress={skip} accessibilityLabel="Skip card">
              <AppText variant="caption" color="rgba(255,255,255,0.6)">
                TAP TO SKIP
              </AppText>
            </Pressable>
            <Pressable style={styles.zone} onPress={correct} accessibilityLabel="Mark correct">
              <AppText variant="caption" color="rgba(255,255,255,0.6)">
                TAP IF CORRECT
              </AppText>
            </Pressable>
          </View>

          {feedback && <FeedbackFlash key={feedback.key} kind={feedback.kind} />}
        </>
      )}

      {engine.phase === 'ended' && (
        <View style={styles.center}>
          <AppText style={styles.countdown} color="#FFFFFF">
            ⏱
          </AppText>
          <AppText variant="display" color="#FFFFFF">
            Time's up!
          </AppText>
        </View>
      )}
    </View>
  );
}

function FeedbackFlash({ kind }: { kind: 'correct' | 'skip' }) {
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(0, { duration: 450 });
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.center,
        style,
        { backgroundColor: kind === 'correct' ? 'rgba(48,209,88,0.85)' : 'rgba(255,159,10,0.85)' },
      ]}
    >
      <AppText style={styles.flashIcon} color="#FFFFFF">
        {kind === 'correct' ? '✓' : '⤴'}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: '#0C0D12' },
  handoff: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  handoffHint: { marginTop: 4 },
  handoffButton: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginTop: 16 },
  round: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  countdown: { fontSize: 120, fontWeight: '900', lineHeight: 130 },
  hud: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  hudPill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  hudUrgent: { backgroundColor: 'rgba(255,69,58,0.75)' },
  touchZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1,
  },
  zone: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  flashIcon: { fontSize: 110, fontWeight: '900', lineHeight: 120 },
});
