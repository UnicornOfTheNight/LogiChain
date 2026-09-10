import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useScan } from '../hooks/useScan';
import type { ItemAction } from '../types/dtos';

const STEPS: { value: ItemAction; label: string }[] = [
  { value: 'livraison', label: 'Livraison' },
  { value: 'deplacement', label: 'Déplacement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retour', label: 'Retour' }
];

/**
 * Vue de scan : capture les evenements camera et le choix d'etape
 * logistique, delegue toute la logique (geolocalisation, persistance
 * locale, file d'attente) au hook useScan / ItemService. Aucun appel
 * reseau ou SQL direct ici. Fonctionne en mode connecte ou deconnecte
 * (SyncQueueService empile l'action si hors reseau).
 */
export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const { lastScanned, error, handleScan } = useScan();
  const [locked, setLocked] = useState(false);
  const [step, setStep] = useState<ItemAction>('livraison');

  if (!permission) return null;

  if (!permission.granted) {
    requestPermission();
    return (
      <View style={styles.center}>
        <Text>Autorisation caméra requise pour scanner le matériel.</Text>
      </View>
    );
  }

  const onBarcodeScanned = async ({ data }: { data: string }) => {
    if (locked) return;
    setLocked(true);

    const result = await handleScan(data, step);
    // Retour haptique/sonore pour valider l'action sans regarder l'ecran
    // (lecture rapide en rafale, exigence du module de scan industriel).
    await Haptics.notificationAsync(
      result ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );

    setTimeout(() => setLocked(false), 1200); // anti-rebond pour le scan en rafale
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepBar}>
        {STEPS.map((s) => (
          <Pressable
            key={s.value}
            style={[styles.stepChip, step === s.value && styles.stepChipActive]}
            onPress={() => setStep(s.value)}
          >
            <Text style={[styles.stepChipText, step === s.value && styles.stepChipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
        onBarcodeScanned={onBarcodeScanned}
      />

      <View style={styles.overlay}>
        {error && <Text style={styles.error}>{error}</Text>}
        {lastScanned && (
          <View style={styles.successBox}>
            <Text style={styles.success}>
              Scanné : {lastScanned.label} → {lastScanned.status}
            </Text>
            <Pressable
              style={styles.anomalyButton}
              onPress={() => navigation.navigate('ItemDetail', { itemId: lastScanned._id })}
            >
              <Text style={styles.anomalyButtonText}>Signaler une anomalie sur cet équipement</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepBar: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, backgroundColor: '#0d1b2a' },
  stepChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#fff', margin: 4 },
  stepChipActive: { backgroundColor: '#1565c0', borderColor: '#1565c0' },
  stepChipText: { color: '#fff', fontSize: 12 },
  stepChipTextActive: { fontWeight: '700' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  overlay: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  error: { backgroundColor: '#c62828', color: '#fff', padding: 10, borderRadius: 8 },
  successBox: { backgroundColor: '#2e7d32', padding: 10, borderRadius: 8 },
  success: { color: '#fff' },
  anomalyButton: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 6, alignItems: 'center' },
  anomalyButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 }
});
