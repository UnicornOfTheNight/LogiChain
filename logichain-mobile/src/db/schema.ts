import { getDb } from './db';

/**
 * Cree les tables locales (Offline-First) si elles n'existent pas encore :
 * - items : cache local du referentiel materiel assigne a l'agent
 * - queued_actions : file d'attente des actions realisees hors reseau
 *   (scan, declaration d'anomalie), rejouees a la reconnexion
 */
export async function initSchema(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      qrCode TEXT NOT NULL,
      status TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      version INTEGER NOT NULL,
      updatedAt TEXT NOT NULL,
      raw TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_items_event ON items(eventId);
    CREATE INDEX IF NOT EXISTS idx_items_qrcode ON items(qrCode);

    CREATE TABLE IF NOT EXISTS queued_actions (
      localId TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      lastError TEXT
    );
  `);
}
