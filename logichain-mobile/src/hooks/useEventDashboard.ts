import { useCallback, useEffect, useState } from 'react';
import { EventAdminService } from '../services/EventAdminService';
import type { EventDashboardDTO } from '../types/dtos';

// Suivi des indicateurs cles (KPI) : etat des stocks, empreinte carbone
// consolidee, detection des goulots d'etranglement.
export function useEventDashboard(eventId: string) {
  const [dashboard, setDashboard] = useState<EventDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await EventAdminService.getDashboard(eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dashboard, loading, error, refresh };
}
