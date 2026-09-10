import { ApiClient } from './ApiClient';
import type { TaskDTO, TaskStatus } from '../types/dtos';

/**
 * Consultation et mise a jour des taches assignees a l'utilisateur
 * authentifie (profil Agents de terrain & Prestataires).
 */
export class TaskService {
  static async listMine(): Promise<TaskDTO[]> {
    return ApiClient.get<TaskDTO[]>('/tasks/mine');
  }

  static async updateStatus(taskId: string, version: number, status: TaskStatus): Promise<TaskDTO> {
    return ApiClient.patch<TaskDTO>(`/tasks/${taskId}/status`, { version, status });
  }
}
