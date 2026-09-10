import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { getDb } from '../db/db';
import { SyncQueueService } from '../services/SyncQueueService';
import { requestSync } from '../lib/syncBus';
import type { ItemDTO } from '../types/dtos';

export function useAnomaly() {
  const [submitting, setSubmitting] = useState(false);

  const declareAnomaly = useCallback(async (item: ItemDTO, note: string) => {
    setSubmitting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coordinates: [number, number] | undefined;
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync();
        coordinates = [position.coords.longitude, position.coords.latitude];
      }

      // Optimistic UI : l'item passe "en_maintenance" localement sans attendre le serveur
      const db = await getDb();
      await db.runAsync('UPDATE items SET status = ? WHERE id = ?', ['en_maintenance', item._id]);

      await SyncQueueService.enqueue('anomalie', { itemId: item._id, version: item.version, coordinates, note });
      requestSync(); // tente une synchronisation immediate si le reseau est deja disponible
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { declareAnomaly, submitting };
}
