import { compareGuessProgress, isCloseMatch } from './text-match';

describe('isCloseMatch', () => {
  it('matches exact answers case-insensitively', () => {
    expect(isCloseMatch('Giraffe', 'Giraffe')).toBe(true);
    expect(isCloseMatch('giraffe', 'Giraffe')).toBe(true);
    expect(isCloseMatch('  giraffe  ', 'Giraffe')).toBe(true);
  });

  it('ignores punctuation differences', () => {
    expect(isCloseMatch('beyonce', 'Beyoncé')).toBe(true);
    expect(isCloseMatch('blue screen of death', 'The blue screen of death.')).toBe(false);
  });

  it('tolerates a single typo on longer words', () => {
    expect(isCloseMatch('giraffee', 'Giraffe')).toBe(true);
    expect(isCloseMatch('istanbol', 'Istanbul')).toBe(true);
  });

  it('rejects a wrong guess with more than one typo', () => {
    expect(isCloseMatch('grfaffee', 'Giraffe')).toBe(false);
  });

  it('does not apply typo tolerance to short answers', () => {
    // "Bee" (3 letters) with a 1-char typo would otherwise match "See"/"Bet" etc — too loose for short words.
    expect(isCloseMatch('see', 'Bee')).toBe(false);
  });

  it('rejects an empty guess', () => {
    expect(isCloseMatch('', 'Giraffe')).toBe(false);
    expect(isCloseMatch('   ', 'Giraffe')).toBe(false);
  });

  it('rejects unrelated words', () => {
    expect(isCloseMatch('elephant', 'Giraffe')).toBe(false);
  });
});

describe('compareGuessProgress', () => {
  it('marks every letter empty for an empty guess', () => {
    expect(compareGuessProgress('', 'cat')).toEqual(['empty', 'empty', 'empty']);
  });

  it('marks trailing letters empty when the guess is shorter than the answer', () => {
    expect(compareGuessProgress('ca', 'cat')).toEqual(['correct', 'correct', 'empty']);
  });

  it('ignores extra guess characters when the guess is longer than the answer', () => {
    expect(compareGuessProgress('catnip', 'cat')).toEqual(['correct', 'correct', 'correct']);
  });

  it('matches letters case-insensitively', () => {
    expect(compareGuessProgress('CAT', 'cat')).toEqual(['correct', 'correct', 'correct']);
  });

  it('marks a mismatched letter incorrect', () => {
    expect(compareGuessProgress('cot', 'cat')).toEqual(['correct', 'incorrect', 'correct']);
  });

  it('marks a space as correct only when the guess has a space at the same index', () => {
    expect(compareGuessProgress('the cat', 'the cat')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
    expect(compareGuessProgress('thexcat', 'the cat')).toEqual([
      'correct',
      'correct',
      'correct',
      'incorrect',
      'correct',
      'correct',
      'correct',
    ]);
  });
});
