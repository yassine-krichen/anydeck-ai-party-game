import { readJson, writeJson } from '@/lib/storage';

import { getBundledDeck } from './deck-registry';
import type { Deck } from './deck.types';

/** Custom + generated + imported decks live in AsyncStorage. */
export async function getUserDecks(): Promise<Deck[]> {
  return readJson<Deck[]>('user-decks', []);
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  const bundled = getBundledDeck(id);
  if (bundled) return bundled;
  const user = await getUserDecks();
  return user.find((d) => d.id === id);
}

export async function saveUserDeck(deck: Deck): Promise<void> {
  const decks = await getUserDecks();
  const idx = decks.findIndex((d) => d.id === deck.id);
  if (idx >= 0) decks[idx] = deck;
  else decks.push(deck);
  await writeJson('user-decks', decks);
}

export async function deleteUserDeck(id: string): Promise<void> {
  const decks = await getUserDecks();
  await writeJson(
    'user-decks',
    decks.filter((d) => d.id !== id)
  );
}

export async function getFavoriteIds(): Promise<string[]> {
  return readJson<string[]>('favorite-decks', []);
}

export async function toggleFavorite(id: string): Promise<string[]> {
  const favs = await getFavoriteIds();
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  await writeJson('favorite-decks', next);
  return next;
}

export function newDeckId(prefix: 'custom' | 'generated' | 'imported'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
