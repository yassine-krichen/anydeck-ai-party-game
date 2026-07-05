export type MatchMode = 'quick' | 'players' | 'teams';

export interface GameConfig {
  deckId: string;
  mode: MatchMode;
  roundSeconds: number;
  /** 0 = unlimited skips. */
  maxSkips: number;
  /** Player or team names, in turn order. */
  entries: string[];
  /** Rounds each entry plays. */
  roundsPerEntry: number;
}

export interface CardResult {
  card: string;
  correct: boolean;
}

export interface RoundResult {
  entry: string;
  deckId: string;
  results: CardResult[];
  points: number;
  bestStreak: number;
}

export interface Standing {
  entry: string;
  points: number;
  correct: number;
  skipped: number;
}
