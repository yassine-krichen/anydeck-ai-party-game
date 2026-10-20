import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { BigButton } from '@/components/big-button';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
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
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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

  const onScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanning(true);
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    setScanning(false);
    setCode(result.data);
  };

  return (
    <Screen>
      <TopBar title="Import deck" />
      <AppText dim style={styles.hint}>
        Paste a deck code a friend shared with you, or scan their QR code directly.
      </AppText>

      <View style={styles.scanButton}>
        <BigButton
          variant="secondary"
          icon="camera"
          label="Scan QR code"
          onPress={onScanPress}
        />
        {permission && !permission.granted && !permission.canAskAgain && (
          <AppText variant="caption" dim style={styles.scanDenied}>
            Camera access is off — enable it for AnyDeck in your phone's Settings app to scan.
          </AppText>
        )}
      </View>

      <Modal visible={scanning} animationType="slide">
        <View style={styles.scannerBackdrop}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
          />
          <View style={styles.scannerOverlay}>
            <AppText color="#FFFFFF" center style={styles.scannerHint}>
              Point the camera at a friend's AnyDeck QR code
            </AppText>
            <PressableScale
              onPress={() => setScanning(false)}
              accessibilityLabel="Close scanner"
              style={styles.scannerClose}
            >
              <View style={[styles.scannerCloseInner, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                <Icon name="x" size={24} color="#FFFFFF" />
              </View>
            </PressableScale>
          </View>
        </View>
      </Modal>

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
  scanButton: { marginBottom: 16, gap: 8 },
  scanDenied: { textAlign: 'center' },
  scannerBackdrop: { flex: 1, backgroundColor: '#000000' },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 32,
  },
  scannerHint: { marginBottom: 20 },
  scannerClose: { position: 'absolute', top: 56, right: 24 },
  scannerCloseInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
