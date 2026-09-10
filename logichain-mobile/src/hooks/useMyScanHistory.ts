import { useCallback, useEffect, useState } from 'react';
import { ScanHistoryService } from '../services/ScanHistoryService';
import { SyncQueueService } from '../services/SyncQueueService';
import type { ScanHistoryEntryDTO, ItemAction, QueuedAction } from '../types/dtos';

export function useMyScanHistory() {
  const [entries, setEntries] = useState<ScanHistoryEntryDTO[]>([]);
  const [pendingScans, setPendingScans] = useState<QueuedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ItemAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [history, allPending] = await Promise.all([
        ScanHistoryService.listMine(actionFilter ?? undefined),
        SyncQueueService.listPending()
      ]);
      setEntries(history);
      // Scans pas encore parvenus au serveur (hors ligne ou en conflit) :
      // sans cette section, un scan bloque semblait "disparu" alors qu'il
      // est toujours dans la file locale (visible aussi au Centre de sync).
      setPendingScans(allPending.filter((a) => a.type === 'scan'));
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancelEntry = useCallback(
    async (entry: ScanHistoryEntryDTO) => {
      setError(null);
      try {
        await ScanHistoryService.cancel(entry.itemId, entry.timestamp, entry.action);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'annulation du scan");
      }
    },
    [refresh]
  );

  return { entries, pendingScans, loading, error, actionFilter, setActionFilter, refresh, cancelEntry };
}
