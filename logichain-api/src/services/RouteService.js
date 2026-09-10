const Route = require('../models/Route');
const routeRepository = require('../repositories/RouteRepository');

class RouteService {
  async createRoute(payload) {
    Route.validate(payload);
    const route = new Route(payload);
    return routeRepository.create(route.toDocument());
  }

  async listRoutes(eventId, pagination) {
    return routeRepository.findByEvent(eventId, pagination);
  }

  // Plannings de livraison assignes a l'utilisateur authentifie (agent/transporteur)
  async listMine(userId, pagination) {
    return routeRepository.findByTransporter(userId, pagination);
  }

  // Supervision des transferts de responsabilite : validation d'un arret
  async validateStop(routeId, stopId) {
    const updated = await routeRepository.validateStop(routeId, stopId);
    if (!updated) {
      const err = new Error('ARRET_INTROUVABLE');
      err.statusCode = 404;
      throw err;
    }
    return updated;
  }

  // Validation de la feuille de route dans son ensemble (statut global)
  async updateStatus(routeId, currentVersion, status) {
    Route.validateStatus(status);
    const updated = await routeRepository.updateWithLock(routeId, currentVersion, { status });
    if (!updated) {
      const err = new Error('CONFLIT_VERSION');
      err.statusCode = 409;
      throw err;
    }
    return updated;
  }
}

module.exports = new RouteService();
