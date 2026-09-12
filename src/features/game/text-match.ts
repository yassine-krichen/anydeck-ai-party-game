/** Strips punctuation/casing/extra whitespace so guesses compare fairly. */
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

/** Classic edit-distance DP — small inputs only (card text), no need to optimize further. */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dp[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[rows - 1][cols - 1];
}

/**
 * Solo mode's guess check: exact match after normalizing, or a single-typo
 * tolerance on longer words so a fast, panicked guess under a timer isn't
 * punished for one fat-fingered letter.
 */
export function isCloseMatch(guess: string, answer: string): boolean {
  const g = normalize(guess);
  const a = normalize(answer);
  if (g.length === 0) return false;
  if (g === a) return true;
  return a.length > 4 && levenshtein(g, a) <= 1;
}

export type LetterStatus = 'empty' | 'correct' | 'incorrect';

/** Per-character feedback for solo mode's live guess display, Wordle-style. */
export function compareGuessProgress(guess: string, answer: string): LetterStatus[] {
  return answer.split('').map((answerChar, i) => {
    const guessChar = guess[i];
    if (!guessChar) return 'empty';
    return guessChar.toLowerCase() === answerChar.toLowerCase() ? 'correct' : 'incorrect';
  });
}
