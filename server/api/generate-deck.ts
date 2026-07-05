import Anthropic from '@anthropic-ai/sdk';

/**
 * AI deck generation endpoint — AnyDeck's core differentiator.
 *
 * POST { topic: string, lang?: string, count?: number }
 * → { title, emoji, color, description, lang, cards[] }
 *
 * Deploy as a Vercel function (or any Web-standard runtime).
 * Requires ANTHROPIC_API_KEY in the server environment — the key never
 * ships in the mobile app.
 *
 * TODO before production: add rate limiting (per-device token or IP) and
 * receipt validation so only paying/entitled users can generate.
 */
const client = new Anthropic();

const MAX_TOPIC_LENGTH = 120;
const MIN_CARDS = 10;
const MAX_CARDS = 60;

const deckSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short catchy deck title, max 40 chars' },
    emoji: { type: 'string', description: 'One emoji representing the topic' },
    color: {
      type: 'string',
      description: 'Vivid hex color matching the topic, format #RRGGBB',
    },
    description: { type: 'string', description: 'One-line deck description' },
    cards: {
      type: 'array',
      description: 'Guessable answers for the forehead game',
      items: { type: 'string' },
    },
  },
  required: ['title', 'emoji', 'color', 'description', 'cards'],
  additionalProperties: false,
} as const;

export async function POST(request: Request): Promise<Response> {
  let body: { topic?: unknown; lang?: unknown; count?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const lang = typeof body.lang === 'string' ? body.lang.slice(0, 8) : 'en';
  const count = clamp(Number(body.count) || 40, MIN_CARDS, MAX_CARDS);

  if (topic.length === 0 || topic.length > MAX_TOPIC_LENGTH) {
    return json({ error: `Topic must be 1-${MAX_TOPIC_LENGTH} characters` }, 400);
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system:
      'You generate card decks for a "phone on forehead" party guessing game ' +
      '(like Heads Up / charades). Players see the card and give verbal clues; ' +
      'the guesser must say the exact answer. Cards must be: guessable in under ' +
      'a minute by regular people who know the topic, concrete (names, titles, ' +
      'things — never abstract sentences), 1-5 words each, all distinct, and ' +
      'family-friendly. Mix easy, medium and a few hard cards. Write cards in ' +
      'the requested language.',
    messages: [
      {
        role: 'user',
        content: `Topic: ${topic}\nLanguage: ${lang}\nNumber of cards: ${count}`,
      },
    ],
    output_config: {
      format: { type: 'json_schema', schema: deckSchema },
    },
  });

  if (response.stop_reason === 'refusal') {
    return json({ error: 'That topic cannot be turned into a deck.' }, 422);
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return json({ error: 'Generation failed, try again.' }, 502);
  }

  const deck = JSON.parse(textBlock.text) as {
    title: string;
    emoji: string;
    color: string;
    description: string;
    cards: string[];
  };

  return json({ ...deck, lang, cards: deck.cards.slice(0, MAX_CARDS) }, 200);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
