import { getDb } from '../db/db';
import { ApiClient, ApiError } from './ApiClient';
import type { QueuedAction, ScanActionPayload, AnomalyActionPayload } from '../types/dtos';

interface QueuedActionRow {
  localId: string;
  type: string;
  payload: string;
  createdAt: string;
  attempts: number;
  lastError: string | null;
}

function rowToAction(row: QueuedActionRow): QueuedAction {
  return {
    localId: row.localId,
    type: row.type as QueuedAction['type'],
    payload: JSON.parse(row.payload),
    createdAt: row.createdAt,
    attempts: row.attempts,
    lastError: row.lastError ?? undefined
  };
}

export interface SyncResult {
  synced: number;
  conflicts: number;
  failed: number;
}

/**
 * File d'attente locale des actions realisees hors reseau (mode degrade).
 * Empile puis rejoue les actions vers l'API a la reconnexion, dans l'ordre
 * chronologique, sans jamais perdre de donnee (exigence "robustesse du
 * mode deconnecte").
 */
export class SyncQueueService {
  // Empeche deux appels a sync() de s'executer en parallele (ex: la
  // synchro automatique post-scan et un appui manuel sur "Forcer la
  // synchronisation" presque simultanes) : sans ce verrou, deux passages
  // concurrents pouvaient traiter la meme action en meme temps et
  // provoquer un faux conflit de version en plus des vrais.
  private static syncing = false;

  static async enqueue(
    type: QueuedAction['type'],
    payload: ScanActionPayload | AnomalyActionPayload
  ): Promise<void> {
    const db = await getDb();
    const localId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.runAsync(
      'INSERT INTO queued_actions (localId, type, payload, createdAt, attempts) VALUES (?, ?, ?, ?, 0)',
      [localId, type, JSON.stringify(payload), new Date().toISOString()]
    );
  }

  static async listPending(): Promise<QueuedAction[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<QueuedActionRow>('SELECT * FROM queued_actions ORDER BY createdAt ASC');
    return rows.map(rowToAction);
  }

  static async remove(localId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM queued_actions WHERE localId = ?', [localId]);
  }

  private static async markFailed(localId: string, error: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE queued_actions SET attempts = attempts + 1, lastError = ? WHERE localId = ?', [
      error,
      localId
    ]);
  }

  /**
   * Rejoue la file vers l'API. Un conflit de verrouillage optimiste (409)
   * est laisse en file pour arbitrage manuel au centre de synchronisation
   * plutot que retente indefiniment. Une erreur reseau arrete la boucle
   * (on retentera au prochain retour de connexion) sans perdre les actions
   * suivantes.
   */
  static async sync(): Promise<SyncResult> {
    if (this.syncing) {
      // Une synchronisation est deja en cours : on ignore cet appel
      // plutot que de retraiter la meme file en parallele.
      return { synced: 0, conflicts: 0, failed: 0 };
    }
    this.syncing = true;

    try {
      const pending = await this.listPending();
      const result: SyncResult = { synced: 0, conflicts: 0, failed: 0 };

      for (const action of pending) {
        try {
          if (action.type === 'scan') {
            await ApiClient.post('/items/scan', action.payload);
          } else if (action.type === 'anomalie') {
            const payload = action.payload as AnomalyActionPayload;
            await ApiClient.patch(`/items/${payload.itemId}/anomalie`, payload);
          }
          await this.remove(action.localId);
          result.synced += 1;
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            result.conflicts += 1;
            await this.markFailed(action.localId, "Conflit de version : modifie par un autre agent entretemps.");
          } else if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
            result.failed += 1;
            await this.markFailed(action.localId, err.message);
          } else {
            result.failed += 1;
            await this.markFailed(action.localId, 'Reseau indisponible.');
            break;
          }
        }
      }

      return result;
    } finally {
      this.syncing = false;
    }
  }
}
