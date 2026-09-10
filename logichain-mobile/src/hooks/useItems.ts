import { useCallback, useEffect, useState } from 'react';
import { ItemService } from '../services/ItemService';
import type { ItemDTO } from '../types/dtos';

export function useItems(eventId: string | null) {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocal = useCallback(async () => {
    if (!eventId) {
      setItems([]);
      return;
    }
    setItems(await ItemService.listLocal(eventId));
  }, [eventId]);

  const refresh = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ItemService.refreshFromApi(eventId);
    } catch (err) {
      // Hors ligne ou API indisponible : on garde le cache local existant
      // (onboarding initial non bloquant, cf. mode degrade).
      setError(err instanceof Error ? err.message : 'Impossible de synchroniser le référentiel (hors ligne ?)');
    } finally {
      await loadLocal();
      setLoading(false);
    }
  }, [eventId, loadLocal]);

  // Synchronise le referentiel des l'ouverture de l'ecran (telechargement
  // initial du referentiel, exigence "Authentification et onboarding").
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh, reloadLocal: loadLocal };
}
