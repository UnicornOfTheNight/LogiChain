import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useMyPlanning } from '../hooks/useMyPlanning';
import ItineraryMapView from '../components/ItineraryMapView';
import type { RouteDTO, StopDTO } from '../types/dtos';

const STATUS_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  validee: 'Validée',
  annulee: 'Annulée'
};

function formatTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Vue : consultation des tâches logistiques et des plannings de livraison
// assignés — étapes ordonnées, horaires prévus, et carte de l'itinéraire.
export default function MyPlanningScreen() {
  const { routes, loading, refresh } = useMyPlanning();
  const allStops = routes.flatMap((r) => r.stops);

  if (loading && routes.length === 0) return <ActivityIndicator style={styles.center} />;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={routes}
      keyExtractor={(item: RouteDTO) => item._id}
      onRefresh={refresh}
      refreshing={loading}
      ListHeaderComponent={
        allStops.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Carte de l'itinéraire</Text>
            <ItineraryMapView zones={[]} stops={allStops} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        !loading ? <Text style={styles.empty}>Aucun planning de livraison assigné pour le moment.</Text> : null
      }
      renderItem={({ item: route }: { item: RouteDTO }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Planning de livraison</Text>
            <Text style={styles.status}>{STATUS_LABELS[route.status] ?? route.status}</Text>
          </View>

          {route.stops.map((stop: StopDTO, index: number) => (
            <View key={stop._id} style={styles.stopRow}>
              <View style={styles.stopBadge}>
                <Text style={styles.stopBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopLabel}>{stop.label}</Text>
                {stop.plannedTime && <Text style={styles.stopTime}>{formatTime(stop.plannedTime)}</Text>}
              </View>
              <Text style={stop.validated ? styles.stopValidated : styles.stopPending}>
                {stop.validated ? 'Validé' : 'En attente'}
              </Text>
            </View>
          ))}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontWeight: '700' },
  status: { color: '#666' },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  stopBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  stopBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stopInfo: { flex: 1 },
  stopLabel: { fontWeight: '600' },
  stopTime: { color: '#666', fontSize: 12, marginTop: 2 },
  stopValidated: { color: '#2e7d32', fontWeight: '600', fontSize: 12 },
  stopPending: { color: '#f9a825', fontWeight: '600', fontSize: 12 }
});
