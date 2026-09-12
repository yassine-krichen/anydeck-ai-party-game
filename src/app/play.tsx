import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon } from '@/components/icon';
import { useGameSounds } from '@/features/audio/use-game-sounds';
import { getDeck } from '@/features/decks/deck-storage';
import { dailyChallengeDeck } from '@/features/decks/deck-registry';
import type { Deck } from '@/features/decks/deck.types';
import { useEconomy } from '@/features/economy/economy';
import type { GameConfig } from '@/features/game/game.types';
import { useMatch } from '@/features/game/match-store';
import { compareGuessProgress, isCloseMatch } from '@/features/game/text-match';
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
const DOUBLE_TAP_WINDOW_MS = 350;

export default function PlayScreen() {
  const router = useRouter();
  const { config, turnIndex, currentEntry } = useMatch();
  const [playDeck, setPlayDeck] = useState<Deck | null>(null);
  const [phase, setPhase] = useState<'handoff' | 'round'>('handoff');

  useKeepAwake();

  useEffect(() => {
    const orientation =
      config?.mode === 'solo'
        ? ScreenOrientation.OrientationLock.PORTRAIT_UP
        : ScreenOrientation.OrientationLock.LANDSCAPE;
    ScreenOrientation.lockAsync(orientation).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, [config?.mode]);

  useEffect(() => {
    if (!config) {
      router.replace('/');
      return;
    }
    Promise.all([
      getDeck(config.deckId),
      ...(config.extraDeckIds ?? []).map((id) => getDeck(id)),
    ]).then(([primary, ...extras]) => {
      if (!primary) {
        setPlayDeck(null);
        return;
      }
      const validExtras = extras.filter((d): d is Deck => !!d);
      if (validExtras.length === 0) {
        setPlayDeck(primary);
        return;
      }
      const cards = [primary, ...validExtras].flatMap((d) => d.cards);
      const hintWords = [primary, ...validExtras].reduce<Record<string, string[]>>(
        (acc, d) => ({ ...acc, ...d.hintWords }),
        {}
      );
      setPlayDeck({ ...primary, cards, hintWords });
    });
  }, [config, router]);

  // New turn -> back to handoff.
  useEffect(() => {
    setPhase('handoff');
  }, [turnIndex]);

  if (!config || !playDeck) return <View style={styles.blank} />;

  if (phase === 'handoff') {
    const isSolo = config.mode === 'solo';
    return (
      <View style={[styles.handoff, { backgroundColor: playDeck.color }]}>
        {!config.mystery && (
          <View style={styles.handoffDeck}>
            <Icon name={playDeck.icon} size={16} color="rgba(255,255,255,0.85)" />
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              {playDeck.title.toUpperCase()}
            </AppText>
          </View>
        )}
        {config.mystery && (
          <View style={styles.handoffDeck}>
            <Icon name="eye-off" size={16} color="rgba(255,255,255,0.85)" />
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              MYSTERY DECK
            </AppText>
          </View>
        )}
        <AppText variant="display" color="#FFFFFF" center>
          {config.mode === 'quick' || isSolo ? 'Get ready' : `Pass the phone to ${currentEntry}`}
        </AppText>
        <AppText color="rgba(255,255,255,0.9)" center style={styles.handoffHint}>
          {isSolo
            ? 'Guess from the clue words before time runs out. Stuck? Skip the card.'
            : 'Hold the phone on your forehead, screen facing your friends.\nTilt down when you guess it · tilt up to skip.'}
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

  return config.mode === 'solo' ? (
    <SoloRound key={turnIndex} deck={playDeck} config={config} />
  ) : (
    <Round key={turnIndex} deck={playDeck} />
  );
}

/** Shared HUD: points / timer (or infinity, double-tap to end) / skips. */
function RoundHud({
  points,
  secondsLeft,
  unlimited,
  skipsLeft,
  hasSkipLimit,
  onEndRound,
}: {
  points: number;
  secondsLeft: number;
  unlimited: boolean;
  skipsLeft: number;
  hasSkipLimit: boolean;
  onEndRound: () => void;
}) {
  const lastTap = useRef(0);

  const onTimerPress = () => {
    if (!unlimited) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_WINDOW_MS) {
      onEndRound();
    }
    lastTap.current = now;
  };

  return (
    <View style={styles.hud}>
      <View style={styles.hudPill}>
        <Icon name="check" size={18} color="#FFFFFF" strokeWidth={3} />
        <AppText variant="headline" color="#FFFFFF">
          {points}
        </AppText>
      </View>
      <Pressable
        onPress={onTimerPress}
        accessibilityLabel={unlimited ? 'Double-tap to end round' : 'Time left'}
      >
        <View style={[styles.hudPill, !unlimited && secondsLeft <= 5 && styles.hudUrgent]}>
          {unlimited ? (
            <Icon name="infinity" size={22} color="#FFFFFF" />
          ) : (
            <AppText variant="title" color="#FFFFFF">
              {secondsLeft}
            </AppText>
          )}
        </View>
      </Pressable>
      <View style={styles.hudPill}>
        <Icon name="skip-forward" size={16} color="#FFFFFF" />
        {hasSkipLimit ? (
          <AppText variant="headline" color="#FFFFFF">
            {skipsLeft}
          </AppText>
        ) : (
          <Icon name="infinity" size={18} color="#FFFFFF" />
        )}
      </View>
    </View>
  );
}

function useRoundEnd(deck: Deck) {
  const router = useRouter();
  const { config, currentEntry, finishRound } = useMatch();
  const { settings } = useSettings();
  const { addCoins, claimDaily, dailyClaimedToday } = useEconomy();
  const sounds = useGameSounds();
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

  return { onEnd, sounds };
}

function Round({ deck }: { deck: Deck }) {
  const { config } = useMatch();
  const { settings } = useSettings();
  const { onEnd, sounds } = useRoundEnd(deck);

  const tilt = useSharedValue(0);
  const [feedback, setFeedback] = useState<{ kind: 'correct' | 'skip'; key: number } | null>(
    null
  );

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
          <RoundHud
            points={engine.points}
            secondsLeft={engine.secondsLeft}
            unlimited={(config?.roundSeconds ?? 0) === 0}
            skipsLeft={engine.skipsLeft}
            hasSkipLimit={!!config && config.maxSkips > 0}
            onEndRound={engine.endRound}
          />

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
          <Icon name="timer" size={88} color="#FFFFFF" strokeWidth={1.75} />
          <AppText variant="display" color="#FFFFFF">
            Time's up!
          </AppText>
        </View>
      )}
    </View>
  );
}

