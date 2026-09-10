import * as Notifications from 'expo-notifications';

// Affiche la notification meme si l'app est au premier plan, avec le son
// systeme par defaut ("sonnerie predefinie").
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

/**
 * Notifications locales declenchees par le flux d'alertes SSE (voir
 * useAlerts). Fonctionne tant que l'application est active (premier plan
 * ou recemment mise en arriere-plan, connexion SSE maintenue) — cela ne
 * remplace pas une vraie notification push OS delivree app fermee, qui
 * necessiterait un token Expo Push + un projet EAS + un appel serveur a
 * l'API Expo Push (hors perimetre ici, cf. README).
 */
export class NotificationService {
  static async requestPermissions(): Promise<void> {
    try {
      await Notifications.requestPermissionsAsync();
    } catch {
      // Permission refusee ou non disponible (ex. simulateur) : on continue
      // sans bloquer l'application.
    }
  }

  static async notifyTaskAssigned(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: null
      });
    } catch {
      // Echec silencieux : ne doit jamais interrompre le flux d'alertes
    }
  }
}
