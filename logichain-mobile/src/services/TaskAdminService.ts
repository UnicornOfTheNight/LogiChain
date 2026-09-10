import { ApiClient } from './ApiClient';
import type { TaskDTO, AssignableUserDTO, UserRole } from '../types/dtos';

export interface CreateTaskPayload {
  assignedToUserId: string;
  title: string;
  description?: string;
  dueAt?: string;
}

/**
 * Attribution de taches aux agents de terrain et transporteurs (profil
 * Administrateurs & Responsables logistiques).
 */
export class TaskAdminService {
  static async listAssignableUsers(role: UserRole): Promise<AssignableUserDTO[]> {
    return ApiClient.get<AssignableUserDTO[]>(`/users?role=${encodeURIComponent(role)}`);
  }

  static async listTasksForEvent(eventId: string): Promise<TaskDTO[]> {
    return ApiClient.get<TaskDTO[]>(`/events/${eventId}/tasks`);
  }

  static async createTask(eventId: string, payload: CreateTaskPayload): Promise<TaskDTO> {
    return ApiClient.post<TaskDTO>(`/events/${eventId}/tasks`, payload);
  }
}
