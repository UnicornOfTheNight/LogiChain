import { useCallback, useEffect, useRef, useState } from 'react';
import { TaskService } from '../services/TaskService';
import { ApiError } from '../services/ApiClient';
import type { TaskDTO, TaskStatus } from '../types/dtos';

export function useMyTasks() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  // Ref miroir de updatingIds : verification synchrone anti double-tap, sans
  // recreer updateStatus a chaque changement (contrairement a un state seul).
  const updatingRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await TaskService.listMine());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (taskId: string, version: number, status: TaskStatus) => {
      // Ignore un second tap pendant qu'une requete est deja en cours pour
      // cette tache : evite d'envoyer deux fois la meme version et de
      // provoquer un faux conflit de verrouillage optimiste.
      if (updatingRef.current.has(taskId)) return;
      updatingRef.current.add(taskId);
      setUpdatingIds(new Set(updatingRef.current));
      setError(null);

      try {
        // Applique directement la tache renvoyee par l'API plutot que de
        // tout recharger : plus rapide, et l'affichage se met a jour meme
        // si un second appel reseau echouerait par ailleurs.
        const updated = await TaskService.updateStatus(taskId, version, status);
        setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // La version locale etait perimee (modifiee ailleurs) : on
          // resynchronise automatiquement pour permettre un nouvel essai
          // avec la version a jour.
          setError('Cette tâche a été modifiée entretemps : liste resynchronisée, réessayez.');
          await refresh();
        } else {
          setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la tâche');
        }
        throw err;
      } finally {
        updatingRef.current.delete(taskId);
        setUpdatingIds(new Set(updatingRef.current));
      }
    },
    [refresh]
  );

  return { tasks, loading, error, updatingIds, refresh, updateStatus };
}
