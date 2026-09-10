import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAdminTasks } from '../hooks/useAdminTasks';
import { useAssignableUsers } from '../hooks/useAssignableUsers';
import type { TaskDTO, AssignableUserDTO } from '../types/dtos';

interface RouteParams {
  eventId: string;
  eventName: string;
}

const STATUS_LABELS: Record<string, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée'
};

const ROLE_LABELS: Record<string, string> = {
  agent_terrain: 'Agent de terrain',
  transporteur: 'Transporteur'
};

// Vue : attribution de tâches aux agents de terrain et transporteurs, et
// suivi de leur avancement.
export default function AdminTasksScreen() {
  const route = useRoute<{ params: RouteParams }>();
  const { eventId } = route.params;
  const { tasks, loading, createTask } = useAdminTasks(eventId);
  const { users, loading: usersLoading } = useAssignableUsers();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!assigneeId) return;
    setSubmitting(true);
    setError(null);
    try {
      await createTask({ assignedToUserId: assigneeId, title, description });
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la tâche");
    } finally {
      setSubmitting(false);
    }
  };

  const assigneeLabel = (user: AssignableUserDTO) => `${user.name ?? user.email} (${ROLE_LABELS[user.role] ?? user.role})`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Nouvelle tâche</Text>

      <Text style={styles.label}>Titre</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Vérifier le montage scène B" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Détails de la tâche à accomplir"
        multiline
      />

      <Text style={styles.label}>Assigner à</Text>
      {usersLoading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.assigneeList}>
          {users.map((user) => (
            <Pressable
              key={user.id}
              style={[styles.assigneeChip, assigneeId === user.id && styles.assigneeChipActive]}
              onPress={() => setAssigneeId(user.id)}
            >
              <Text style={[styles.assigneeChipText, assigneeId === user.id && styles.assigneeChipTextActive]}>
                {assigneeLabel(user)}
              </Text>
            </Pressable>
          ))}
          {users.length === 0 && <Text style={styles.empty}>Aucun agent/transporteur trouvé.</Text>}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.button}
        onPress={onSubmit}
        disabled={submitting || !assigneeId || title.trim().length === 0}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Assigner la tâche</Text>}
      </Pressable>

      <Text style={styles.sectionTitle}>Tâches de l'événement ({tasks.length})</Text>
      {loading && tasks.length === 0 && <ActivityIndicator />}
      <FlatList
        data={tasks}
        keyExtractor={(item: TaskDTO) => item._id}
        scrollEnabled={false}
        renderItem={({ item }: { item: TaskDTO }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskStatus}>{STATUS_LABELS[item.status] ?? item.status}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aucune tâche pour cet événement.</Text> : null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  assigneeList: { flexDirection: 'row', flexWrap: 'wrap' },
  assigneeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1565c0',
    marginRight: 8,
    marginBottom: 8
  },
  assigneeChipActive: { backgroundColor: '#1565c0' },
  assigneeChipText: { color: '#1565c0', fontSize: 13 },
  assigneeChipTextActive: { color: '#fff' },
  button: { backgroundColor: '#1565c0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c62828', marginTop: 8 },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  taskTitle: { flex: 1, fontWeight: '600' },
  taskStatus: { color: '#666' },
  empty: { color: '#999', marginTop: 8 }
});
