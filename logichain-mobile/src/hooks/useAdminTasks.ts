import { useCallback, useEffect, useState } from 'react';
import { TaskAdminService, type CreateTaskPayload } from '../services/TaskAdminService';
import type { TaskDTO } from '../types/dtos';

export function useAdminTasks(eventId: string) {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await TaskAdminService.listTasksForEvent(eventId));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      await TaskAdminService.createTask(eventId, payload);
      await refresh();
    },
    [eventId, refresh]
  );

  return { tasks, loading, refresh, createTask };
}
