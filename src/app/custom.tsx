import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon, type IconName } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { getDeck, newDeckId, saveUserDeck } from '@/features/decks/deck-storage';
import { useAppTheme } from '@/features/theme/use-app-theme';

const iconOptions: IconName[] = [
  'party-popper',
  'music',
  'heart',
  'star',
  'zap',
  'ghost',
  'briefcase',
  'graduation-cap',
  'map-pin',
  'camera',
];
const colorOptions = ['#E54D2E', '#0B68CB', '#6E56CF', '#3D9A50', '#E8590C', '#0F7B6C'];

export default function CustomDeckScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const [deckId, setDeckId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<string>('party-popper');
  const [color, setColor] = useState('#E54D2E');
  const [cardsText, setCardsText] = useState('');

  useEffect(() => {
    if (!id) return;
    getDeck(id).then((deck) => {
      if (!deck || deck.source === 'bundled') return;
      setDeckId(deck.id);
      setTitle(deck.title);
      setIcon(deck.icon);
      setColor(deck.color);
      setCardsText(deck.cards.join('\n'));
    });
  }, [id]);

  const cards = cardsText
    .split('\n')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const onSave = async () => {
    if (title.trim().length === 0) {
      Alert.alert('Name your deck', 'Give the deck a title first.');
      return;
    }
    if (cards.length < 5) {
      Alert.alert('More cards needed', 'A playable deck needs at least 5 cards.');
      return;
    }
    await saveUserDeck({
      id: deckId ?? newDeckId('custom'),
      title: title.trim(),
      icon,
      color,
      description: `Custom deck · ${cards.length} cards`,
      lang: 'en',
      premium: false,
      cards,
      source: 'custom',
      createdAt: Date.now(),
    });
    router.back();
  };

  return (
    <Screen>
      <TopBar title={deckId ? 'Edit deck' : 'Create deck'} />

      <AppText variant="caption" dim style={styles.label}>
        TITLE
      </AppText>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Inside jokes, Our city, 90s bands…"
        placeholderTextColor={colors.textDim}
        style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        accessibilityLabel="Deck title"
      />

      <AppText variant="caption" dim style={styles.label}>
        ICON & COLOR
      </AppText>
      <View style={styles.pickerRow}>
        {iconOptions.map((option) => (
          <PressableScale key={option} onPress={() => setIcon(option)} accessibilityLabel={option}>
            <View
              style={[
                styles.iconOption,
                { backgroundColor: icon === option ? color : colors.surfaceAlt },
              ]}
            >
              <Icon
                name={option}
                size={20}
                color={icon === option ? '#FFFFFF' : colors.textDim}
              />
            </View>
          </PressableScale>
        ))}
      </View>
      <View style={styles.pickerRow}>
        {colorOptions.map((option) => (
          <PressableScale key={option} onPress={() => setColor(option)} accessibilityLabel={option}>
            <View
              style={[
                styles.colorOption,
                { backgroundColor: option },
                color === option && styles.colorActive,
              ]}
            />
          </PressableScale>
        ))}
      </View>

      <AppText variant="caption" dim style={styles.label}>
        CARDS — ONE PER LINE ({cards.length})
      </AppText>
      <TextInput
        value={cardsText}
        onChangeText={setCardsText}
        multiline
        placeholder={'Shrek\nThe Eiffel Tower\nThat one legendary road trip'}
        placeholderTextColor={colors.textDim}
        style={[
          styles.input,
          styles.cardsInput,
          { backgroundColor: colors.surfaceAlt, color: colors.text },
        ]}
        accessibilityLabel="Deck cards, one per line"
      />

      <BigButton label="Save deck" icon="check" onPress={onSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 18, marginBottom: 8 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  cardsInput: { minHeight: 200, textAlignVertical: 'top', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOption: { width: 44, height: 44, borderRadius: 14 },
  colorActive: { borderWidth: 3, borderColor: '#FFFFFF' },
});
