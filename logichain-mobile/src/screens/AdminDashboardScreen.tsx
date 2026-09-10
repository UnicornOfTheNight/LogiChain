import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useEventDashboard } from '../hooks/useEventDashboard';
import type { StockKpiEntry, BottleneckEntry } from '../types/dtos';

interface RouteParams {
  eventId: string;
  eventName: string;
}

const STATUS_LABELS: Record<string, string> = {
  en_stock: 'En stock',
  en_transit: 'En transit',
  livre: 'Livré',
  en_maintenance: 'En maintenance',
  perdu: 'Perdu'
};

// Vue : tableau de bord d'agrégation KPI (état des stocks, empreinte
// carbone consolidée, détection des goulots d'étranglement).
export default function AdminDashboardScreen() {
  const route = useRoute<{ params: RouteParams }>();
  const { eventId } = route.params;
  const { dashboard, loading, refresh } = useEventDashboard(eventId);

  if (loading && !dashboard) return <ActivityIndicator style={styles.center} />;
  if (!dashboard) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.refreshButton} onPress={refresh}>
        <Text style={styles.refreshText}>Actualiser</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>État des stocks</Text>
      {dashboard.stock.length === 0 && <Text style={styles.empty}>Aucun item pour cet événement.</Text>}
      {dashboard.stock.map((entry: StockKpiEntry) => (
        <View key={entry._id} style={styles.row}>
          <Text style={styles.rowLabel}>{STATUS_LABELS[entry._id] ?? entry._id}</Text>
          <Text style={styles.rowValue}>{entry.count}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Empreinte carbone consolidée</Text>
      <Text style={styles.carbonValue}>{dashboard.carbonFootprintKg.toFixed(1)} kg CO2e</Text>

      <Text style={styles.sectionTitle}>Goulots d'étranglement</Text>
      {dashboard.bottlenecks.length === 0 && (
        <Text style={styles.empty}>Aucun goulot détecté (zones avec 3 items ou plus "en_transit").</Text>
      )}
      {dashboard.bottlenecks.map((b: BottleneckEntry, index: number) => (
        <View key={index} style={styles.row}>
          <Text style={styles.rowLabel}>
            {b._id.lat.toFixed(3)}, {b._id.lng.toFixed(3)}
          </Text>
          <Text style={styles.rowValue}>{b.count} items bloqués</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center' },
  refreshButton: { alignSelf: 'flex-end', marginBottom: 12 },
  refreshText: { color: '#1565c0', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  rowLabel: { color: '#333' },
  rowValue: { fontWeight: '700' },
  carbonValue: { fontSize: 28, fontWeight: '700', color: '#2e7d32' },
  empty: { color: '#999' }
});
