import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon } from '@/components/icon';
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

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getDeck(id).then((d) => setDeck(d ?? null));
      getFavoriteIds().then((favs) => setFavorite(favs.includes(id)));
    }, [id])
  );

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
            <Icon
              name="star"
              size={24}
              color={favorite ? colors.gold : colors.textDim}
              fill={favorite ? colors.gold : 'none'}
            />
          </PressableScale>
        }
      />
      <View style={[styles.hero, { backgroundColor: deck.color }]}>
        <View style={styles.heroIcon}>
          <Icon name={deck.icon} size={44} color="#FFFFFF" />
        </View>
        <AppText variant="display" color="#FFFFFF" center>
          {deck.title}
        </AppText>
        <View style={styles.heroMeta}>
          <HeroStat label="CARDS" value={String(deck.cards.length)} />
          <View style={styles.heroDivider} />
          <HeroStat label="LANGUAGE" value={deck.lang.toUpperCase()} />
          <View style={styles.heroDivider} />
          <HeroStat label="ACCESS" value={playable ? 'READY' : 'LOCKED'} />
        </View>
      </View>

      <AppText dim style={styles.description}>
        {deck.description}
      </AppText>

      <View style={styles.samples}>
        {sampleCards.map((card) => (
          <View key={card} style={[styles.sample, { backgroundColor: colors.surfaceAlt }]}>
            <AppText variant="caption">{card}</AppText>
          </View>
        ))}
      </View>

      {playable ? (
        <BigButton
          label="Play this deck"
          icon="play"
          color={deck.color}
          textColor="#FFFFFF"
          onPress={() => router.push({ pathname: '/setup', params: { deckId: deck.id } })}
        />
      ) : (
        <View style={styles.lockActions}>
          <View style={styles.lockHeader}>
            <Icon name="lock" size={18} color={colors.textDim} />
            <AppText variant="headline">Premium deck</AppText>
          </View>
          <BigButton
            label="Unlock forever · $1.99"
            onPress={async () => {
              await economy.purchaseDeck(deck.id);
            }}
          />
          <BigButton
            variant="secondary"
            label="Watch an ad — free this session"
            onPress={async () => {
              await economy.showRewardedAd(deck.id);
            }}
          />
          <BigButton
            variant="ghost"
            icon="crown"
            label="Get everything with AnyDeck+"
            onPress={() => router.push('/settings')}
          />
        </View>
      )}

      <View style={styles.secondaryActions}>
        <BigButton variant="secondary" icon="share" label="Share deck" onPress={onShare} />
        {shareCode.length <= MAX_QR_CHARS && (
          <BigButton
            variant="secondary"
            icon="qr-code"
            label="Show QR code"
            onPress={() => setQrVisible(true)}
          />
        )}
        {deck.source !== 'bundled' && (
          <>
            <BigButton
              variant="secondary"
              icon="pencil"
              label="Edit deck"
              onPress={() => router.push({ pathname: '/custom', params: { id: deck.id } })}
            />
            <BigButton variant="ghost" icon="trash" label="Delete" onPress={onDelete} />
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
              Friends scan this with their camera, or paste the code into AnyDeck
            </AppText>
            <BigButton variant="secondary" label="Close" onPress={() => setQrVisible(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <AppText variant="headline" color="#FFFFFF">
        {value}
      </AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.75)">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 26,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 16,
  },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignSelf: 'stretch',
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },
  description: { marginBottom: 14 },
  samples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  sample: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  lockActions: { gap: 10 },
  lockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 2,
  },
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
