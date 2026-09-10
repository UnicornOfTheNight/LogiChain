import { ApiClient } from './ApiClient';
import type { EventDTO, EventDashboardDTO, ZoneType } from '../types/dtos';

export interface CreateEventPayload {
  name: string;
  type: EventDTO['type'];
  startDate: string;
  endDate: string;
}

export interface AddZonePayload {
  name: string;
  type: ZoneType;
  coordinates: [number, number][];
}

/**
 * Configuration globale de l'evenement et decoupage cartographique des
 * zones (profil Administrateurs & Responsables logistiques).
 */
export class EventAdminService {
  static async listEvents(): Promise<EventDTO[]> {
    return ApiClient.get<EventDTO[]>('/events');
  }

  static async getEvent(eventId: string): Promise<EventDTO> {
    return ApiClient.get<EventDTO>(`/events/${eventId}`);
  }

  static async createEvent(payload: CreateEventPayload): Promise<EventDTO> {
    return ApiClient.post<EventDTO>('/events', payload);
  }

  static async updateStatus(eventId: string, version: number, status: EventDTO['status']): Promise<EventDTO> {
    return ApiClient.patch<EventDTO>(`/events/${eventId}/status`, { version, status });
  }

  static async addZone(eventId: string, payload: AddZonePayload): Promise<EventDTO> {
    return ApiClient.post<EventDTO>(`/events/${eventId}/zones`, payload);
  }

  static async getDashboard(eventId: string): Promise<EventDashboardDTO> {
    return ApiClient.get<EventDashboardDTO>(`/events/${eventId}/dashboard`);
  }
}
