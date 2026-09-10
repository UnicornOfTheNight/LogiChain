import { ApiClient } from './ApiClient';
import type { RouteDTO } from '../types/dtos';

/**
 * Supervision des transferts de responsabilite et validation des feuilles
 * de route des transporteurs (profil Administrateurs & Responsables
 * logistiques).
 */
export class RouteAdminService {
  static async listRoutes(eventId: string): Promise<RouteDTO[]> {
    return ApiClient.get<RouteDTO[]>(`/events/${eventId}/routes`);
  }

  // Transfert de responsabilite : validation d'un arret precis
  static async validateStop(eventId: string, routeId: string, stopId: string): Promise<RouteDTO> {
    return ApiClient.patch<RouteDTO>(`/events/${eventId}/routes/${routeId}/stops/${stopId}/validate`, {});
  }

  // Validation/cloture de la feuille de route entiere
  static async validateRoute(eventId: string, routeId: string, version: number): Promise<RouteDTO> {
    return ApiClient.patch<RouteDTO>(`/events/${eventId}/routes/${routeId}/status`, {
      version,
      status: 'validee'
    });
  }
}
