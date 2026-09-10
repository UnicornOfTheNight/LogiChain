import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useMyTasks } from '../hooks/useMyTasks';
import type { TaskDTO, TaskStatus } from '../types/dtos';

const STATUS_LABELS: Record<string, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée'
};

// Vue : consultation des tâches assignées par l'administrateur/responsable
// logistique, avec mise à jour rapide du statut d'avancement.
export default function MyTasksScreen() {
  const { tasks, loading, error, updatingIds, refresh, updateStatus } = useMyTasks();

  const handleUpdateStatus = (taskId: string, version: number, status: TaskStatus) => {
    // Erreur deja stockee dans le hook (affichee ci-dessous) ; on avale ici
    // uniquement pour eviter un rejet de promesse non gere.
    updateStatus(taskId, version, status).catch(() => {});
  };

  return (
    <View style={styles.wrapper}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        contentContainerStyle={styles.container}
        data={tasks}
        keyExtractor={(item: TaskDTO) => item._id}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aucune tâche assignée pour le moment.</Text> : null}
        renderItem={({ item }: { item: TaskDTO }) => {
          const isUpdating = updatingIds.has(item._id);
          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              <Text style={styles.status}>{STATUS_LABELS[item.status] ?? item.status}</Text>

              <View style={styles.actions}>
                {item.status !== 'en_cours' && item.status !== 'terminee' && (
                  <Pressable
                    style={[styles.actionButton, isUpdating && styles.actionButtonDisabled]}
                    onPress={() => handleUpdateStatus(item._id, item.version, 'en_cours')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionText}>Démarrer</Text>
                    )}
                  </Pressable>
                )}
                {item.status !== 'terminee' && (
                  <Pressable
                    style={[styles.actionButton, styles.actionButtonDone, isUpdating && styles.actionButtonDisabled]}
                    onPress={() => handleUpdateStatus(item._id, item.version, 'terminee')}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionText}>Marquer terminée</Text>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
  error: { backgroundColor: '#c62828', color: '#fff', padding: 10, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  description: { color: '#666', marginTop: 4 },
  status: { color: '#1565c0', fontWeight: '600', marginTop: 8 },
  actions: { flexDirection: 'row', marginTop: 12 },
  actionButton: {
    backgroundColor: '#1565c0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 90,
    alignItems: 'center'
  },
  actionButtonDone: { backgroundColor: '#2e7d32' },
  actionButtonDisabled: { opacity: 0.5 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 }
});
