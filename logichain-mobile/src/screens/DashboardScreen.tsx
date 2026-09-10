import React, { useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../hooks/AuthContext';
import { useCurrentEvent } from '../hooks/useCurrentEvent';
import { useItems } from '../hooks/useItems';
import { useSyncQueueContext } from '../hooks/SyncQueueContext';
import { useAlerts } from '../hooks/useAlerts';
import { useMyTasks } from '../hooks/useMyTasks';
import { useItinerary } from '../hooks/useItinerary';
import ItemCard from '../components/ItemCard';
import SyncStatusBadge from '../components/SyncStatusBadge';
import AlertBanner from '../components/AlertBanner';
import ItineraryMapView from '../components/ItineraryMapView';
import type { ItemDTO, TaskDTO } from '../types/dtos';

const TASK_STATUS_LABELS: Record<string, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours'
};

/**
 * Dashboard opérationnel : visualisation immédiate des tâches prioritaires,
 * de l'itinéraire (zones + arrêts, données GeoJSON) et des alertes — puis
 * la liste des équipements assignés pour le scan. Toute la logique
 * (SQLite, API, sync, authentification) vit dans les hooks.
 */
export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuthContext();
  const { eventId, loading: eventLoading, error: eventError } = useCurrentEvent();
  const { items, loading, error: itemsError, refresh } = useItems(eventId);
  const { pending, status, isOnline } = useSyncQueueContext();
  const alerts = useAlerts(eventId);
  const { tasks } = useMyTasks();
  const { zones, stops } = useItinerary(eventId);

  const priorityTasks = tasks.filter((t) => t.status === 'a_faire' || t.status === 'en_cours').slice(0, 3);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={logout} style={styles.logoutButton} hitSlop={8}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>
      )
    });
  }, [navigation, logout]);

  const handleOpenItem = (item: ItemDTO) => {
    navigation.navigate('ItemDetail', { itemId: item._id });
  };

  if (eventLoading) return <ActivityIndicator style={styles.center} />;

  if (eventError || !eventId) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>{eventError ?? 'Aucun événement disponible pour le moment.'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item: ItemDTO) => item._id}
      renderItem={({ item }: { item: ItemDTO }) => <ItemCard item={item} onPress={handleOpenItem} />}
      onRefresh={refresh}
      refreshing={loading}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <SyncStatusBadge
              status={status}
              pendingCount={pending.length}
              onPress={() => navigation.navigate('SyncCenter')}
            />
            <Text style={styles.networkLabel}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          </View>

          {itemsError && <Text style={styles.warning}>{itemsError}</Text>}
          {alerts.length > 0 && <AlertBanner alert={alerts[0]} />}

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Scan')}>
              <Text style={styles.actionText}>Scanner</Text>
            </Pressable>
            <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.navigate('MyPlanning')}>
              <Text style={styles.actionTextSecondary}>Mon planning</Text>
            </Pressable>
            <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.navigate('MyTasks')}>
              <Text style={styles.actionTextSecondary}>Mes tâches</Text>
            </Pressable>
            <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.navigate('SyncCenter')}>
              <Text style={styles.actionTextSecondary}>Synchro</Text>
            </Pressable>
            <Pressable style={styles.actionButtonSecondary} onPress={() => navigation.navigate('MyScanHistory')}>
              <Text style={styles.actionTextSecondary}>Mes scans</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Tâches prioritaires</Text>
          {priorityTasks.length === 0 ? (
            <Text style={styles.empty}>Aucune tâche en attente.</Text>
          ) : (
            priorityTasks.map((task: TaskDTO) => (
              <Pressable key={task._id} style={styles.taskCard} onPress={() => navigation.navigate('MyTasks')}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskStatus}>{TASK_STATUS_LABELS[task.status] ?? task.status}</Text>
              </Pressable>
            ))
          )}

          <Text style={styles.sectionTitle}>Itinéraire</Text>
          <ItineraryMapView zones={zones} stops={stops} />

          <Text style={styles.sectionTitle}>Équipements assignés ({items.length})</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  networkLabel: { fontSize: 12, color: '#666' },
  warning: { backgroundColor: '#fff3cd', color: '#7a5b00', padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  actionButton: {
    width: '48%',
    backgroundColor: '#1565c0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: '4%',
    marginBottom: 8
  },
  actionText: { color: '#fff', fontWeight: '600' },
  actionButtonSecondary: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1565c0',
    marginRight: '4%',
    marginBottom: 8
  },
  actionTextSecondary: { color: '#1565c0', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  empty: { color: '#999', marginBottom: 8 },
  taskCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6 },
  taskTitle: { fontWeight: '600' },
  taskStatus: { color: '#1565c0', fontSize: 12, marginTop: 2 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#c62828', fontWeight: '600' }
});
