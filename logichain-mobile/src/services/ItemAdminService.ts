import { ApiClient } from './ApiClient';
import type { ItemDTO } from '../types/dtos';

/**
 * Affectation d'equipements aux agents de terrain et transporteurs
 * (profil Administrateurs & Responsables logistiques).
 */
export class ItemAdminService {
  static async listItemsForEvent(eventId: string): Promise<ItemDTO[]> {
    return ApiClient.get<ItemDTO[]>(`/events/${eventId}/items`);
  }

  // userId = null pour desaffecter
  static async assignItem(itemId: string, userId: string | null): Promise<ItemDTO> {
    return ApiClient.patch<ItemDTO>(`/items/${itemId}/assign`, { userId });
  }
}
