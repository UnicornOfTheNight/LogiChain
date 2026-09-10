import { useEffect, useState } from 'react';
import { EventAdminService } from '../services/EventAdminService';
import type { EventDTO } from '../types/dtos';

/**
 * Determine l'evenement courant de l'agent/transporteur en interrogeant
 * l'API (GET /events, accessible a tout utilisateur authentifie) plutot
 * qu'un identifiant fictif code en dur. Ce projet ne gerant qu'un seul
 * evenement actif a la fois pour cette demonstration, on prend le premier
 * de la liste ; une vraie affectation agent -> evenement viendrait du
 * profil utilisateur ou d'un ecran de selection.
 */
export function useCurrentEvent() {
  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const events = await EventAdminService.listEvents();
        setEvent(events[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger l'événement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { event, eventId: event?._id ?? null, loading, error };
}
