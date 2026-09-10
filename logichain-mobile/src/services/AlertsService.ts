import EventSource from 'react-native-sse';
import { API_BASE_URL } from '../config/env';
import { SecureStorage } from './SecureStorage';
import type { AlertDTO } from '../types/dtos';

type AlertListener = (alert: AlertDTO) => void;

/**
 * Client SSE pour les alertes critiques temps reel (mode connecte).
 * react-native-sse fournit une API EventSource, absente nativement de
 * React Native/Hermes.
 */
export class AlertsService {
  static async connect(eventId: string, onAlert: AlertListener): Promise<() => void> {
    const token = await SecureStorage.getAccessToken();
    const source = new EventSource(`${API_BASE_URL}/events/${eventId}/alerts/stream`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    source.addEventListener('alert', (event: any) => {
      try {
        const alert: AlertDTO = JSON.parse(event.data);
        onAlert(alert);
      } catch {
        // message malforme : ignore silencieusement
      }
    });

    return () => source.close();
  }
}
