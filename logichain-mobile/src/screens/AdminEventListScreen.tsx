import React, { useLayoutEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../hooks/AuthContext';
import { useEvents } from '../hooks/useEvents';
import type { EventDTO } from '../types/dtos';

const STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  montage: 'Montage',
  en_cours: 'En cours',
  demontage: 'Démontage',
  termine: 'Terminé'
};

// Vue : liste des événements. Point d'entrée du profil Administrateur /
// Responsable logistique.
export default function AdminEventListScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuthContext();
  const { events, loading, refresh } = useEvents();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={logout} style={styles.logoutButton} hitSlop={8}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </Pressable>
      )
    });
  }, [navigation, logout]);

  const openEvent = (event: EventDTO) => {
    navigation.navigate('EventHub', { eventId: event._id, eventName: event.name });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.createButton} onPress={() => navigation.navigate('EventForm')}>
        <Text style={styles.createButtonText}>+ Nouvel événement</Text>
      </Pressable>

      <FlatList
        data={events}
        keyExtractor={(item: EventDTO) => item._id}
        onRefresh={refresh}
        refreshing={loading}
        renderItem={({ item }: { item: EventDTO }) => (
          <Pressable style={styles.card} onPress={() => openEvent(item)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{STATUS_LABELS[item.status] ?? item.status}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aucun événement. Créez le premier !</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  createButton: { backgroundColor: '#1565c0', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  createButtonText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#c62828', fontWeight: '600' }
});
