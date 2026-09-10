class Item {
  static CATEGORIES = ['scenique', 'electrique', 'mobilier', 'signaletique', 'vehicule'];
  static STATUSES = ['en_stock', 'en_transit', 'livre', 'en_maintenance', 'perdu'];

  // Correspondance action de scan -> statut resultant (partagee entre le
  // scan initial et le recalcul apres annulation d'une entree d'historique)
  static ACTION_TO_STATUS = {
    livraison: 'livre',
    deplacement: 'en_transit',
    maintenance: 'en_maintenance',
    retour: 'en_stock'
  };

  constructor({
    eventId,
    label,
    category,
    qrCode,
    status = 'en_stock',
    location,
    carbonFootprintKg = 0,
    history = [],
    assignedToUserId = null,
    version = 0
  }) {
    this.eventId = eventId;
    this.label = label;
    this.category = category;
    this.qrCode = qrCode;
    this.status = status;
    this.location = location || { type: 'Point', coordinates: [0, 0] };
    this.carbonFootprintKg = carbonFootprintKg;
    this.history = history;
    this.assignedToUserId = assignedToUserId;
    this.version = version;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static validate(data) {
    const errors = [];
    if (!data.eventId) errors.push('eventId est requis');
    if (!data.label) errors.push('label est requis');
    if (!Item.CATEGORIES.includes(data.category)) errors.push(`category doit etre parmi ${Item.CATEGORIES.join(', ')}`);
    if (!data.qrCode) errors.push('qrCode est requis');
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  /**
   * Recalcule le statut d'un item a partir de son historique, en ignorant
   * les entrees annulees. Utilise apres annulation d'un scan pour remettre
   * l'item dans l'etat correspondant a la derniere action valide restante
   * (ou "en_stock" par defaut si aucune action de scan valide ne subsiste).
   */
  static computeStatusFromHistory(history) {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const entry = history[i];
      if (entry.cancelled) continue;
      const mappedStatus = Item.ACTION_TO_STATUS[entry.action];
      if (mappedStatus) return mappedStatus;
    }
    return 'en_stock';
  }

  toDocument() {
    const {
      eventId,
      label,
      category,
      qrCode,
      status,
      location,
      carbonFootprintKg,
      history,
      assignedToUserId,
      version,
      createdAt,
      updatedAt
    } = this;
    return {
      eventId,
      label,
      category,
      qrCode,
      status,
      location,
      carbonFootprintKg,
      history,
      assignedToUserId,
      version,
      createdAt,
      updatedAt
    };
  }
}

module.exports = Item;
