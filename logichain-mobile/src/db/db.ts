import * as SQLite from 'expo-sqlite';

/**
 * Point d'acces unique a la base SQLite locale (couche DB, jamais touchee
 * directement par les Views/Components : seuls les services y accedent).
 */
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('logichain.db');
  }
  return dbInstance;
}
