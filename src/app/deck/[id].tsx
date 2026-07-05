import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TopBar } from '@/components/top-bar';
import { encodeDeck } from '@/features/decks/deck-codec';
import {
  deleteUserDeck,
  getDeck,
  getFavoriteIds,
  toggleFavorite,
} from '@/features/decks/deck-storage';
import type { Deck } from '@/features/decks/deck.types';
import { isDeckPlayable, useEconomy } from '@/features/economy/economy';
import { useAppTheme } from '@/features/theme/use-app-theme';

/** QR payload limit — beyond this the code is unscannable on small screens. */
const MAX_QR_CHARS = 2200;

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const economy = useEconomy();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDeck(id).then((d) => setDeck(d ?? null));
    getFavoriteIds().then((favs) => setFavorite(favs.includes(id)));
  }, [id]);

  const playable = deck ? isDeckPlayable(deck, economy.state, economy.sessionUnlocks) : false;
  const shareCode = useMemo(() => (deck ? encodeDeck(deck) : ''), [deck]);
  const sampleCards = useMemo(() => deck?.cards.slice(0, 6) ?? [], [deck]);

  if (!deck) {
    return (
      <Screen>
        <TopBar title="Deck" />
        <AppText dim>Deck not found.</AppText>
      </Screen>
    );
  }

  const onToggleFavorite = async () => {
    const favs = await toggleFavorite(deck.id);
    setFavorite(favs.includes(deck.id));
  };

  const onShare = async () => {
    await Share.share({
      message: `Play my "${deck.title}" deck in AnyDeck!\n\nOpen AnyDeck → Import → paste this code:\n\n${shareCode}`,
    });
  };

  const onDelete = () => {
    Alert.alert('Delete deck', `Delete "${deck.title}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteUserDeck(deck.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <TopBar
        title=""
        right={
          <PressableScale onPress={onToggleFavorite} accessibilityLabel="Toggle favorite">
            <AppText variant="title">{favorite ? '⭐' : '☆'}</AppText>
          </PressableScale>
        }
      />
      <View style={[styles.hero, { backgroundColor: deck.color }]}>
        <AppText style={styles.heroEmoji}>{deck.emoji}</AppText>
        <AppText variant="display" color="#FFFFFF" center>
          {deck.title}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.9)" center>
          {deck.cards.length} cards · {deck.lang.toUpperCase()}
        </AppText>
      </View>

      <AppText dim style={styles.description}>
        {deck.description}
      </AppText>

      <View style={styles.samples}>
        {sampleCards.map((card) => (
          <View
            key={card}
            style={[styles.sample, { backgroundColor: colors.surfaceAlt }]}
          >
            <AppText variant="caption">{card}</AppText>
          </View>
        ))}
      </View>

      {playable ? (
        <BigButton
          label="Play this deck"
          color={deck.color}
          textColor="#FFFFFF"
          onPress={() => router.push({ pathname: '/setup', params: { deckId: deck.id } })}
        />
      ) : (
        <View style={styles.lockActions}>
          <AppText variant="headline" center>
            🔒 Premium deck
          </AppText>
          <BigButton
            label="Unlock forever · $1.99"
            onPress={async () => {
              await economy.purchaseDeck(deck.id);
            }}
          />
          <BigButton
            variant="secondary"
            label="Watch ad — play it free this session"
            onPress={async () => {
              await economy.showRewardedAd(deck.id);
            }}
          />
          <BigButton
            variant="ghost"
            label="Get everything with AnyDeck+"
            onPress={() => router.push('/settings')}
          />
        </View>
      )}

      <View style={styles.secondaryActions}>
        <BigButton variant="secondary" icon="📤" label="Share deck" onPress={onShare} />
        {shareCode.length <= MAX_QR_CHARS && (
          <BigButton
            variant="secondary"
            icon="🔳"
            label="Show QR code"
            onPress={() => setQrVisible(true)}
          />
        )}
        {deck.source !== 'bundled' && (
          <>
            <BigButton
              variant="secondary"
              icon="✏️"
              label="Edit deck"
              onPress={() => router.push({ pathname: '/custom', params: { id: deck.id } })}
            />
            <BigButton variant="ghost" icon="🗑" label="Delete" onPress={onDelete} />
          </>
        )}
      </View>

      <Modal visible={qrVisible} transparent animationType="fade">
        <View style={styles.qrBackdrop}>
          <View style={[styles.qrCard, { backgroundColor: colors.surface }]}>
            <AppText variant="headline" center>
              Scan to import
            </AppText>
            <View style={styles.qrBox}>
              <QRCode value={shareCode} size={240} backgroundColor="#FFFFFF" />
            </View>
            <AppText variant="caption" dim center>
              Friends paste this into AnyDeck → Import
            </AppText>
            <BigButton variant="secondary" label="Close" onPress={() => setQrVisible(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 56, lineHeight: 64 },
  description: { marginBottom: 16 },
  samples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sample: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  lockActions: { gap: 10 },
  secondaryActions: { gap: 10, marginTop: 12 },
  qrBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrCard: {
    borderRadius: 28,
    padding: 24,
    gap: 16,
    width: '100%',
    maxWidth: 360,
  },
  qrBox: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
  },
});
