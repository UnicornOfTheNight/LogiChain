class Route {
  static STATUSES = ['planifiee', 'en_cours', 'validee', 'annulee'];

  constructor({ eventId, transporterId, stops = [], status = 'planifiee', version = 0 }) {
    this.eventId = eventId;
    this.transporterId = transporterId;
    this.stops = stops;
    this.status = status;
    this.version = version;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static validate(data) {
    const errors = [];
    if (!data.eventId) errors.push('eventId est requis');
    if (!data.transporterId) errors.push('transporterId est requis');
    if (data.status && !Route.STATUSES.includes(data.status)) errors.push('status invalide');
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  // Validation du statut seul (cf. validation de feuille de route par l'administrateur)
  static validateStatus(status) {
    if (!Route.STATUSES.includes(status)) {
      const err = new Error(`status doit etre parmi ${Route.STATUSES.join(', ')}`);
      err.name = 'ValidationError';
      throw err;
    }
  }

  toDocument() {
    const { eventId, transporterId, stops, status, version, createdAt, updatedAt } = this;
    return { eventId, transporterId, stops, status, version, createdAt, updatedAt };
  }
}

module.exports = Route;
