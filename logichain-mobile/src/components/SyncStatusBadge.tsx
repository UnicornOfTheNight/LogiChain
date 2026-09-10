import React from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import type { SyncStatus } from '../types/dtos';

interface Props {
  status: SyncStatus;
  pendingCount: number;
  onPress?: () => void;
}

const COLORS: Record<SyncStatus, string> = { idle: '#2e7d32', syncing: '#f9a825', error: '#c62828' };
const LABELS: Record<SyncStatus, string> = {
  idle: 'Synchronisé',
  syncing: 'Synchronisation...',
  error: 'Conflits en attente'
};

// Composant presentationnel : le clic delegue a onPress (navigation geree
// par l'ecran appelant, cf. DashboardScreen -> Centre de synchronisation).
export default function SyncStatusBadge({ status, pendingCount, onPress }: Props) {
  return (
    <Pressable style={[styles.badge, { backgroundColor: COLORS[status] }]} onPress={onPress} disabled={!onPress}>
      <Text style={styles.text}>
        {LABELS[status]}
        {pendingCount > 0 ? ` (${pendingCount})` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' }
});
