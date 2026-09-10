import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useZones } from '../hooks/useZones';
import ZoneMapPicker from '../components/ZoneMapPicker';
import type { ZoneType } from '../types/dtos';

interface RouteParams {
  eventId: string;
  eventName: string;
}

const ZONE_TYPES: { value: ZoneType; label: string }[] = [
  { value: 'scene', label: 'Scène' },
  { value: 'stock', label: 'Stockage' },
  { value: 'entree', label: 'Entrée' },
  { value: 'securite', label: 'Sécurité' },
  { value: 'technique', label: 'Technique' }
];

// Vue : découpage cartographique des zones. La carte (ZoneMapPicker) capture
// les points tapés ; cet écran orchestre la validation et l'appel au hook.
export default function AdminZonesScreen() {
  const route = useRoute<{ params: RouteParams }>();
  const { eventId } = route.params;
  const { event, loading, addZone, submitting, error } = useZones(eventId);

  const [name, setName] = useState('');
  const [type, setType] = useState<ZoneType>('stock');
  const [points, setPoints] = useState<[number, number][]>([]);
  const [mapResetKey, setMapResetKey] = useState(0);

  const clearMap = () => {
    setPoints([]);
    setMapResetKey((k) => k + 1);
  };

  const onSubmit = async () => {
    if (points.length < 3) return;
    const closed = [...points];
    const first = closed[0];
    const last = closed[closed.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first);

    await addZone({ name, type, coordinates: closed });
    setName('');
    clearMap();
  };

  if (loading && !event) return <ActivityIndicator style={styles.center} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Zones existantes ({event?.zones?.length ?? 0})</Text>
      {(event?.zones ?? []).map((zone) => (
        <View key={zone._id} style={styles.zoneRow}>
          <Text style={styles.zoneName}>{zone.name}</Text>
          <Text style={styles.zoneType}>{ZONE_TYPES.find((t) => t.value === zone.type)?.label ?? zone.type}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Ajouter une zone</Text>
      <Text style={styles.hint}>
        Touchez la carte pour placer les sommets du polygone (3 minimum), dans l'ordre. Il se referme
        automatiquement à la validation.
      </Text>

      <ZoneMapPicker
        existingZones={event?.zones ?? []}
        resetKey={mapResetKey}
        onPointsChange={setPoints}
      />

      <View style={styles.mapActions}>
        <Text style={styles.pointsCount}>{points.length} point{points.length > 1 ? 's' : ''} placé{points.length > 1 ? 's' : ''}</Text>
        <Pressable onPress={clearMap}>
          <Text style={styles.clearLink}>Effacer les points</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Nom de la zone</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Zone de stockage" />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {ZONE_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.typeChip, type === t.value && styles.typeChipActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.button}
        onPress={onSubmit}
        disabled={submitting || name.trim().length === 0 || points.length < 3}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ajouter la zone</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  hint: { color: '#666', fontSize: 13, marginBottom: 4 },
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6
  },
  zoneName: { fontWeight: '600' },
  zoneType: { color: '#666' },
  mapActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pointsCount: { color: '#333', fontWeight: '600' },
  clearLink: { color: '#c62828', fontWeight: '600' },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1565c0',
    marginRight: 8,
    marginBottom: 8
  },
  typeChipActive: { backgroundColor: '#1565c0' },
  typeChipText: { color: '#1565c0' },
  typeChipTextActive: { color: '#fff' },
  button: { backgroundColor: '#1565c0', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c62828', marginTop: 8 }
});
