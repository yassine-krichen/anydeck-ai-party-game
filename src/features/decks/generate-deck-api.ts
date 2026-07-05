import type { Deck } from './deck.types';
import { newDeckId } from './deck-storage';

/**
 * Client for the AnyDeck generation API (server/api/generate-deck.ts).
 * Result-object style: screens react to { deck, error }, never throw.
 */
const API_URL = process.env.EXPO_PUBLIC_ANYDECK_API_URL;

export function isGenerationConfigured(): boolean {
  return typeof API_URL === 'string' && API_URL.length > 0;
}

export async function generateDeck(input: {
  topic: string;
  lang: string;
  count: number;
}): Promise<{ deck: Deck | null; error: string | null }> {
  if (!isGenerationConfigured()) {
    return {
      deck: null,
      error:
        'AI generation is not configured. Deploy the server in /server and set EXPO_PUBLIC_ANYDECK_API_URL.',
    };
  }
  try {
    const response = await fetch(`${API_URL}/api/generate-deck`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as {
      error?: string;
      title?: string;
      emoji?: string;
      color?: string;
      description?: string;
      cards?: string[];
    };
    if (!response.ok || !Array.isArray(data.cards)) {
      return { deck: null, error: data.error ?? 'Generation failed. Try again.' };
    }
    return {
      deck: {
        id: newDeckId('generated'),
        title: String(data.title ?? input.topic).slice(0, 60),
        emoji: String(data.emoji ?? '✨').slice(0, 8),
        color: /^#[0-9A-Fa-f]{6}$/.test(String(data.color)) ? String(data.color) : '#BF5AF2',
        description: String(data.description ?? `AI deck about ${input.topic}`),
        lang: input.lang,
        premium: false,
        cards: data.cards.filter((c) => typeof c === 'string' && c.trim().length > 0),
        source: 'generated',
        createdAt: Date.now(),
      },
      error: null,
    };
  } catch {
    return { deck: null, error: 'Could not reach the server. Check your connection.' };
  }
}
