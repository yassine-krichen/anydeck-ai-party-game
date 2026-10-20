import { StyleSheet, View } from 'react-native';

import type { Deck } from '@/features/decks/deck.types';
import { useAppTheme } from '@/features/theme/use-app-theme';

import { AppText } from './app-text';
import { Icon } from './icon';
import { PressableScale } from './pressable-scale';

interface DeckTileProps {
  deck: Deck;
  locked: boolean;
  favorite: boolean;
  onPress: () => void;
  /** Undefined = normal browse mode. Boolean = multi-select mode, checked state. */
  selected?: boolean;
}

/** Deck row in the browser: solid color badge, title, meta, trailing state. */
export function DeckTile({ deck, locked, favorite, onPress, selected }: DeckTileProps) {
  const { colors } = useAppTheme();
  const selectMode = selected !== undefined;

  const meta = [
    `${deck.cards.length} cards`,
    deck.source !== 'bundled' ? deck.source : deck.premium ? 'Premium' : 'Free',
  ].join('  ·  ');

  return (
    <PressableScale onPress={onPress} accessibilityLabel={`${deck.title} deck`} style={styles.wrap}>
      <View
        style={[
          styles.tile,
          { backgroundColor: colors.surface, borderColor: colors.border },
          selectMode && selected && { borderColor: colors.accent, borderWidth: 2 },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: deck.color }]}>
          <Icon name={deck.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.meta}>
          <AppText variant="headline" numberOfLines={1}>
            {deck.title}
          </AppText>
          <AppText variant="caption" dim numberOfLines={1}>
            {meta}
          </AppText>
        </View>
        <View style={styles.trailing}>
          {selectMode ? (
            <View
              style={[
                styles.checkbox,
                { borderColor: selected ? colors.accent : colors.border },
                selected && { backgroundColor: colors.accent },
              ]}
            >
              {selected && <Icon name="check" size={14} color={colors.onAccent} strokeWidth={3} />}
            </View>
          ) : (
            <>
              {favorite && <Icon name="star" size={16} color={colors.gold} fill={colors.gold} />}
              {locked ? (
                <Icon name="lock" size={16} color={colors.textDim} />
              ) : (
                <Icon name="chevron-right" size={18} color={colors.textDim} />
              )}
            </>
          )}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 3 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
