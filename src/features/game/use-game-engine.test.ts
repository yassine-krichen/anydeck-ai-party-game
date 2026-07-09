import { act, renderHook } from '@testing-library/react-native';

import { useGameEngine } from './use-game-engine';

const CARDS = ['a', 'b', 'c', 'd', 'e'];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Advances past the fixed 3s countdown into the playing phase. */
async function skipCountdown() {
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
}

describe('useGameEngine', () => {
  it('starts in countdown and moves to playing once it reaches zero', async () => {
    const { result } = await renderHook(() =>
      useGameEngine({ cards: CARDS, roundSeconds: 60, maxSkips: 0 })
    );

    expect(result.current.phase).toBe('countdown');
    await skipCountdown();
    expect(result.current.phase).toBe('playing');
    expect(CARDS).toContain(result.current.card);
  });

  it('awards a point and extends the streak on markCorrect', async () => {
    const { result } = await renderHook(() =>
      useGameEngine({ cards: CARDS, roundSeconds: 60, maxSkips: 0 })
    );
    await skipCountdown();

    await act(async () => result.current.markCorrect());
    expect(result.current.points).toBe(1);
    expect(result.current.bestStreak).toBe(1);

    await act(async () => result.current.markCorrect());
    expect(result.current.points).toBe(2);
    expect(result.current.bestStreak).toBe(2);
  });

  it('resets the streak on markSkip without changing points', async () => {
    const { result } = await renderHook(() =>
      useGameEngine({ cards: CARDS, roundSeconds: 60, maxSkips: 0 })
    );
    await skipCountdown();

    await act(async () => result.current.markCorrect());
    await act(async () => result.current.markSkip());

    expect(result.current.points).toBe(1);
    expect(result.current.bestStreak).toBe(1);
    expect(result.current.results.at(-1)).toEqual({ card: expect.any(String), correct: false });
  });

  it('blocks further skips once maxSkips is reached', async () => {
    const { result } = await renderHook(() =>
      useGameEngine({ cards: CARDS, roundSeconds: 60, maxSkips: 1 })
    );
    await skipCountdown();

    expect(result.current.skipsLeft).toBe(1);
    await act(async () => result.current.markSkip());
    expect(result.current.skipsLeft).toBe(0);

    const cardBeforeBlockedSkip = result.current.card;
    await act(async () => result.current.markSkip());
    expect(result.current.card).toBe(cardBeforeBlockedSkip);
    expect(result.current.results).toHaveLength(1);
  });

  it('ends the round when the timer runs out and reports a summary', async () => {
    const onEnd = jest.fn();
    const { result } = await renderHook(() =>
      useGameEngine({ cards: CARDS, roundSeconds: 5, maxSkips: 0, onEnd })
    );
    await skipCountdown();

    await act(async () => result.current.markCorrect());
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.phase).toBe('ended');
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ points: 1, bestStreak: 1, results: expect.any(Array) })
    );
  });
});
