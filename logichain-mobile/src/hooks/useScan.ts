import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { ItemService } from '../services/ItemService';
import type { ItemDTO, ItemAction } from '../types/dtos';

/**
 * Encapsule la logique du module de scan : geolocalisation, mise a jour
 * optimiste locale, mise en file. La vue (ScanScreen) ne fait que
 * transmettre le code lu par la camera.
 */
export function useScan() {
  const [lastScanned, setLastScanned] = useState<ItemDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async (qrCode: string, action: ItemAction = 'livraison') => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coordinates: [number, number] | undefined;
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync();
        coordinates = [position.coords.longitude, position.coords.latitude];
      }

      const updated = await ItemService.scanOptimistic(qrCode, action, coordinates);
      if (!updated) {
        setError('Équipement inconnu du référentiel local (synchronisez le référentiel).');
        return null;
      }
      setLastScanned(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du scan');
      return null;
    }
  }, []);

  return { lastScanned, error, handleScan };
}
