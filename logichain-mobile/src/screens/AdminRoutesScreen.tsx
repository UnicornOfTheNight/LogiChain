import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useRoutesAdmin } from '../hooks/useRoutesAdmin';
import type { RouteDTO, StopDTO } from '../types/dtos';

interface RouteParams {
  eventId: string;
  eventName: string;
}

const STATUS_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  validee: 'Validée',
  annulee: 'Annulée'
};

// Vue : supervision des transferts de responsabilité (validation par
// arrêt) et validation des feuilles de route des transporteurs.
export default function AdminRoutesScreen() {
  const routeParam = useRoute<{ params: RouteParams }>();
  const { eventId } = routeParam.params;
  const { routes, loading, refresh, validateStop, validateRoute } = useRoutesAdmin(eventId);

  if (loading && routes.length === 0) return <ActivityIndicator style={styles.center} />;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={routes}
      keyExtractor={(item: RouteDTO) => item._id}
      onRefresh={refresh}
      refreshing={loading}
      ListEmptyComponent={<Text style={styles.empty}>Aucune feuille de route pour cet événement.</Text>}
      renderItem={({ item: r }: { item: RouteDTO }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Transporteur {r.transporterId.slice(-6)}</Text>
            <Text style={styles.status}>{STATUS_LABELS[r.status] ?? r.status}</Text>
          </View>

          {r.stops.map((stop: StopDTO) => (
            <View key={stop._id} style={styles.stopRow}>
              <Text style={styles.stopLabel}>{stop.label}</Text>
              {stop.validated ? (
                <Text style={styles.stopValidated}>Validé</Text>
              ) : (
                <Pressable style={styles.stopButton} onPress={() => validateStop(r._id, stop._id)}>
                  <Text style={styles.stopButtonText}>Valider le transfert</Text>
                </Pressable>
              )}
            </View>
          ))}

          {r.status !== 'validee' && (
            <Pressable style={styles.routeButton} onPress={() => validateRoute(r._id, r.version)}>
              <Text style={styles.routeButtonText}>Valider la feuille de route</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontWeight: '700' },
  status: { color: '#666' },
  stopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  stopLabel: { flex: 1 },
  stopValidated: { color: '#2e7d32', fontWeight: '600' },
  stopButton: { backgroundColor: '#1565c0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  stopButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  routeButton: { backgroundColor: '#2e7d32', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  routeButtonText: { color: '#fff', fontWeight: '600' }
});
