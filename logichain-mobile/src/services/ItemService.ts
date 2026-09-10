import { getDb } from '../db/db';
import { ApiClient } from './ApiClient';
import { SyncQueueService } from './SyncQueueService';
import { requestSync } from '../lib/syncBus';
import type { ItemDTO, ItemStatus, ItemAction } from '../types/dtos';

interface ItemRow {
  id: string;
  eventId: string;
  raw: string;
}

function rowToItem(row: ItemRow): ItemDTO {
  return JSON.parse(row.raw);
}

const ACTION_TO_STATUS: Partial<Record<ItemAction, ItemStatus>> = {
  livraison: 'livre',
  deplacement: 'en_transit',
  maintenance: 'en_maintenance',
  anomalie: 'en_maintenance',
  retour: 'en_stock'
};

/**
 * Referentiel materiel : cache local (SQLite) + synchronisation API.
 * Aucun ecran n'appelle expo-sqlite ou fetch() directement, tout passe
 * par ce service.
 */
export class ItemService {
  // Telechargement initial du referentiel assigne a l'agent (onboarding)
  static async refreshFromApi(eventId: string): Promise<ItemDTO[]> {
    const items = await ApiClient.get<ItemDTO[]>(`/events/${eventId}/items`);
    const db = await getDb();
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO items (id, eventId, label, category, qrCode, status, latitude, longitude, version, updatedAt, raw)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item._id,
          item.eventId,
          item.label,
          item.category,
          item.qrCode,
          item.status,
          item.location?.coordinates?.[0] ?? null,
          item.location?.coordinates?.[1] ?? null,
          item.version,
          item.updatedAt,
          JSON.stringify(item)
        ]
      );
    }
    return items;
  }

  static async listLocal(eventId: string): Promise<ItemDTO[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ItemRow>('SELECT id, eventId, raw FROM items WHERE eventId = ? ORDER BY updatedAt DESC', [
      eventId
    ]);
    return rows.map(rowToItem);
  }

  static async findLocalById(itemId: string): Promise<ItemDTO | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ItemRow>('SELECT id, eventId, raw FROM items WHERE id = ?', [itemId]);
    return row ? rowToItem(row) : null;
  }

  static async findLocalByQrCode(qrCode: string): Promise<ItemDTO | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ItemRow>('SELECT id, eventId, raw FROM items WHERE qrCode = ?', [qrCode]);
    return row ? rowToItem(row) : null;
  }

  /**
   * Optimistic UI : applique immediatement le nouveau statut en local et
   * empile l'action pour synchronisation, SANS attendre la reponse serveur
   * (exigence "Optimistic UI" du cahier des charges). En cas d'echec
   * definitif remonte par le centre de synchronisation, appeler
   * rollbackLocalStatus() pour annuler visuellement l'action.
   */
  static async scanOptimistic(
    qrCode: string,
    action: ItemAction,
    coordinates?: [number, number],
    note?: string
  ): Promise<ItemDTO | null> {
    const item = await this.findLocalByQrCode(qrCode);
    if (!item) return null;

    const newStatus = ACTION_TO_STATUS[action] ?? item.status;
    const updated: ItemDTO = { ...item, status: newStatus };
    await this._saveLocal(updated);

    await SyncQueueService.enqueue('scan', { qrCode, action, coordinates, note });
    requestSync(); // tente une synchronisation immediate si le reseau est deja disponible

    return updated;
  }

  static async rollbackLocalStatus(itemId: string, previousStatus: ItemStatus): Promise<void> {
    const item = await this.findLocalById(itemId);
    if (!item) return;
    await this._saveLocal({ ...item, status: previousStatus });
  }

  private static async _saveLocal(item: ItemDTO): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE items SET status = ?, raw = ?, updatedAt = ? WHERE id = ?', [
      item.status,
      JSON.stringify(item),
      new Date().toISOString(),
      item._id
    ]);
  }
}
