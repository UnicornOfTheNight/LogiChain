import { useCallback, useEffect, useState } from 'react';
import { RouteAdminService } from '../services/RouteAdminService';
import type { RouteDTO } from '../types/dtos';

// Supervision des transferts de responsabilite et validation des feuilles
// de route des transporteurs.
export function useRoutesAdmin(eventId: string) {
  const [routes, setRoutes] = useState<RouteDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRoutes(await RouteAdminService.listRoutes(eventId));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const validateStop = useCallback(
    async (routeId: string, stopId: string) => {
      await RouteAdminService.validateStop(eventId, routeId, stopId);
      await refresh();
    },
    [eventId, refresh]
  );

  const validateRoute = useCallback(
    async (routeId: string, version: number) => {
      await RouteAdminService.validateRoute(eventId, routeId, version);
      await refresh();
    },
    [eventId, refresh]
  );

  return { routes, loading, refresh, validateStop, validateRoute };
}
