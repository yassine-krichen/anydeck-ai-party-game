export type MatchMode = 'quick' | 'players' | 'teams' | 'solo';

export interface GameConfig {
  deckId: string;
  /** Additional decks whose cards get merged into the play pool. */
  extraDeckIds?: string[];
  mode: MatchMode;
  /** 0 = unlimited (ends on manual endRound() or completing the deck). */
  roundSeconds: number;
  /** 0 = unlimited skips. */
  maxSkips: number;
  /** Player or team names, in turn order. */
  entries: string[];
  /** Rounds each entry plays. */
  roundsPerEntry: number;
  /** Deck identity hidden through setup/handoff, revealed in results. */
  mystery?: boolean;
  /** Solo mode: how many of each card's clue words to reveal (1-4). */
  soloClueCount?: number;
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
