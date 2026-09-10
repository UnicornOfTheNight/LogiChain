import { ApiClient } from './ApiClient';
import type { ScanHistoryEntryDTO, ItemAction } from '../types/dtos';

export interface ScanHistoryFilters {
  agentId?: string;
  itemId?: string;
  action?: ItemAction;
  zoneId?: string;
}

// Historique complet des scans, avec filtres (profil Administrateurs & Responsables logistiques)
export class ScanHistoryAdminService {
  static async list(eventId: string, filters: ScanHistoryFilters = {}): Promise<ScanHistoryEntryDTO[]> {
    const params = new URLSearchParams();
    if (filters.agentId) params.set('agentId', filters.agentId);
    if (filters.itemId) params.set('itemId', filters.itemId);
    if (filters.action) params.set('action', filters.action);
    if (filters.zoneId) params.set('zoneId', filters.zoneId);
    const query = params.toString();
    return ApiClient.get<ScanHistoryEntryDTO[]>(`/events/${eventId}/scan-history${query ? `?${query}` : ''}`);
  }

  static async cancel(itemId: string, timestamp: string, action: ItemAction): Promise<void> {
    await ApiClient.patch(`/items/${itemId}/scan-history/cancel`, { timestamp, action });
  }
}
