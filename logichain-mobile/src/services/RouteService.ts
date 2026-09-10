import { ApiClient } from './ApiClient';
import type { RouteDTO } from '../types/dtos';

/**
 * Consultation du planning de livraison assigne a l'utilisateur
 * authentifie (profil Agents de terrain & Prestataires).
 */
export class RouteService {
  static async listMine(): Promise<RouteDTO[]> {
    return ApiClient.get<RouteDTO[]>('/routes/mine');
  }
}
