import { useCallback, useEffect, useState } from 'react';
import { EventAdminService, type CreateEventPayload } from '../services/EventAdminService';
import type { EventDTO } from '../types/dtos';

export function useEvents() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await EventAdminService.listEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEvent = useCallback(
    async (payload: CreateEventPayload) => {
      const created = await EventAdminService.createEvent(payload);
      await refresh();
      return created;
    },
    [refresh]
  );

  return { events, loading, error, refresh, createEvent };
}
