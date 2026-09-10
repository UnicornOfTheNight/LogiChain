import { useCallback, useEffect, useState } from 'react';
import { ScanHistoryAdminService, type ScanHistoryFilters } from '../services/ScanHistoryAdminService';
import type { ScanHistoryEntryDTO } from '../types/dtos';

export function useScanHistoryAdmin(eventId: string) {
  const [entries, setEntries] = useState<ScanHistoryEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ScanHistoryFilters>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await ScanHistoryAdminService.list(eventId, filters));
    } finally {
      setLoading(false);
    }
  }, [eventId, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancelEntry = useCallback(
    async (entry: ScanHistoryEntryDTO) => {
      setError(null);
      try {
        await ScanHistoryAdminService.cancel(entry.itemId, entry.timestamp, entry.action);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'annulation du scan");
      }
    },
    [refresh]
  );

  return { entries, loading, error, filters, setFilters, refresh, cancelEntry };
}
