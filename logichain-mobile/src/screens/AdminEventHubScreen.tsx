import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
  eventId: string;
  eventName: string;
}

// Vue : point d'entrée des quatre espaces de gestion d'un événement.
export default function AdminEventHubScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ params: RouteParams }>();
  const { eventId, eventName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{eventName}</Text>

      <Pressable style={styles.card} onPress={() => navigation.navigate('AdminDashboard', { eventId, eventName })}>
        <Text style={styles.cardTitle}>Tableau de bord KPI</Text>
        <Text style={styles.cardSubtitle}>Stocks, empreinte carbone, goulots d'étranglement</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('AdminZones', { eventId, eventName })}>
        <Text style={styles.cardTitle}>Découpage des zones</Text>
        <Text style={styles.cardSubtitle}>Configuration cartographique de l'événement</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('AdminRoutes', { eventId, eventName })}>
        <Text style={styles.cardTitle}>Feuilles de route</Text>
        <Text style={styles.cardSubtitle}>Transferts de responsabilité, validation transporteurs</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('AdminTasks', { eventId, eventName })}>
        <Text style={styles.cardTitle}>Tâches</Text>
        <Text style={styles.cardSubtitle}>Assigner des tâches aux agents et transporteurs</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('AdminItems', { eventId, eventName })}>
        <Text style={styles.cardTitle}>Équipements</Text>
        <Text style={styles.cardSubtitle}>Affecter le matériel aux agents et transporteurs</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('AdminScanHistory', { eventId, eventName })}>
        <Text style={styles.cardTitle}>Historique des scans</Text>
        <Text style={styles.cardSubtitle}>Filtrer par agent, équipement, zone ou type de scan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#666', marginTop: 4 }
});
