import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { readJson, writeJson } from '@/lib/storage';

/**
 * Local coin economy + entitlements.
 *
 * Real payments are intentionally behind one seam: `purchaseDeck`,
 * `purchaseSubscription` and `showRewardedAd` are the only three functions
 * that need a RevenueCat/AdMob implementation before store release.
 * Everything else (coins, cosmetics, daily challenge) is fully local.
 */
export interface EconomyState {
  coins: number;
  ownedDeckIds: string[];
  ownedAccentIds: string[];
  subscriptionActive: boolean;
  /** ISO date (yyyy-mm-dd) of last claimed daily challenge. */
  lastDailyClaim: string | null;
}

const initialState: EconomyState = {
  coins: 100,
  ownedDeckIds: [],
  ownedAccentIds: ['coral'],
  subscriptionActive: false,
  lastDailyClaim: null,
};

interface EconomyContextValue {
  state: EconomyState;
  /** Decks temporarily unlocked this session via rewarded ad. */
  sessionUnlocks: string[];
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  unlockAccent: (accentId: string, price: number) => boolean;
  /** Payment seam — replace stub with RevenueCat purchase. */
  purchaseDeck: (deckId: string) => Promise<boolean>;
  purchaseSubscription: () => Promise<boolean>;
  /** Ad seam — replace stub with AdMob rewarded ad. Unlocks deck for this session. */
  showRewardedAd: (deckId: string) => Promise<boolean>;
  claimDaily: (reward: number) => boolean;
  dailyClaimedToday: boolean;
}

const EconomyContext = createContext<EconomyContextValue | null>(null);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EconomyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EconomyState>(initialState);
  const [sessionUnlocks, setSessionUnlocks] = useState<string[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    readJson<EconomyState>('economy', initialState).then((stored) => {
      setState({ ...initialState, ...stored });
      loaded.current = true;
    });
  }, []);

  const persist = useCallback((updater: (prev: EconomyState) => EconomyState) => {
    setState((prev) => {
      const next = updater(prev);
      writeJson('economy', next);
      return next;
    });
  }, []);

  const addCoins = useCallback(
    (amount: number) => persist((p) => ({ ...p, coins: p.coins + amount })),
    [persist]
  );

  const spendCoins = useCallback(
    (amount: number) => {
      let ok = false;
      persist((p) => {
        if (p.coins < amount) return p;
        ok = true;
        return { ...p, coins: p.coins - amount };
      });
      return ok;
    },
    [persist]
  );

  const unlockAccent = useCallback(
    (accentId: string, price: number) => {
      let ok = false;
      persist((p) => {
        if (p.ownedAccentIds.includes(accentId)) {
          ok = true;
          return p;
        }
        if (p.coins < price) return p;
        ok = true;
        return {
          ...p,
          coins: p.coins - price,
          ownedAccentIds: [...p.ownedAccentIds, accentId],
        };
      });
      return ok;
    },
    [persist]
  );

  const purchaseDeck = useCallback(
    async (deckId: string) => {
      // STUB: call RevenueCat here. Grant on confirmed transaction only.
      persist((p) =>
        p.ownedDeckIds.includes(deckId)
          ? p
          : { ...p, ownedDeckIds: [...p.ownedDeckIds, deckId] }
      );
      return true;
    },
    [persist]
  );

  const purchaseSubscription = useCallback(async () => {
    // STUB: call RevenueCat here.
    persist((p) => ({ ...p, subscriptionActive: true }));
    return true;
  }, [persist]);

  const showRewardedAd = useCallback(async (deckId: string) => {
    // STUB: show AdMob rewarded ad here; grant only on reward callback.
    setSessionUnlocks((prev) => (prev.includes(deckId) ? prev : [...prev, deckId]));
    return true;
  }, []);

  const dailyClaimedToday = state.lastDailyClaim === today();

  const claimDaily = useCallback(
    (reward: number) => {
      let ok = false;
      persist((p) => {
        if (p.lastDailyClaim === today()) return p;
        ok = true;
        return { ...p, coins: p.coins + reward, lastDailyClaim: today() };
      });
      return ok;
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      state,
      sessionUnlocks,
      addCoins,
      spendCoins,
      unlockAccent,
      purchaseDeck,
      purchaseSubscription,
      showRewardedAd,
      claimDaily,
      dailyClaimedToday,
    }),
    [
      state,
      sessionUnlocks,
      addCoins,
      spendCoins,
      unlockAccent,
      purchaseDeck,
      purchaseSubscription,
      showRewardedAd,
      claimDaily,
      dailyClaimedToday,
    ]
  );

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
}

export function useEconomy(): EconomyContextValue {
  const ctx = useContext(EconomyContext);
  if (!ctx) throw new Error('useEconomy must be used inside EconomyProvider');
  return ctx;
}

export function isDeckPlayable(
  deck: { premium: boolean; id: string; source: string },
  economy: EconomyState,
  sessionUnlocks: string[]
): boolean {
  if (!deck.premium || deck.source !== 'bundled') return true;
  return (
    economy.subscriptionActive ||
    economy.ownedDeckIds.includes(deck.id) ||
    sessionUnlocks.includes(deck.id)
  );
}
