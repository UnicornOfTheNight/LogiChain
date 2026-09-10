import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAdminItems } from '../hooks/useAdminItems';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import type { ItemDTO, AssignableUserDTO } from '../types/dtos';

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

const ROLE_LABELS: Record<string, string> = {
  agent_terrain: 'Agent de terrain',
  transporteur: 'Transporteur'
};

// Vue : affectation des équipements aux agents de terrain et transporteurs.
export default function AdminItemsScreen() {
  const route = useRoute<{ params: RouteParams }>();
  const { eventId } = route.params;
  const { items, loading, assignItem } = useAdminItems(eventId);
  const { users } = useAssignableUsers();

  const [selectedItem, setSelectedItem] = useState<ItemDTO | null>(null);

  const userLabel = (userId: string | null) => {
    if (!userId) return 'Non affecté';
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name ?? user.email}` : 'Utilisateur inconnu';
  };

  const onPickUser = async (user: AssignableUserDTO | null) => {
    if (!selectedItem) return;
    await assignItem(selectedItem._id, user ? user.id : null);
    setSelectedItem(null);
  };

  if (loading && items.length === 0) return <ActivityIndicator style={styles.center} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item: ItemDTO) => item._id}
        renderItem={({ item }: { item: ItemDTO }) => (
          <Pressable style={styles.card} onPress={() => setSelectedItem(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardStatus}>{STATUS_LABELS[item.status] ?? item.status}</Text>
            </View>
            <Text style={styles.assignee}>Affecté à : {userLabel(item.assignedToUserId)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun équipement pour cet événement.</Text>}
      />

      <Modal visible={selectedItem !== null} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Affecter « {selectedItem?.label} »</Text>

            <Pressable style={styles.userRow} onPress={() => onPickUser(null)}>
              <Text style={styles.userRowText}>Aucun (désaffecter)</Text>
            </Pressable>

            <FlatList
              data={users}
              keyExtractor={(u: AssignableUserDTO) => u.id}
              renderItem={({ item: user }: { item: AssignableUserDTO }) => (
                <Pressable style={styles.userRow} onPress={() => onPickUser(user)}>
                  <Text style={styles.userRowText}>{user.name ?? user.email}</Text>
                  <Text style={styles.userRowRole}>{ROLE_LABELS[user.role] ?? user.role}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '700' },
  cardStatus: { color: '#666' },
  assignee: { color: '#1565c0', marginTop: 4, fontSize: 13 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  userRowText: { fontWeight: '600' },
  userRowRole: { color: '#666' }
});
