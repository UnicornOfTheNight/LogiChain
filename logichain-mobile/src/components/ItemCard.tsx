import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import type { ItemDTO } from '../types/dtos';

const STATUS_LABELS: Record<string, string> = {
  en_stock: 'En stock',
  en_transit: 'En transit',
  livre: 'Livré',
  en_maintenance: 'En maintenance',
  perdu: 'Perdu'
};

interface Props {
  item: ItemDTO;
  onPress: (item: ItemDTO) => void;
}

// Composant purement presentationnel : aucun appel API/SQL ici.
export default function ItemCard({ item, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(item)}>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.status}>{STATUS_LABELS[item.status] ?? item.status}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginVertical: 4, elevation: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 13, color: '#666', marginTop: 2 }
});
