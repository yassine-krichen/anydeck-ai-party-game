import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { DeckTile } from '@/components/deck-tile';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { bundledDecks } from '@/features/decks/deck-registry';
import { getFavoriteIds, getUserDecks } from '@/features/decks/deck-storage';
import type { Deck } from '@/features/decks/deck.types';
import { isDeckPlayable, useEconomy } from '@/features/economy/economy';
import { useAppTheme } from '@/features/theme/use-app-theme';

type Filter = 'all' | 'free' | 'favorites' | 'mine';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'mine', label: 'My decks' },
];

export default function DecksScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { state, sessionUnlocks } = useEconomy();
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(
    useCallback(() => {
      getUserDecks().then(setUserDecks);
      getFavoriteIds().then(setFavorites);
    }, [])
  );

  const decks = useMemo(() => {
    const all = [...userDecks, ...bundledDecks];
    const q = query.trim().toLowerCase();
    return all.filter((deck) => {
      if (q && !`${deck.title} ${deck.description}`.toLowerCase().includes(q)) return false;
      switch (filter) {
        case 'free':
          return !deck.premium;
        case 'favorites':
          return favorites.includes(deck.id);
        case 'mine':
          return deck.source !== 'bundled';
        default:
          return true;
      }
    });
  }, [userDecks, favorites, query, filter]);

  return (
    <Screen>
      <TopBar title="Pick a deck" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search decks"
        placeholderTextColor={colors.textDim}
        style={[
          styles.search,
          { backgroundColor: colors.surfaceAlt, color: colors.text },
        ]}
        accessibilityLabel="Search decks"
      />
      <View style={styles.filters}>
        {filters.map((f) => (
          <PressableScale key={f.id} onPress={() => setFilter(f.id)}>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: filter === f.id ? colors.accent : colors.surfaceAlt,
                },
              ]}
            >
              <AppText
                variant="caption"
                color={filter === f.id ? colors.onAccent : colors.text}
              >
                {f.label}
              </AppText>
            </View>
          </PressableScale>
        ))}
      </View>

      {decks.map((deck) => (
        <DeckTile
          key={deck.id}
          deck={deck}
          locked={!isDeckPlayable(deck, state, sessionUnlocks)}
          favorite={favorites.includes(deck.id)}
          onPress={() => router.push({ pathname: '/deck/[id]', params: { id: deck.id } })}
        />
      ))}
      {decks.length === 0 && (
        <AppText dim center style={styles.empty}>
          No decks match. Create one or generate one with AI.
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  empty: { marginTop: 40 },
});
