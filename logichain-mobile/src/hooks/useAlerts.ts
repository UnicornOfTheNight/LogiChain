import { useEffect, useState } from 'react';
import { AlertsService } from '../services/AlertsService';
import { NotificationService } from '../services/NotificationService';
import type { AlertDTO } from '../types/dtos';

const NOTIFICATION_TITLES: Record<string, string> = {
  nouvelle_tache: 'Nouvelle tâche assignée',
  equipement_affecte: 'Nouvel équipement affecté',
  anomalie: 'Anomalie signalée'
};

export function useAlerts(eventId: string | null) {
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);

  useEffect(() => {
    if (!eventId) return;
    let cleanup: (() => void) | undefined;

    AlertsService.connect(eventId, (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));

      // Notification locale avec sonnerie predefinie : declenchee des
      // qu'une tache ou un equipement est affecte a l'agent connecte
      // (le flux SSE est deja filtre par evenement cote serveur).
      if (alert.type === 'nouvelle_tache' || alert.type === 'equipement_affecte') {
        const title = NOTIFICATION_TITLES[alert.type] ?? 'Nouvelle alerte';
        NotificationService.notifyTaskAssigned(title, alert.label);
      }
    }).then((disconnect) => {
      cleanup = disconnect;
    });

    return () => cleanup?.();
  }, [eventId]);

  return alerts;
}
