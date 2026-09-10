import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEvents } from '../hooks/useEvents';
import type { EventDTO } from '../types/dtos';

const TYPES: EventDTO['type'][] = ['festival', 'salon', 'rassemblement'];

// Vue : configuration globale d'un nouvel événement (nom, type, dates).
export default function AdminEventFormScreen() {
  const navigation = useNavigation<any>();
  const { createEvent } = useEvents();
  const [name, setName] = useState('');
  const [type, setType] = useState<EventDTO['type']>('festival');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-03');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createEvent({ name, type, startDate, endDate });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nom de l'événement</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Festival Éco-Responsable 2026" />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <Pressable key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
            <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Date de début (AAAA-MM-JJ)</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-09-01" />

      <Text style={styles.label}>Date de fin (AAAA-MM-JJ)</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-09-03" />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={onSubmit} disabled={submitting || name.trim().length === 0}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer l'événement</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  typeRow: { flexDirection: 'row' },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1565c0',
    marginRight: 8
  },
  typeChipActive: { backgroundColor: '#1565c0' },
  typeChipText: { color: '#1565c0' },
  typeChipTextActive: { color: '#fff' },
  button: { backgroundColor: '#1565c0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c62828', marginTop: 12 }
});
