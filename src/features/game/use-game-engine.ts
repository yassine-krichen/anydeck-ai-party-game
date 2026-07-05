import { useCallback, useEffect, useRef, useState } from 'react';

import type { CardResult } from './game.types';

export type GamePhase = 'countdown' | 'playing' | 'ended';

interface EngineOptions {
  cards: string[];
  roundSeconds: number;
  /** 0 = unlimited. */
  maxSkips: number;
  onSecondTick?: (secondsLeft: number) => void;
  onEnd?: (summary: EngineSummary) => void;
}

export interface EngineSummary {
  results: CardResult[];
  points: number;
  bestStreak: number;
}

interface EngineState {
  phase: GamePhase;
  countdown: number;
  secondsLeft: number;
  card: string;
  results: CardResult[];
  points: number;
  streak: number;
  bestStreak: number;
  skipsUsed: number;
}

const COUNTDOWN_SECONDS = 3;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * One round: countdown → playing → ended. Pure game logic — no sensors,
 * sounds, or navigation, so it's testable and the play screen stays thin.
 */
export function useGameEngine({ cards, roundSeconds, maxSkips, onSecondTick, onEnd }: EngineOptions) {
  const queue = useRef<string[]>([]);
  const queuePos = useRef(0);
  const endAt = useRef(0);
  const callbacks = useRef({ onSecondTick, onEnd });
  callbacks.current = { onSecondTick, onEnd };

  const [state, setState] = useState<EngineState>({
    phase: 'countdown',
    countdown: COUNTDOWN_SECONDS,
    secondsLeft: roundSeconds,
    card: '',
    results: [],
    points: 0,
    streak: 0,
    bestStreak: 0,
    skipsUsed: 0,
  });

  const nextCard = useCallback((): string => {
    if (queuePos.current >= queue.current.length) {
      queue.current = shuffle(queue.current);
      queuePos.current = 0;
    }
    const card = queue.current[queuePos.current];
    queuePos.current += 1;
    return card;
  }, []);

  // Countdown phase.
  useEffect(() => {
    queue.current = shuffle(cards);
    queuePos.current = 0;
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'countdown') return prev;
        if (prev.countdown > 1) return { ...prev, countdown: prev.countdown - 1 };
        clearInterval(interval);
        endAt.current = Date.now() + roundSeconds * 1000;
        return { ...prev, phase: 'playing', card: nextCard() };
      });
    }, 1000);
    return () => clearInterval(interval);
    // Intentionally runs once per mount: a round never restarts in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Round timer.
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'playing') return prev;
        const secondsLeft = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
        if (secondsLeft !== prev.secondsLeft && secondsLeft > 0) {
          callbacks.current.onSecondTick?.(secondsLeft);
        }
        if (secondsLeft <= 0) {
          clearInterval(interval);
          const summary: EngineSummary = {
            results: prev.results,
            points: prev.points,
            bestStreak: prev.bestStreak,
          };
          callbacks.current.onEnd?.(summary);
          return { ...prev, phase: 'ended', secondsLeft: 0 };
        }
        return secondsLeft === prev.secondsLeft ? prev : { ...prev, secondsLeft };
      });
    }, 200);
    return () => clearInterval(interval);
  }, [state.phase]);

  const markCorrect = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;
      const streak = prev.streak + 1;
      return {
        ...prev,
        results: [...prev.results, { card: prev.card, correct: true }],
        points: prev.points + 1,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
        card: nextCard(),
      };
    });
  }, [nextCard]);

  const markSkip = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'playing') return prev;
      if (maxSkips > 0 && prev.skipsUsed >= maxSkips) return prev;
      return {
        ...prev,
        results: [...prev.results, { card: prev.card, correct: false }],
        streak: 0,
        skipsUsed: prev.skipsUsed + 1,
        card: nextCard(),
      };
    });
  }, [maxSkips, nextCard]);

  const skipsLeft = maxSkips > 0 ? maxSkips - state.skipsUsed : Infinity;

  return { ...state, skipsLeft, markCorrect, markSkip };
}
