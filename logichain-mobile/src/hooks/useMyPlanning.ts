import { useCallback, useEffect, useState } from 'react';
import { RouteService } from '../services/RouteService';
import type { RouteDTO } from '../types/dtos';

// Plannings de livraison assignes (feuilles de route dont l'utilisateur
// authentifie est le transporteur/destinataire).
export function useMyPlanning() {
  const [routes, setRoutes] = useState<RouteDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRoutes(await RouteService.listMine());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { routes, loading, refresh };
}
