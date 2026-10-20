export type DeckSource = 'bundled' | 'custom' | 'generated';

export interface Deck {
  id: string;
  title: string;
  /** Lucide icon name from the app's icon registry. */
  icon: string;
  /** Accent color used across the deck's UI and the play screen. */
  color: string;
  description: string;
  /** BCP-47-ish language tag: 'en', 'fr', 'ar', ... */
  lang: string;
  premium: boolean;
  cards: string[];
  /**
   * Solo mode clue words, keyed by card text. Each entry is 4 indirect
   * words (vaguest first) — never the answer or an obvious synonym.
   * Optional: decks without coverage simply don't offer solo mode.
   */
  hintWords?: Record<string, string[]>;
  source: DeckSource;
  createdAt?: number;
}

/** Shape of the bundled JSON files (source is implied). */
export type DeckData = Omit<Deck, 'source'>;

/** Portable format for QR / link sharing. Versioned so old apps can reject newer payloads. */
export interface SharedDeckPayload {
  v: 1;
  title: string;
  icon: string;
  color: string;
  description: string;
  lang: string;
  cards: string[];
}
