import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useScanHistoryAdmin } from '../hooks/useScanHistoryAdmin';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import { useAdminItems } from '../hooks/useAdminItems';
import { useZones } from '../hooks/useZones';
import type { ScanHistoryEntryDTO, ItemAction, AssignableUserDTO, ItemDTO, ZoneDTO } from '../types/dtos';

interface RouteParams {
  eventId: string;
  eventName: string;
}

type FilterKind = 'agent' | 'item' | 'zone' | 'action' | null;

const ACTION_OPTIONS: { value: ItemAction; label: string }[] = [
  { value: 'livraison', label: 'Livraison' },
  { value: 'deplacement', label: 'Déplacement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retour', label: 'Retour' },
  { value: 'anomalie', label: 'Anomalie' },
  { value: 'creation', label: 'Création' }
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Vue : historique complet des scans de l'événement, filtrable par agent,
// équipement, zone géographique et type de scan (profil Administrateurs &
// Responsables logistiques).
export default function AdminScanHistoryScreen() {
  const route = useRoute<{ params: RouteParams }>();
  const { eventId } = route.params;
  const { entries, loading, error, filters, setFilters, refresh, cancelEntry } = useScanHistoryAdmin(eventId);
  const { users } = useAssignableUsers();
  const { items } = useAdminItems(eventId);
  const { event } = useZones(eventId);

  const [activeFilter, setActiveFilter] = useState<FilterKind>(null);

  const agentName = (agentId?: string) => {
    if (!agentId) return null;
    const user = users.find((u) => u.id === agentId);
    return user ? user.name ?? user.email : null;
  };

  const agentLabel = filters.agentId ? agentName(filters.agentId) ?? 'Agent' : 'Tous les agents';
  const itemLabel = filters.itemId
    ? items.find((i) => i._id === filters.itemId)?.label ?? 'Équipement'
    : 'Tous les équipements';
  const zoneLabel = filters.zoneId
    ? event?.zones.find((z) => z._id === filters.zoneId)?.name ?? 'Zone'
    : 'Toutes les zones';
  const actionLabel = filters.action
    ? ACTION_OPTIONS.find((a) => a.value === filters.action)?.label ?? filters.action
    : 'Tous les types';

  const hasActiveFilters = Boolean(filters.agentId || filters.itemId || filters.zoneId || filters.action);

  const closeModal = () => setActiveFilter(null);

  return (
    <View style={styles.wrapper}>
      <View style={styles.filterGrid}>
        <Pressable style={styles.filterButton} onPress={() => setActiveFilter('agent')}>
          <Text style={styles.filterButtonText}>{agentLabel}</Text>
        </Pressable>
        <Pressable style={styles.filterButton} onPress={() => setActiveFilter('item')}>
          <Text style={styles.filterButtonText}>{itemLabel}</Text>
        </Pressable>
        <Pressable style={styles.filterButton} onPress={() => setActiveFilter('zone')}>
          <Text style={styles.filterButtonText}>{zoneLabel}</Text>
        </Pressable>
        <Pressable style={styles.filterButton} onPress={() => setActiveFilter('action')}>
          <Text style={styles.filterButtonText}>{actionLabel}</Text>
        </Pressable>
      </View>
      {hasActiveFilters && (
        <Pressable onPress={() => setFilters({})} style={styles.clearRow}>
          <Text style={styles.clearLink}>Réinitialiser les filtres</Text>
        </Pressable>
      )}
      {error && <Text style={styles.errorBanner}>{error}</Text>}

      <FlatList
        contentContainerStyle={styles.container}
        data={entries}
        keyExtractor={(item: ScanHistoryEntryDTO, index: number) => `${item.itemId}-${item.timestamp}-${index}`}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aucun scan pour ces filtres.</Text> : null}
        renderItem={({ item }: { item: ScanHistoryEntryDTO }) => (
          <View style={[styles.card, item.cancelled && styles.cardCancelled]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardAction}>{ACTION_OPTIONS.find((a) => a.value === item.action)?.label ?? item.action}</Text>
            </View>
            <Text style={styles.cardMeta}>
              {formatTime(item.timestamp)}
              {agentName(item.agentId) ? ` · ${agentName(item.agentId)}` : ''}
            </Text>
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

      <Modal visible={activeFilter !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.modalContent}>
            {activeFilter === 'agent' && (
              <>
                <Text style={styles.modalTitle}>Filtrer par agent</Text>
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    setFilters((f) => ({ ...f, agentId: undefined }));
                    closeModal();
                  }}
                >
                  <Text style={styles.optionText}>Tous les agents</Text>
                </Pressable>
                <FlatList
                  data={users}
                  keyExtractor={(u: AssignableUserDTO) => u.id}
                  renderItem={({ item: u }: { item: AssignableUserDTO }) => (
                    <Pressable
                      style={styles.optionRow}
                      onPress={() => {
                        setFilters((f) => ({ ...f, agentId: u.id }));
                        closeModal();
                      }}
                    >
                      <Text style={styles.optionText}>{u.name ?? u.email}</Text>
                    </Pressable>
                  )}
                />
              </>
            )}

            {activeFilter === 'item' && (
              <>
                <Text style={styles.modalTitle}>Filtrer par équipement</Text>
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    setFilters((f) => ({ ...f, itemId: undefined }));
                    closeModal();
                  }}
                >
                  <Text style={styles.optionText}>Tous les équipements</Text>
                </Pressable>
                <FlatList
                  data={items}
                  keyExtractor={(i: ItemDTO) => i._id}
                  renderItem={({ item: i }: { item: ItemDTO }) => (
                    <Pressable
                      style={styles.optionRow}
                      onPress={() => {
                        setFilters((f) => ({ ...f, itemId: i._id }));
                        closeModal();
                      }}
                    >
                      <Text style={styles.optionText}>{i.label}</Text>
                    </Pressable>
                  )}
                />
              </>
            )}

            {activeFilter === 'zone' && (
              <>
                <Text style={styles.modalTitle}>Filtrer par zone</Text>
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    setFilters((f) => ({ ...f, zoneId: undefined }));
                    closeModal();
                  }}
                >
                  <Text style={styles.optionText}>Toutes les zones</Text>
                </Pressable>
                <FlatList
                  data={event?.zones ?? []}
                  keyExtractor={(z: ZoneDTO) => z._id}
                  renderItem={({ item: z }: { item: ZoneDTO }) => (
                    <Pressable
                      style={styles.optionRow}
                      onPress={() => {
                        setFilters((f) => ({ ...f, zoneId: z._id }));
                        closeModal();
                      }}
                    >
                      <Text style={styles.optionText}>{z.name}</Text>
                    </Pressable>
                  )}
                />
              </>
            )}

            {activeFilter === 'action' && (
              <>
                <Text style={styles.modalTitle}>Filtrer par type de scan</Text>
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    setFilters((f) => ({ ...f, action: undefined }));
                    closeModal();
                  }}
                >
                  <Text style={styles.optionText}>Tous les types</Text>
                </Pressable>
                {ACTION_OPTIONS.map((a) => (
                  <Pressable
                    key={a.value}
                    style={styles.optionRow}
                    onPress={() => {
                      setFilters((f) => ({ ...f, action: a.value }));
                      closeModal();
                    }}
                  >
                    <Text style={styles.optionText}>{a.label}</Text>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, backgroundColor: '#fff' },
  filterButton: {
    width: '48%',
    marginRight: '4%',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1565c0'
  },
  filterButtonText: { color: '#1565c0', fontSize: 12, fontWeight: '600' },
  clearRow: { paddingHorizontal: 12, paddingBottom: 8, backgroundColor: '#fff' },
  clearLink: { color: '#c62828', fontSize: 12, fontWeight: '600' },
  container: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  errorBanner: { backgroundColor: '#c62828', color: '#fff', padding: 10, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardCancelled: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontWeight: '700' },
  cardAction: { color: '#1565c0', fontWeight: '600', fontSize: 12 },
  cardMeta: { color: '#666', fontSize: 12, marginTop: 2 },
  cardNote: { color: '#333', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  cancelledLabel: { color: '#c62828', fontWeight: '600', fontSize: 12, marginTop: 8 },
  cancelButton: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#c62828', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  cancelButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  optionText: { fontWeight: '600' }
});
