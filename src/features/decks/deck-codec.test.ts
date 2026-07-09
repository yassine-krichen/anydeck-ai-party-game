import { decodeDeck, encodeDeck } from './deck-codec';
import type { Deck } from './deck.types';

const sourceDeck: Deck = {
  id: 'bundled-classic',
  title: 'Classic Mix',
  icon: 'layers',
  color: '#E54D2E',
  description: 'A bit of everything.',
  lang: 'en',
  premium: false,
  cards: ['Superman', 'Pizza', 'A giraffe'],
  source: 'bundled',
};

describe('encodeDeck / decodeDeck', () => {
  it('round-trips title, cards, and cosmetic fields through a share code', () => {
    const code = encodeDeck(sourceDeck);
    const decoded = decodeDeck(code);

    expect(decoded).not.toBeNull();
    expect(decoded?.title).toBe(sourceDeck.title);
    expect(decoded?.icon).toBe(sourceDeck.icon);
    expect(decoded?.color).toBe(sourceDeck.color);
    expect(decoded?.lang).toBe(sourceDeck.lang);
    expect(decoded?.cards).toEqual(sourceDeck.cards);
  });

  it('always imports as a free custom deck regardless of the source deck', () => {
    const decoded = decodeDeck(encodeDeck(sourceDeck));

    expect(decoded?.source).toBe('custom');
    expect(decoded?.premium).toBe(false);
    expect(decoded?.id).not.toBe(sourceDeck.id);
  });

  it('rejects a code with the wrong prefix', () => {
    expect(decodeDeck('NOTADECK.abcdef')).toBeNull();
  });

  it('rejects malformed base64 payloads', () => {
    expect(decodeDeck('ADK1.not-valid-base64!!!')).toBeNull();
  });

  it('rejects a payload with no cards', () => {
    const emptyDeck: Deck = { ...sourceDeck, cards: [] };
    expect(decodeDeck(encodeDeck(emptyDeck))).toBeNull();
  });

  it('rejects a payload from a future codec version', () => {
    const futurePayload = { v: 2, title: 'x', cards: ['a'] };
    const code = 'ADK1.' + btoa(JSON.stringify(futurePayload));
    expect(decodeDeck(code)).toBeNull();
  });
});
