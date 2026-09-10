import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSyncQueueContext } from '../hooks/SyncQueueContext';
import type { QueuedAction } from '../types/dtos';

const TYPE_LABELS: Record<string, string> = {
  scan: 'Scan',
  anomalie: 'Anomalie'
};

// Vue : file d'attente des requetes sortantes, statut reseau, declenchement
// manuel et resolution des conflits (verrouillage optimiste cote API) via
// l'abandon explicite d'une action bloquee.
export default function SyncCenterScreen() {
  const { pending, status, lastResult, isOnline, runSync, discardAction } = useSyncQueueContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Centre de synchronisation</Text>
      <Text style={styles.status}>
        {isOnline
          ? 'Connexion réseau disponible'
          : 'Hors ligne : les actions seront synchronisées automatiquement au retour du réseau'}
      </Text>

      {lastResult && (
        <Text style={styles.summary}>
          Dernière synchro : {lastResult.synced} envoyées, {lastResult.conflicts} conflits, {lastResult.failed} échecs
        </Text>
      )}

      <Pressable style={styles.button} onPress={runSync} disabled={!isOnline || status === 'syncing'}>
        {status === 'syncing' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Forcer la synchronisation</Text>
        )}
      </Pressable>

      <Text style={styles.sectionTitle}>File d'attente ({pending.length})</Text>
      {pending.some((a) => a.lastError) && (
        <Text style={styles.hint}>
          Une action en conflit ne pourra pas se synchroniser automatiquement (la donnée d'origine a changé
          entretemps) : abandonnez-la pour la retirer de la file, ou refaites l'action à jour manuellement.
        </Text>
      )}

      <FlatList
        data={pending}
        keyExtractor={(action: QueuedAction) => action.localId}
        renderItem={({ item: action }: { item: QueuedAction }) => (
          <View style={styles.queueItem}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueType}>{TYPE_LABELS[action.type] ?? action.type}</Text>
              <Text style={styles.queueDate}>{new Date(action.createdAt).toLocaleString('fr-FR')}</Text>
            </View>
            {action.lastError && (
              <>
                <Text style={styles.queueError}>{action.lastError}</Text>
                <Pressable style={styles.discardButton} onPress={() => discardAction(action.localId)}>
                  <Text style={styles.discardButtonText}>Abandonner cette action</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune action en attente.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  status: { color: '#666', marginBottom: 12 },
  summary: { marginBottom: 12, fontStyle: 'italic' },
  button: { backgroundColor: '#1565c0', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#7a5b00', backgroundColor: '#fff3cd', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 8 },
  queueItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 6 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  queueType: { fontWeight: '600' },
  queueDate: { fontSize: 12, color: '#666' },
  queueError: { fontSize: 12, color: '#c62828', marginTop: 4 },
  discardButton: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#c62828', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  discardButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { color: '#999', textAlign: 'center', marginTop: 24 }
});
