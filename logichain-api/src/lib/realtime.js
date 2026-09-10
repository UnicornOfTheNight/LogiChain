const { EventEmitter } = require('events');

/**
 * Hub de publication/abonnement en memoire process (remplace un serveur
 * WebSocket externe pour ce perimetre). Les controllers SSE s'abonnent a
 * un canal par evenement ; les services publient dessus lors d'une action
 * critique (anomalie, changement de statut).
 */
class RealtimeHub extends EventEmitter {
  publishAlert(eventId, alert) {
    this.emit(`alert:${eventId}`, { ...alert, timestamp: new Date().toISOString() });
  }
}

module.exports = new RealtimeHub();
