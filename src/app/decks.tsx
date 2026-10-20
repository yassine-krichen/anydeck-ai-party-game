import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { DeckTile } from '@/components/deck-tile';
import { Icon } from '@/components/icon';
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

const MAX_MULTI_DECKS = 4;

export default function DecksScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { state, sessionUnlocks } = useEconomy();
  const [userDecks, setUserDecks] = useState<Deck[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds([]);
  };

  const toggleSelected = (deck: Deck) => {
    const locked = !isDeckPlayable(deck, state, sessionUnlocks);
    if (locked) return;
    setSelectedIds((prev) => {
      if (prev.includes(deck.id)) return prev.filter((id) => id !== deck.id);
      if (prev.length >= MAX_MULTI_DECKS) {
        Alert.alert('Up to 4 decks', `You can mix at most ${MAX_MULTI_DECKS} decks together.`);
        return prev;
      }
      return [...prev, deck.id];
    });
  };

  const onPlaySelected = () => {
    const [deckId, ...extraDeckIds] = selectedIds;
    router.push({
      pathname: '/setup',
      params: { deckId, extraDeckIds: extraDeckIds.join(',') },
    });
  };

  return (
    <Screen>
      <TopBar
        title="Pick a deck"
        right={
          <PressableScale onPress={toggleSelectMode} accessibilityLabel="Toggle multi-select">
            <AppText variant="headline" color={colors.accent}>
              {selectMode ? 'Cancel' : 'Select'}
            </AppText>
          </PressableScale>
        }
      />
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="search" size={18} color={colors.textDim} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search decks"
          placeholderTextColor={colors.textDim}
          style={[styles.search, { color: colors.text }]}
          accessibilityLabel="Search decks"
        />
      </View>
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

      {selectMode && (
        <View style={styles.selectBar}>
          <AppText dim style={styles.selectHint}>
            {selectedIds.length === 0
              ? 'Pick 2 or more decks to mix their cards together'
              : `${selectedIds.length} deck${selectedIds.length === 1 ? '' : 's'} selected`}
          </AppText>
          {selectedIds.length >= 2 && (
            <BigButton
              label={`Play ${selectedIds.length} decks together`}
              icon="layers"
              onPress={onPlaySelected}
            />
          )}
        </View>
      )}

      {decks.map((deck) => (
        <DeckTile
          key={deck.id}
          deck={deck}
          locked={!isDeckPlayable(deck, state, sessionUnlocks)}
          favorite={favorites.includes(deck.id)}
          selected={selectMode ? selectedIds.includes(deck.id) : undefined}
          onPress={() =>
            selectMode
              ? toggleSelected(deck)
              : router.push({ pathname: '/deck/[id]', params: { id: deck.id } })
          }
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  selectBar: { gap: 10, marginBottom: 16 },
  selectHint: { textAlign: 'center' },
  empty: { marginTop: 40 },
});
