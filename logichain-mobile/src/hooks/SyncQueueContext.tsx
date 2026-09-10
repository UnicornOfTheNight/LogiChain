import React, { createContext, useContext } from 'react';
import { useSyncQueue } from './useSyncQueue';

type SyncQueueContextValue = ReturnType<typeof useSyncQueue>;

const SyncQueueContext = createContext<SyncQueueContextValue | null>(null);

/**
 * Fournit une INSTANCE UNIQUE et partagee de l'etat de synchronisation a
 * tous les ecrans du profil terrain. Sans ce contexte, chaque ecran qui
 * appelait useSyncQueue() directement obtenait son propre etat isole :
 * resoudre un conflit sur le Centre de synchronisation ne se reflétait
 * jamais sur le badge du Dashboard (deux instances independantes du meme
 * hook, chacune avec son propre `pending`/`status` React).
 */
export function SyncQueueProvider({ children }: { children: React.ReactNode }) {
  const syncQueue = useSyncQueue();
  return <SyncQueueContext.Provider value={syncQueue}>{children}</SyncQueueContext.Provider>;
}

export function useSyncQueueContext(): SyncQueueContextValue {
  const ctx = useContext(SyncQueueContext);
  if (!ctx) throw new Error('useSyncQueueContext doit etre utilise a l\'interieur de <SyncQueueProvider>');
  return ctx;
}
