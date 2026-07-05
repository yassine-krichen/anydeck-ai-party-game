import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { generateDeck, isGenerationConfigured } from '@/features/decks/generate-deck-api';
import { saveUserDeck } from '@/features/decks/deck-storage';
import { useAppTheme } from '@/features/theme/use-app-theme';

const suggestions = [
  'Tunisian street food',
  '90s cartoons',
  'Things in a hospital',
  'Football legends',
  'K-pop',
  'Famous TikTokers',
];
const langs = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية' },
];
const counts = [20, 40, 60];

export default function GenerateScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [topic, setTopic] = useState('');
  const [lang, setLang] = useState('en');
  const [count, setCount] = useState(40);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = async () => {
    if (topic.trim().length === 0 || loading) return;
    setLoading(true);
    setError(null);
    const result = await generateDeck({ topic: topic.trim(), lang, count });
    setLoading(false);
    if (result.error || !result.deck) {
      setError(result.error);
      return;
    }
    await saveUserDeck(result.deck);
    router.replace({ pathname: '/deck/[id]', params: { id: result.deck.id } });
  };

  return (
    <Screen>
      <TopBar title="AI decks" />
      <AppText dim style={styles.pitch}>
        Type any topic — your friend group's inside jokes, your city, a niche fandom — and get
        a playable deck in seconds.
      </AppText>

      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="Any topic you can imagine…"
        placeholderTextColor={colors.textDim}
        style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text }]}
        accessibilityLabel="Deck topic"
      />

      <View style={styles.chips}>
        {suggestions.map((s) => (
          <PressableScale key={s} onPress={() => setTopic(s)}>
            <View style={[styles.chip, { backgroundColor: colors.surfaceAlt }]}>
              <AppText variant="caption">{s}</AppText>
            </View>
          </PressableScale>
        ))}
      </View>

      <AppText variant="caption" dim style={styles.label}>
        LANGUAGE
      </AppText>
      <View style={styles.chips}>
        {langs.map((l) => (
          <PressableScale key={l.id} onPress={() => setLang(l.id)}>
            <View
              style={[
                styles.chip,
                { backgroundColor: lang === l.id ? colors.accent : colors.surfaceAlt },
              ]}
            >
              <AppText variant="caption" color={lang === l.id ? colors.onAccent : colors.text}>
                {l.label}
              </AppText>
            </View>
          </PressableScale>
        ))}
      </View>

      <AppText variant="caption" dim style={styles.label}>
        CARDS
      </AppText>
      <View style={styles.chips}>
        {counts.map((c) => (
          <PressableScale key={c} onPress={() => setCount(c)}>
            <View
              style={[
                styles.chip,
                { backgroundColor: count === c ? colors.accent : colors.surfaceAlt },
              ]}
            >
              <AppText variant="caption" color={count === c ? colors.onAccent : colors.text}>
                {c}
              </AppText>
            </View>
          </PressableScale>
        ))}
      </View>

      {error && (
        <AppText color={colors.danger} style={styles.error}>
          {error}
        </AppText>
      )}
      {!isGenerationConfigured() && !error && (
        <AppText variant="caption" dim style={styles.error}>
          Server not configured yet — see server/README in the project.
        </AppText>
      )}

      <View style={styles.action}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} size="large" />
            <AppText dim>Building your deck…</AppText>
          </View>
        ) : (
          <BigButton
            label="Generate deck"
            icon="sparkles"
            onPress={onGenerate}
            disabled={topic.trim().length === 0}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pitch: { marginBottom: 20 },
  input: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 17,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  label: { marginTop: 20, marginBottom: 8 },
  error: { marginTop: 16 },
  action: { marginTop: 24 },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 8 },
});
