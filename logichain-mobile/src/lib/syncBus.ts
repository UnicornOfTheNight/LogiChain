/**
 * Petit bus d'evenements en memoire permettant a n'importe quel service
 * (ItemService, useAnomaly...) de demander une synchronisation immediate
 * de la file d'attente, sans dependre directement du hook useSyncQueue
 * (qui, lui, porte l'etat partage via SyncQueueContext).
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function requestSync(): void {
  listeners.forEach((listener) => listener());
}

export function onSyncRequested(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
