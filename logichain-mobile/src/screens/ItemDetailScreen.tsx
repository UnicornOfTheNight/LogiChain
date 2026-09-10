import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ItemService } from '../services/ItemService';
import { useAnomaly } from '../hooks/useAnomaly';
import type { ItemDTO } from '../types/dtos';

interface RouteParams {
  itemId: string;
}

const STATUS_LABELS: Record<string, string> = {
  en_stock: 'En stock',
  en_transit: 'En transit',
  livre: 'Livré',
  en_maintenance: 'En maintenance',
  perdu: 'Perdu'
};

// Vue : affiche le détail d'un équipement (depuis le cache local, cohérent
// avec le mode hors-ligne) et permet de déclarer une anomalie géolocalisée.
export default function ItemDetailScreen() {
  const route = useRoute<{ params: RouteParams }>();
  const { itemId } = route.params;
  const [item, setItem] = useState<ItemDTO | null>(null);
  const [note, setNote] = useState('');
  const { declareAnomaly, submitting } = useAnomaly();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    ItemService.findLocalById(itemId).then(setItem);
  }, [itemId]);

  if (!item) return <ActivityIndicator style={styles.center} />;

  const onSubmit = async () => {
    await declareAnomaly(item, note);
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.label}</Text>
      <Text style={styles.subtitle}>Statut actuel : {STATUS_LABELS[item.status] ?? item.status}</Text>

      {submitted ? (
        <Text style={styles.confirmation}>
          Anomalie enregistrée localement. Elle sera synchronisée automatiquement au retour du réseau
          (visible dans le centre de synchronisation).
        </Text>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Décrire l'anomalie constatée"
            value={note}
            onChangeText={setNote}
            multiline
          />
          <Pressable style={styles.button} onPress={onSubmit} disabled={submitting || note.trim().length === 0}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Déclarer une anomalie</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#666', marginBottom: 16 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, minHeight: 80, marginBottom: 12 },
  button: { backgroundColor: '#c62828', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  confirmation: { color: '#2e7d32', marginTop: 12 }
});
