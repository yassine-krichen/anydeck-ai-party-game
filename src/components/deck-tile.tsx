import { StyleSheet, View } from 'react-native';

import type { Deck } from '@/features/decks/deck.types';
import { useAppTheme } from '@/features/theme/use-app-theme';

import { AppText } from './app-text';
import { PressableScale } from './pressable-scale';

interface DeckTileProps {
  deck: Deck;
  locked: boolean;
  favorite: boolean;
  onPress: () => void;
}

/** Deck card in the browser grid: emoji badge on the deck's own color. */
export function DeckTile({ deck, locked, favorite, onPress }: DeckTileProps) {
  const { colors } = useAppTheme();

  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${deck.title} deck`} style={styles.wrap}>
      <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.badge, { backgroundColor: deck.color }]}>
          <AppText style={styles.emoji}>{deck.emoji}</AppText>
        </View>
        <View style={styles.meta}>
          <View style={styles.titleRow}>
            <AppText variant="headline" numberOfLines={1} style={styles.title}>
              {deck.title}
            </AppText>
            {favorite && <AppText variant="caption">⭐</AppText>}
            {locked && <AppText variant="caption">🔒</AppText>}
          </View>
          <AppText variant="caption" dim numberOfLines={1}>
            {deck.cards.length} cards
            {deck.source !== 'bundled' ? ` · ${deck.source}` : deck.premium ? ' · premium' : ''}
          </AppText>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  meta: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1 },
});