function SoloRound({ deck, config }: { deck: Deck; config: GameConfig }) {
  const { settings } = useSettings();
  const { onEnd, sounds } = useRoundEnd(deck);
  const [guess, setGuess] = useState('');
  const [shake, setShake] = useState(0);

  const engine = useGameEngine({
    cards: deck.hintWords ? deck.cards.filter((c) => deck.hintWords?.[c]) : deck.cards,
    roundSeconds: config.roundSeconds,
    maxSkips: config.maxSkips,
    onEnd,
  });

  useEffect(() => {
    if (engine.phase === 'countdown') {
      sounds.playCountdown();
      tapHaptic(settings.hapticsEnabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.phase, engine.countdown]);

  const onSubmit = () => {
    if (engine.phase !== 'playing' || guess.trim().length === 0) return;
    if (isCloseMatch(guess, engine.card)) {
      sounds.playCorrect();
      correctHaptic(settings.hapticsEnabled);
      engine.markCorrect();
      setGuess('');
    } else {
      setShake((n) => n + 1);
    }
  };

  const onSkip = () => {
    if (engine.phase !== 'playing' || engine.skipsLeft <= 0) return;
    sounds.playSkip();
    skipHaptic(settings.hapticsEnabled);
    engine.markSkip();
    setGuess('');
  };

  const clues = (deck.hintWords?.[engine.card] ?? []).slice(0, config.soloClueCount ?? 2);
  const blanks = engine.card.split('');
  const progress = compareGuessProgress(guess, engine.card);

  return (
    <View style={[styles.round, { backgroundColor: deck.color }]}>
      {engine.phase === 'countdown' && (
        <View style={styles.center}>
          <AppText style={styles.countdown} color="#FFFFFF">
            {engine.countdown}
          </AppText>
          <AppText variant="headline" color="rgba(255,255,255,0.9)">
            Get your clue words ready!
          </AppText>
        </View>
      )}

      {engine.phase === 'playing' && (
        <View style={styles.soloBody}>
          <RoundHud
            points={engine.points}
            secondsLeft={engine.secondsLeft}
            unlimited={config.roundSeconds === 0}
            skipsLeft={engine.skipsLeft}
            hasSkipLimit={config.maxSkips > 0}
            onEndRound={engine.endRound}
          />
          {/* RoundHud is absolutely positioned (shared with the tilt layout) — reserve its space in flow. */}
          <View style={styles.soloHudSpacer} />

          <View style={styles.soloClues}>
            {clues.map((word) => (
              <View key={word} style={styles.clueChip}>
                <AppText variant="headline" color="#FFFFFF">
                  {word}
                </AppText>
              </View>
            ))}
          </View>

          <View key={shake} style={styles.blanksRow}>
            {blanks.map((ch, i) => {
              if (ch === ' ') return <View key={i} style={styles.blankGap} />;
              const status = progress[i];
              return (
                <View
                  key={i}
                  style={[
                    styles.blankTile,
                    status === 'correct' && styles.blankTileCorrect,
                    status === 'incorrect' && styles.blankTileIncorrect,
                  ]}
                >
                  <AppText variant="headline" color="#FFFFFF">
                    {status === 'empty' ? '_' : guess[i].toUpperCase()}
                  </AppText>
                </View>
              );
            })}
          </View>

          <View style={styles.soloInputRow}>
            <TextInput
              value={guess}
              onChangeText={setGuess}
              onSubmitEditing={onSubmit}
              placeholder="Type your guess…"
              placeholderTextColor="rgba(255,255,255,0.6)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              style={styles.soloInput}
              accessibilityLabel="Your guess"
            />
            <Pressable
              onPress={onSubmit}
              accessibilityLabel="Submit guess"
              style={styles.soloSubmit}
            >
              <Icon name="send-horizontal" size={22} color="#1B1B20" />
            </Pressable>
          </View>

          <Pressable onPress={onSkip} accessibilityLabel="Skip card" style={styles.soloSkip}>
            <AppText color="rgba(255,255,255,0.75)">Don't know it — skip</AppText>
          </Pressable>
        </View>
      )}

      {engine.phase === 'ended' && (
        <View style={styles.center}>
          <Icon name="timer" size={88} color="#FFFFFF" strokeWidth={1.75} />
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
      <Icon
        name={kind === 'correct' ? 'check' : 'skip-forward'}
        size={120}
        color="#FFFFFF"
        strokeWidth={2.5}
      />
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
  handoffDeck: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  handoffHint: { marginTop: 4 },
  handoffButton: { alignSelf: 'center', maxWidth: 420, width: '100%', marginTop: 16 },
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
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
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
  soloBody: { flex: 1, padding: 24, gap: 20 },
  soloHudSpacer: { height: 44 },
  soloClues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  clueChip: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  blanksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  blankTile: {
    width: 30,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankTileCorrect: { backgroundColor: 'rgba(48,209,88,0.75)' },
  blankTileIncorrect: { backgroundColor: 'rgba(255,69,58,0.75)' },
  blankGap: { width: 16 },
  soloInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  soloInput: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 17,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  soloSubmit: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soloSkip: { alignSelf: 'center', paddingVertical: 6 },
});
