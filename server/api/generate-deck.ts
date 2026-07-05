/**
 * AI deck generation endpoint — AnyDeck's core differentiator.
 *
 * POST { topic: string, lang?: string, count?: number }
 * → { title, icon, color, description, lang, cards[] }
 *
 * Uses Gemini 2.5 Flash (free tier via a Google AI Studio key) over plain
 * REST — zero dependencies. Deploy as a Vercel function or any Web-standard
 * runtime with GEMINI_API_KEY set; the key never ships in the mobile app.
 */
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MAX_TOPIC_LENGTH = 120;
const MIN_CARDS = 10;
const MAX_CARDS = 60;

/** Icon names the mobile app's registry can render. */
const allowedIcons = [
  'party-popper', 'clapperboard', 'gamepad', 'swords', 'trophy', 'earth',
  'pizza', 'paw-print', 'atom', 'landmark', 'terminal', 'laugh', 'music',
  'heart', 'star', 'zap', 'ghost', 'briefcase', 'graduation-cap', 'map-pin',
  'camera', 'layers',
];

/**
 * Best-effort in-memory rate limit (per serverless instance). Good enough
 * for launch traffic; swap for Upstash Redis when volume justifies it.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return false;
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: 'Short catchy deck title, max 40 chars' },
    icon: { type: 'STRING', enum: allowedIcons },
    color: { type: 'STRING', description: 'Vivid but tasteful hex color, format #RRGGBB' },
    description: { type: 'STRING', description: 'One-line deck description' },
    cards: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'icon', 'color', 'description', 'cards'],
};

const SYSTEM_PROMPT =
  'You generate card decks for a "phone on forehead" party guessing game ' +
  '(like Heads Up / charades). Players see the card and give verbal clues; ' +
  'the guesser must say the exact answer. Cards must be: guessable in under ' +
  'a minute by regular people who know the topic, concrete (names, titles, ' +
  'things — never abstract sentences), 1-5 words each, all distinct, and ' +
  'family-friendly. Mix easy, medium and a few hard cards. Write cards in ' +
  'the requested language. Pick the icon that best matches the topic.';

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Server is not configured.' }, 500);

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

  const clientKey =
    request.headers.get('x-anydeck-device') ??
    request.headers.get('x-forwarded-for') ??
    'unknown';
  if (rateLimited(clientKey)) {
    return json({ error: 'Too many decks this hour — take a break and play one!' }, 429);
  }

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          parts: [
            { text: `Topic: ${topic}\nLanguage: ${lang}\nNumber of cards: ${count}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 1.0,
      },
    }),
  });

  if (!geminiResponse.ok) {
    if (geminiResponse.status === 429) {
      return json({ error: 'The AI is busy right now — try again in a minute.' }, 503);
    }
    return json({ error: 'Generation failed, try again.' }, 502);
  }

  const result = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return json({ error: 'Generation failed, try again.' }, 502);

  let deck: { title: string; icon: string; color: string; description: string; cards: string[] };
  try {
    deck = JSON.parse(text);
  } catch {
    return json({ error: 'Generation failed, try again.' }, 502);
  }

  const cards = (Array.isArray(deck.cards) ? deck.cards : [])
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c.length <= 60);
  if (cards.length < MIN_CARDS) {
    return json({ error: 'Not enough good cards for that topic — try rephrasing it.' }, 422);
  }

  return json(
    {
      title: String(deck.title).slice(0, 40),
      icon: allowedIcons.includes(deck.icon) ? deck.icon : 'layers',
      color: /^#[0-9A-Fa-f]{6}$/.test(deck.color) ? deck.color : '#E54D2E',
      description: String(deck.description).slice(0, 120),
      lang,
      cards: [...new Set(cards)].slice(0, MAX_CARDS),
    },
    200
  );
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
