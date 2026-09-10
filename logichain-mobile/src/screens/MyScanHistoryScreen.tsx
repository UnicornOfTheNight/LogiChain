import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMyScanHistory } from '../hooks/useMyScanHistory';
import type { ScanHistoryEntryDTO, ItemAction, QueuedAction, ScanActionPayload } from '../types/dtos';

const ACTION_LABELS: Record<string, string> = {
  creation: 'Création',
  livraison: 'Livraison',
  deplacement: 'Déplacement',
  maintenance: 'Maintenance',
  anomalie: 'Anomalie',
  retour: 'Retour'
};

const ACTION_FILTERS: { value: ItemAction | null; label: string }[] = [
  { value: null, label: 'Tout' },
  { value: 'livraison', label: 'Livraison' },
  { value: 'deplacement', label: 'Déplacement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retour', label: 'Retour' },
  { value: 'anomalie', label: 'Anomalie' }
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Vue : historique de tous les scans/mouvements realises par l'agent
// connecte, filtrable par type d'action, avec possibilite d'annuler un
// scan errone (l'entree reste visible, marquee "annule"). Affiche aussi
// les scans encore en attente de synchronisation (pas encore confirmes
// par le serveur), pour eviter qu'un scan "en attente" semble disparu.
export default function MyScanHistoryScreen() {
  const navigation = useNavigation<any>();
  const { entries, pendingScans, loading, error, actionFilter, setActionFilter, refresh, cancelEntry } =
    useMyScanHistory();

  return (
    <View style={styles.wrapper}>
      <View style={styles.filterBar}>
        {ACTION_FILTERS.map((f) => (
          <Pressable
            key={f.label}
            style={[styles.filterChip, actionFilter === f.value && styles.filterChipActive]}
            onPress={() => setActionFilter(f.value)}
          >
            <Text style={[styles.filterChipText, actionFilter === f.value && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.errorBanner}>{error}</Text>}

      <FlatList
        contentContainerStyle={styles.container}
        data={entries}
        keyExtractor={(item: ScanHistoryEntryDTO, index: number) => `${item.itemId}-${item.timestamp}-${index}`}
        onRefresh={refresh}
        refreshing={loading}
        ListHeaderComponent={
          pendingScans.length > 0 ? (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingTitle}>
                En attente de synchronisation ({pendingScans.length})
              </Text>
              {pendingScans.map((action: QueuedAction) => {
                const payload = action.payload as ScanActionPayload;
                return (
                  <View key={action.localId} style={styles.pendingCard}>
                    <Text style={styles.pendingLabel}>{payload.qrCode}</Text>
                    <Text style={styles.pendingAction}>{ACTION_LABELS[payload.action] ?? payload.action}</Text>
                    {action.lastError ? (
                      <Text style={styles.pendingError}>{action.lastError}</Text>
                    ) : (
                      <Text style={styles.pendingHint}>Pas encore transmis au serveur</Text>
                    )}
                  </View>
                );
              })}
              <Pressable style={styles.syncLink} onPress={() => navigation.navigate('SyncCenter')}>
                <Text style={styles.syncLinkText}>Ouvrir le Centre de synchronisation</Text>
              </Pressable>
              <Text style={styles.sectionTitle}>Scans confirmés</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aucun scan enregistré.</Text> : null}
        renderItem={({ item }: { item: ScanHistoryEntryDTO }) => (
          <View style={[styles.card, item.cancelled && styles.cardCancelled]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardAction}>{ACTION_LABELS[item.action] ?? item.action}</Text>
            </View>
            <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
            {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
            {item.cancelled ? (
              <Text style={styles.cancelledLabel}>Scan annulé</Text>
            ) : (
              item.action !== 'creation' && (
                <Pressable style={styles.cancelButton} onPress={() => cancelEntry(item)}>
                  <Text style={styles.cancelButtonText}>Annuler ce scan</Text>
                </Pressable>
              )
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, backgroundColor: '#fff' },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1565c0',
    margin: 4
  },
  filterChipActive: { backgroundColor: '#1565c0' },
  filterChipText: { color: '#1565c0', fontSize: 12 },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  errorBanner: { backgroundColor: '#c62828', color: '#fff', padding: 10, textAlign: 'center' },
  pendingSection: { marginBottom: 8 },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#7a5b00', marginBottom: 8 },
  pendingCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f9a825'
  },
  pendingLabel: { fontWeight: '700', color: '#7a5b00' },
  pendingAction: { color: '#7a5b00', fontSize: 12, marginTop: 2 },
  pendingHint: { color: '#7a5b00', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  pendingError: { color: '#c62828', fontSize: 12, marginTop: 4 },
  syncLink: { alignSelf: 'flex-start', marginBottom: 12 },
  syncLinkText: { color: '#1565c0', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardCancelled: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontWeight: '700' },
  cardAction: { color: '#1565c0', fontWeight: '600', fontSize: 12 },
  cardTime: { color: '#666', fontSize: 12, marginTop: 2 },
  cardNote: { color: '#333', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  cancelledLabel: { color: '#c62828', fontWeight: '600', fontSize: 12, marginTop: 8 },
  cancelButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#c62828',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  cancelButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' }
});
