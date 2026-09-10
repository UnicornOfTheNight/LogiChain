import { useCallback, useEffect, useState } from 'react';
import { SyncQueueService, type SyncResult } from '../services/SyncQueueService';
import { useNetworkStatus } from './useNetworkStatus';
import { onSyncRequested } from '../lib/syncBus';
import type { QueuedAction, SyncStatus } from '../types/dtos';

/**
 * Centralise la logique du "Centre de synchronisation" : file d'attente
 * locale, declenchement manuel ou automatique (retour de connexion) de la
 * synchronisation en arriere-plan.
 */
export function useSyncQueue() {
  const isOnline = useNetworkStatus();
  const [pending, setPending] = useState<QueuedAction[]>([]);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const refreshPending = useCallback(async () => {
    setPending(await SyncQueueService.listPending());
  }, []);

  const runSync = useCallback(async () => {
    setStatus('syncing');
    try {
      const result = await SyncQueueService.sync();
      setLastResult(result);
      setStatus(result.failed > 0 || result.conflicts > 0 ? 'error' : 'idle');
    } finally {
      await refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  // Synchronisation automatique en arriere-plan au retour de connexion
  useEffect(() => {
    if (isOnline) {
      runSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // Synchronisation immediate demandee par un service (ex: juste apres un
  // scan) : sans cela, un nouvel ajout a la file pendant que isOnline est
  // deja "true" n'etait jamais rejoue automatiquement (l'effet ci-dessus
  // ne se redeclenche que sur un CHANGEMENT de isOnline, pas sur un ajout
  // a la file) -> l'action restait invisible cote historique tant qu'on
  // n'appuyait pas manuellement sur "Forcer la synchronisation".
  useEffect(() => {
    return onSyncRequested(() => {
      if (isOnline) runSync();
    });
  }, [isOnline, runSync]);

  // Abandonne une action bloquee (ex: conflit de version persistant) : la
  // retire definitivement de la file locale sans la synchroniser. C'est
  // la seule facon de "resoudre" un conflit quand rejouer l'action telle
  // quelle echouerait indefiniment (donnee locale perimee).
  const discardAction = useCallback(
    async (localId: string) => {
      await SyncQueueService.remove(localId);
      await refreshPending();
    },
    [refreshPending]
  );

  return { pending, status, lastResult, isOnline, runSync, refreshPending, discardAction };
}
