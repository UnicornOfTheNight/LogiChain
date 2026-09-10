import { useCallback, useEffect, useState } from 'react';
import { ItemAdminService } from '../services/ItemAdminService';
import type { ItemDTO } from '../types/dtos';

export function useAdminItems(eventId: string) {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await ItemAdminService.listItemsForEvent(eventId));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const assignItem = useCallback(
    async (itemId: string, userId: string | null) => {
      const updated = await ItemAdminService.assignItem(itemId, userId);
      setItems((prev) => prev.map((it) => (it._id === itemId ? updated : it)));
    },
    []
  );

  return { items, loading, refresh, assignItem };
}
