const { ObjectId } = require('../config/database');
const BaseRepository = require('./BaseRepository');
const Item = require('../models/Item');

class ItemRepository extends BaseRepository {
  constructor() {
    super('items');
  }

  // Convertit eventId (string) en ObjectId avant insertion
  async create(document) {
    const doc = { ...document, eventId: new ObjectId(document.eventId) };
    return super.create(doc);
  }

  async findByQrCode(qrCode) {
    return this.collection.findOne({ qrCode });
  }

  async findByEvent(eventId, filters = {}, pagination = {}) {
    const mongoFilters = { eventId: new ObjectId(eventId) };
    if (filters.status) mongoFilters.status = filters.status;
    if (filters.assignedToUserId) mongoFilters.assignedToUserId = new ObjectId(filters.assignedToUserId);
    return this.findAll(mongoFilters, pagination);
  }

  // Affecte (ou desaffecte si userId est null) un equipement a un agent/transporteur
  async assignToUser(itemId, userId) {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(itemId) },
      { $set: { assignedToUserId: userId ? new ObjectId(userId) : null, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  /**
   * Verrouillage optimiste : la mise a jour n'est appliquee que si la
   * version transmise correspond a la version actuelle en base. Sinon,
   * on considere qu'un autre agent a deja modifie le document pendant
   * une phase de deconnexion -> conflit remonte a la couche Service.
   */
  async updateWithLock(id, currentVersion, updateFields, historyEntry) {
    const update = {
      $set: { ...updateFields, updatedAt: new Date() },
      $inc: { version: 1 }
    };
    if (historyEntry) {
      update.$push = { history: historyEntry };
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id), version: currentVersion },
      update,
      { returnDocument: 'after' }
    );

    if (!result.value) {
      const err = new Error('CONFLIT_VERSION');
      err.code = 'OPTIMISTIC_LOCK_CONFLICT';
      throw err;
    }
    return result.value;
  }

  // Etat des stocks : nombre d'items par statut pour un evenement
  async stockAggregation(eventId) {
    return this.collection
      .aggregate([
        { $match: { eventId: new ObjectId(eventId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
      .toArray();
  }

  // Empreinte carbone consolidee de l'evenement
  async carbonFootprintAggregation(eventId) {
    const result = await this.collection
      .aggregate([
        { $match: { eventId: new ObjectId(eventId) } },
        { $group: { _id: null, total: { $sum: '$carbonFootprintKg' } } }
      ])
      .toArray();
    return result[0]?.total || 0;
  }

  // Detection de goulots d'etranglement : zones ou trop d'items restent "en_transit"
  async bottleneckDetection(eventId, threshold = 3) {
    return this.collection
      .aggregate([
        { $match: { eventId: new ObjectId(eventId), status: 'en_transit' } },
        {
          $group: {
            _id: {
              lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] },
              lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] }
            },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gte: threshold } } },
        { $sort: { count: -1 } }
      ])
      .toArray();
  }

  // Historique des scans/mouvements d'un evenement (deplie les sous-documents
  // history de chaque item), avec filtres optionnels agent/item/type d'action.
  async scanHistory(eventId, filters = {}) {
    const matchStage = { eventId: new ObjectId(eventId) };
    if (filters.itemId) matchStage._id = new ObjectId(filters.itemId);

    const postUnwindMatch = {};
    if (filters.agentId) postUnwindMatch['history.agentId'] = new ObjectId(filters.agentId);
    if (filters.action) postUnwindMatch['history.action'] = filters.action;

    const pipeline = [{ $match: matchStage }, { $unwind: '$history' }];
    if (Object.keys(postUnwindMatch).length) pipeline.push({ $match: postUnwindMatch });
    pipeline.push(
      {
        $project: {
          _id: 0,
          itemId: '$_id',
          label: 1,
          category: 1,
          qrCode: 1,
          action: '$history.action',
          agentId: '$history.agentId',
          location: '$history.location',
          note: '$history.note',
          timestamp: '$history.timestamp',
          cancelled: '$history.cancelled',
          version: 1
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 500 }
    );

    return this.collection.aggregate(pipeline).toArray();
  }

  // Historique de tous les scans realises par un agent/transporteur donne,
  // tous evenements confondus (feuille de vie de l'agent).
  async scanHistoryForAgent(agentId, filters = {}) {
    const postUnwindMatch = { 'history.agentId': new ObjectId(agentId) };
    if (filters.action) postUnwindMatch['history.action'] = filters.action;

    const pipeline = [
      { $unwind: '$history' },
      { $match: postUnwindMatch },
      {
        $project: {
          _id: 0,
          itemId: '$_id',
          label: 1,
          category: 1,
          qrCode: 1,
          action: '$history.action',
          location: '$history.location',
          note: '$history.note',
          timestamp: '$history.timestamp',
          cancelled: '$history.cancelled',
          version: 1
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 200 }
    ];

    return this.collection.aggregate(pipeline).toArray();
  }

  /**
   * Annule une entree d'historique precise (identifiee par son action +
   * timestamp exacts, seule combinaison stable dont dispose le client) :
   * la marque "cancelled" (jamais supprimee, traçabilite conservee) et
   * recalcule le statut de l'item a partir de l'historique restant.
   *
   * La version utilisee pour le verrouillage optimiste est celle qu'on
   * vient de lire (item.version), PAS une version fournie par le client :
   * celle-ci pourrait etre perimee (une synchronisation en arriere-plan a
   * pu faire progresser l'item entretemps) et provoquerait un faux
   * conflit systematique. Le meme principe est deja applique par
   * scanItem(). Le find+update n'est pas parfaitement atomique (petite
   * fenetre de course possible), mais le verrouillage optimiste rattrape
   * les conflits reellement concurrents en renvoyant VERSION_CONFLICT.
   */
  async cancelHistoryEntry(itemId, entryTimestamp, entryAction) {
    const item = await this.collection.findOne({ _id: new ObjectId(itemId) });
    if (!item) return { error: 'NOT_FOUND' };

    const targetTime = new Date(entryTimestamp).getTime();
    const entry = item.history.find(
      (h) => h.action === entryAction && new Date(h.timestamp).getTime() === targetTime && !h.cancelled
    );
    if (!entry) return { error: 'ENTRY_NOT_FOUND' };

    const updatedHistory = item.history.map((h) =>
      h === entry ? { ...h, cancelled: true, cancelledAt: new Date() } : h
    );
    const newStatus = Item.computeStatusFromHistory(updatedHistory);

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(itemId), version: item.version },
      { $set: { history: updatedHistory, status: newStatus, updatedAt: new Date() }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );

    if (!result.value) return { error: 'VERSION_CONFLICT' };
    return { value: result.value };
  }
}

module.exports = new ItemRepository();
