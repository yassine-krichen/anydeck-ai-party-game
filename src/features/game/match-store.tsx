import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { GameConfig, RoundResult, Standing } from './game.types';

/**
 * One "match" = every entry (player/team) playing `roundsPerEntry` rounds.
 * Held in memory only — a match never survives an app restart by design.
 */
interface MatchState {
  config: GameConfig | null;
  rounds: RoundResult[];
  turnIndex: number;
}

interface MatchContextValue extends MatchState {
  totalTurns: number;
  currentEntry: string | null;
  isLastTurn: boolean;
  standings: Standing[];
  startMatch: (config: GameConfig) => void;
  finishRound: (result: RoundResult) => void;
  advanceTurn: () => void;
  resetMatch: () => void;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MatchState>({ config: null, rounds: [], turnIndex: 0 });

  const startMatch = useCallback((config: GameConfig) => {
    setState({ config, rounds: [], turnIndex: 0 });
  }, []);

  const finishRound = useCallback((result: RoundResult) => {
    setState((prev) => ({ ...prev, rounds: [...prev.rounds, result] }));
  }, []);

  const advanceTurn = useCallback(() => {
    setState((prev) => ({ ...prev, turnIndex: prev.turnIndex + 1 }));
  }, []);

  const resetMatch = useCallback(() => {
    setState({ config: null, rounds: [], turnIndex: 0 });
  }, []);

  const value = useMemo<MatchContextValue>(() => {
    const { config, rounds, turnIndex } = state;
    const totalTurns = config ? config.entries.length * config.roundsPerEntry : 0;
    const currentEntry = config ? config.entries[turnIndex % config.entries.length] : null;

    const standings: Standing[] = config
      ? config.entries
          .map((entry) => {
            const own = rounds.filter((r) => r.entry === entry);
            return {
              entry,
              points: own.reduce((s, r) => s + r.points, 0),
              correct: own.reduce((s, r) => s + r.results.filter((c) => c.correct).length, 0),
              skipped: own.reduce((s, r) => s + r.results.filter((c) => !c.correct).length, 0),
            };
          })
          .sort((a, b) => b.points - a.points)
      : [];

    return {
      ...state,
      totalTurns,
      currentEntry,
      isLastTurn: turnIndex >= totalTurns - 1,
      standings,
      startMatch,
      finishRound,
      advanceTurn,
      resetMatch,
    };
  }, [state, startMatch, finishRound, advanceTurn, resetMatch]);

  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside MatchProvider');
  return ctx;
}
