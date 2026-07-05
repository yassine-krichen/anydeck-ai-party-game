import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { useSettings } from '@/features/settings/settings';

const tickSrc = require('../../../assets/sounds/tick.wav');
const countdownSrc = require('../../../assets/sounds/countdown.wav');
const correctSrc = require('../../../assets/sounds/correct.wav');
const skipSrc = require('../../../assets/sounds/skip.wav');
const roundEndSrc = require('../../../assets/sounds/round-end.wav');

/**
 * Game SFX. Players are kept mounted for zero-latency replay; a party game
 * must beep even when the iPhone mute switch is on, hence the audio mode.
 */
export function useGameSounds() {
  const { settings } = useSettings();

  const tick = useAudioPlayer(tickSrc);
  const countdown = useAudioPlayer(countdownSrc);
  const correct = useAudioPlayer(correctSrc);
  const skip = useAudioPlayer(skipSrc);
  const roundEnd = useAudioPlayer(roundEndSrc);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const play = (player: ReturnType<typeof useAudioPlayer>) => {
    if (!settings.soundsEnabled) return;
    player.seekTo(0).catch(() => {});
    player.play();
  };

  return {
    playTick: () => play(tick),
    playCountdown: () => play(countdown),
    playCorrect: () => play(correct),
    playSkip: () => play(skip),
    playRoundEnd: () => play(roundEnd),
  };
}
