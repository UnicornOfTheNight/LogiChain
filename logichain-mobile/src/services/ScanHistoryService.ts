import { ApiClient } from './ApiClient';
import type { ScanHistoryEntryDTO, ItemAction } from '../types/dtos';

// Historique de mes propres scans (profil Agents de terrain & Prestataires)
export class ScanHistoryService {
  static async listMine(action?: ItemAction): Promise<ScanHistoryEntryDTO[]> {
    const query = action ? `?action=${encodeURIComponent(action)}` : '';
    return ApiClient.get<ScanHistoryEntryDTO[]>(`/scan-history/mine${query}`);
  }

  static async cancel(itemId: string, timestamp: string, action: ItemAction): Promise<void> {
    await ApiClient.patch(`/items/${itemId}/scan-history/cancel`, { timestamp, action });
  }
}
