import type { Deck, SharedDeckPayload } from './deck.types';
import { newDeckId } from './deck-storage';

/**
 * Portable deck code: base64 JSON with an ADK1. prefix.
 * Small enough for a QR code up to a few hundred cards; also pasteable as text.
 */
const PREFIX = 'ADK1.';

export function encodeDeck(deck: Deck): string {
  const payload: SharedDeckPayload = {
    v: 1,
    title: deck.title,
    icon: deck.icon,
    color: deck.color,
    description: deck.description,
    lang: deck.lang,
    cards: deck.cards,
  };
  // btoa handles only latin1; route through URI encoding for full unicode.
  return PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeDeck(code: string): Deck | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith(PREFIX)) return null;
    const json = decodeURIComponent(escape(atob(trimmed.slice(PREFIX.length))));
    const payload = JSON.parse(json) as SharedDeckPayload;
    if (payload.v !== 1) return null;
    if (!Array.isArray(payload.cards) || payload.cards.length === 0) return null;
    const cards = payload.cards
      .filter((c): c is string => typeof c === 'string')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && c.length <= 80)
      .slice(0, 2000);
    if (cards.length === 0) return null;
    return {
      id: newDeckId('imported'),
      title: String(payload.title ?? 'Imported deck').slice(0, 60),
      icon: String(payload.icon ?? 'layers').slice(0, 32),
      color: /^#[0-9A-Fa-f]{6}$/.test(String(payload.color)) ? payload.color : '#E54D2E',
      description: String(payload.description ?? '').slice(0, 200),
      lang: String(payload.lang ?? 'en').slice(0, 8),
      premium: false,
      cards,
      source: 'custom',
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}
