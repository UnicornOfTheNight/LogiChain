import { useCallback, useEffect, useState } from 'react';
import { EventAdminService } from '../services/EventAdminService';
import { RouteAdminService } from '../services/RouteAdminService';
import type { ZoneDTO, StopDTO } from '../types/dtos';

/**
 * Itineraire de l'agent : zones de l'evenement + arrets des feuilles de
 * route (donnees GeoJSON deja exposees par l'API). EventAdminService /
 * RouteAdminService ne sont "Admin" que par leur nom d'origine : les
 * endpoints qu'ils appellent (GET /events/:id, GET /events/:eventId/routes)
 * n'exigent qu'une authentification, accessible a tous les roles.
 */
export function useItinerary(eventId: string | null) {
  const [zones, setZones] = useState<ZoneDTO[]>([]);
  const [stops, setStops] = useState<StopDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [event, routes] = await Promise.all([
        EventAdminService.getEvent(eventId),
        RouteAdminService.listRoutes(eventId)
      ]);
      setZones(event.zones ?? []);
      setStops(routes.flatMap((r) => r.stops));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { zones, stops, loading, refresh };
}
