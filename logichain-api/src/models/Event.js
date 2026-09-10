/**
 * Entite Event : classe POO pure (aucune dependance externe).
 * Porte les regles de validation et la mise en forme du document MongoDB.
 */
class Event {
  static TYPES = ['festival', 'salon', 'rassemblement'];
  static STATUSES = ['planifie', 'montage', 'en_cours', 'demontage', 'termine'];
  static ZONE_TYPES = ['scene', 'stock', 'entree', 'securite', 'technique'];

  constructor({ name, type, startDate, endDate, status = 'planifie', zones = [], version = 0 }) {
    this.name = name;
    this.type = type;
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
    this.status = status;
    this.zones = zones;
    this.version = version;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static validate(data) {
    const errors = [];
    if (!data.name) errors.push('name est requis');
    if (!Event.TYPES.includes(data.type)) errors.push(`type doit etre parmi ${Event.TYPES.join(', ')}`);
    if (!data.startDate) errors.push('startDate est requis');
    if (!data.endDate) errors.push('endDate est requis');
    if (data.status && !Event.STATUSES.includes(data.status)) errors.push('status invalide');
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  // Decoupage cartographique des zones : un polygone GeoJSON ferme (>= 3 sommets distincts + fermeture)
  static validateZone(data) {
    const errors = [];
    if (!data.name) errors.push('name est requis');
    if (!Event.ZONE_TYPES.includes(data.type)) errors.push(`type doit etre parmi ${Event.ZONE_TYPES.join(', ')}`);
    if (!Array.isArray(data.coordinates) || data.coordinates.length < 4) {
      errors.push('coordinates doit contenir au moins 4 points [longitude, latitude] (polygone ferme)');
    } else {
      const first = data.coordinates[0];
      const last = data.coordinates[data.coordinates.length - 1];
      if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
        errors.push('coordinates doit former un polygone ferme (premier point = dernier point)');
      }
    }
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  toDocument() {
    const { name, type, startDate, endDate, status, zones, version, createdAt, updatedAt } = this;
    return { name, type, startDate, endDate, status, zones, version, createdAt, updatedAt };
  }
}

module.exports = Event;
