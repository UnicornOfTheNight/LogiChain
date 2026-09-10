/**
 * Entite Task : permet aux administrateurs/responsables logistiques
 * d'assigner des taches aux agents de terrain et transporteurs.
 */
class Task {
  static STATUSES = ['a_faire', 'en_cours', 'terminee', 'annulee'];

  constructor({ eventId, assignedToUserId, title, description = '', dueAt = null, status = 'a_faire', version = 0 }) {
    this.eventId = eventId;
    this.assignedToUserId = assignedToUserId;
    this.title = title;
    this.description = description;
    this.dueAt = dueAt ? new Date(dueAt) : null;
    this.status = status;
    this.version = version;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static validate(data) {
    const errors = [];
    if (!data.eventId) errors.push('eventId est requis');
    if (!data.assignedToUserId) errors.push('assignedToUserId est requis');
    if (!data.title) errors.push('title est requis');
    if (data.status && !Task.STATUSES.includes(data.status)) errors.push('status invalide');
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  static validateStatus(status) {
    if (!Task.STATUSES.includes(status)) {
      const err = new Error(`status doit etre parmi ${Task.STATUSES.join(', ')}`);
      err.name = 'ValidationError';
      throw err;
    }
  }

  toDocument() {
    const { eventId, assignedToUserId, title, description, dueAt, status, version, createdAt, updatedAt } = this;
    return { eventId, assignedToUserId, title, description, dueAt, status, version, createdAt, updatedAt };
  }
}

module.exports = Task;
