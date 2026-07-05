import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { getDeck, newDeckId, saveUserDeck } from '@/features/decks/deck-storage';
import { useAppTheme } from '@/features/theme/use-app-theme';

const emojiOptions = ['🎉', '🎯', '🧠', '🎵', '🏆', '🌍', '🍕', '👻', '💼', '🎓'];
const colorOptions = ['#FF5470', '#0A84FF', '#BF5AF2', '#30D158', '#FF9F0A', '#5865F2'];

export default function CustomDeckScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  const [deckId, setDeckId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [color, setColor] = useState('#FF5470');
  const [cardsText, setCardsText] = useState('');

  useEffect(() => {
    if (!id) return;
    getDeck(id).then((deck) => {
      if (!deck || deck.source === 'bundled') return;
      setDeckId(deck.id);
      setTitle(deck.title);
      setEmoji(deck.emoji);
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
      emoji,
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
        {emojiOptions.map((option) => (
          <PressableScale key={option} onPress={() => setEmoji(option)}>
            <View
              style={[
                styles.emojiOption,
                { backgroundColor: colors.surfaceAlt },
                emoji === option && { backgroundColor: color },
              ]}
            >
              <AppText style={styles.emojiText}>{option}</AppText>
            </View>
          </PressableScale>
        ))}
      </View>
      <View style={styles.pickerRow}>
        {colorOptions.map((option) => (
          <PressableScale key={option} onPress={() => setColor(option)}>
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
        placeholder={'Shrek\nThe Eiffel Tower\nYour mom’s couscous'}
        placeholderTextColor={colors.textDim}
        style={[
          styles.input,
          styles.cardsInput,
          { backgroundColor: colors.surfaceAlt, color: colors.text },
        ]}
        accessibilityLabel="Deck cards, one per line"
      />

      <BigButton label="Save deck" icon="💾" onPress={onSave} />
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
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 22, lineHeight: 28 },
  colorOption: { width: 44, height: 44, borderRadius: 14 },
  colorActive: { borderWidth: 3, borderColor: '#FFFFFF' },
});
