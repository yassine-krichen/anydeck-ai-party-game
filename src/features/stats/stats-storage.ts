import { readJson, writeJson } from '@/lib/storage';

export interface Stats {
  matchesPlayed: number;
  roundsPlayed: number;
  totalCorrect: number;
  totalSkipped: number;
  bestRoundScore: number;
  bestStreak: number;
  /** deckId -> rounds played with it. */
  deckPlays: Record<string, number>;
  /** player name -> matches won / played (multiplayer only). */
  playerWins: Record<string, number>;
  playerGames: Record<string, number>;
}

export const emptyStats: Stats = {
  matchesPlayed: 0,
  roundsPlayed: 0,
  totalCorrect: 0,
  totalSkipped: 0,
  bestRoundScore: 0,
  bestStreak: 0,
  deckPlays: {},
  playerWins: {},
  playerGames: {},
};

export async function getStats(): Promise<Stats> {
  const stored = await readJson<Stats>('stats', emptyStats);
  return { ...emptyStats, ...stored };
}

export async function recordRound(input: {
  deckId: string;
  correct: number;
  skipped: number;
  points: number;
  bestStreak: number;
}): Promise<void> {
  const stats = await getStats();
  stats.roundsPlayed += 1;
  stats.totalCorrect += input.correct;
  stats.totalSkipped += input.skipped;
  stats.bestRoundScore = Math.max(stats.bestRoundScore, input.points);
  stats.bestStreak = Math.max(stats.bestStreak, input.bestStreak);
  stats.deckPlays[input.deckId] = (stats.deckPlays[input.deckId] ?? 0) + 1;
  await writeJson('stats', stats);
}

export async function recordMatch(input: {
  entries: string[];
  winners: string[];
}): Promise<void> {
  const stats = await getStats();
  stats.matchesPlayed += 1;
  for (const name of input.entries) {
    stats.playerGames[name] = (stats.playerGames[name] ?? 0) + 1;
  }
  for (const name of input.winners) {
    stats.playerWins[name] = (stats.playerWins[name] ?? 0) + 1;
  }
  await writeJson('stats', stats);
}
