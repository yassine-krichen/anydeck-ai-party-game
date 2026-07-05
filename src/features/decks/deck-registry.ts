import type { Deck, DeckData } from './deck.types';

import animals from './data/animals.json';
import anime from './data/anime.json';
import classic from './data/classic.json';
import countries from './data/countries.json';
import food from './data/food.json';
import football from './data/football.json';
import history from './data/history.json';
import memes from './data/memes.json';
import moviesTv from './data/movies-tv.json';
import programming from './data/programming.json';
import science from './data/science.json';
import videoGames from './data/video-games.json';

const bundledData: DeckData[] = [
  classic as DeckData,
  moviesTv as DeckData,
  videoGames as DeckData,
  anime as DeckData,
  football as DeckData,
  countries as DeckData,
  food as DeckData,
  animals as DeckData,
  science as DeckData,
  history as DeckData,
  programming as DeckData,
  memes as DeckData,
];

export const bundledDecks: Deck[] = bundledData.map((d) => ({ ...d, source: 'bundled' }));

export function getBundledDeck(id: string): Deck | undefined {
  return bundledDecks.find((d) => d.id === id);
}

/** Deterministic "deck of the day" for the daily challenge. */
export function dailyChallengeDeck(date = new Date()): Deck {
  const day = Math.floor(date.getTime() / 86_400_000);
  return bundledDecks[day % bundledDecks.length];
}
