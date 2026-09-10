import { useCallback, useEffect, useState } from 'react';
import { EventAdminService, type AddZonePayload } from '../services/EventAdminService';
import type { EventDTO } from '../types/dtos';

export function useZones(eventId: string) {
  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEvent(await EventAdminService.getEvent(eventId));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addZone = useCallback(
    async (payload: AddZonePayload) => {
      setSubmitting(true);
      setError(null);
      try {
        const updated = await EventAdminService.addZone(eventId, payload);
        setEvent(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'ajout de la zone");
      } finally {
        setSubmitting(false);
      }
    },
    [eventId]
  );

  return { event, loading, addZone, submitting, error, refresh };
}
