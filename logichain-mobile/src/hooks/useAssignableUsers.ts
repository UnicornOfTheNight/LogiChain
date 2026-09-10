import { useCallback, useEffect, useState } from 'react';
import { TaskAdminService } from '../services/TaskAdminService';
import type { AssignableUserDTO } from '../types/dtos';

// Liste combinee des agents de terrain et transporteurs, pour le
// selecteur d'assignation de taches cote administrateur.
export function useAssignableUsers() {
  const [users, setUsers] = useState<AssignableUserDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [agents, transporteurs] = await Promise.all([
        TaskAdminService.listAssignableUsers('agent_terrain'),
        TaskAdminService.listAssignableUsers('transporteur')
      ]);
      setUsers([...agents, ...transporteurs]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, loading, refresh };
}
