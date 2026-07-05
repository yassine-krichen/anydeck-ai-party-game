import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { decodeDeck } from '@/features/decks/deck-codec';
import { saveUserDeck } from '@/features/decks/deck-storage';
import type { Deck } from '@/features/decks/deck.types';
import { useAppTheme } from '@/features/theme/use-app-theme';

export default function ImportScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  // Deep link support: anydeck://import?code=ADK1....
  const { code: linkedCode } = useLocalSearchParams<{ code?: string }>();

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (linkedCode) setCode(linkedCode);
  }, [linkedCode]);

  useEffect(() => {
    if (code.trim().length === 0) {
      setPreview(null);
      setError(null);
      return;
    }
    const deck = decodeDeck(code);
    setPreview(deck);
    setError(deck ? null : 'That code is not a valid AnyDeck deck.');
  }, [code]);

  const onImport = async () => {
    if (!preview) return;
    await saveUserDeck(preview);
    router.replace({ pathname: '/deck/[id]', params: { id: preview.id } });
  };

  return (
    <Screen>
      <TopBar title="Import deck" />
      <AppText dim style={styles.hint}>
        Paste a deck code a friend shared with you. Scanning their QR code with your camera
        opens this screen automatically.
      </AppText>
      <TextInput
        value={code}
        onChangeText={setCode}
        multiline
        placeholder="ADK1.…"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        accessibilityLabel="Deck code"
      />

      {error && <AppText color={colors.danger}>{error}</AppText>}

      {preview && (
        <View style={[styles.preview, { backgroundColor: preview.color }]}>
          <Icon name={preview.icon} size={26} color="#FFFFFF" />
          <View style={styles.previewText}>
            <AppText variant="title" color="#FFFFFF">
              {preview.title}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.9)">
              {preview.cards.length} cards
            </AppText>
          </View>
        </View>
      )}

      <BigButton label="Add to my decks" icon="download" disabled={!preview} onPress={onImport} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: 16 },
  input: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  previewText: { gap: 3 },
});
