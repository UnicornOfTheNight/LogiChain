const { ObjectId } = require('../config/database');
const BaseRepository = require('./BaseRepository');

class RouteRepository extends BaseRepository {
  constructor() {
    super('routes');
  }

  // Convertit les references (eventId, transporterId, itemIds) en ObjectId
  async create(document) {
    const doc = {
      ...document,
      eventId: new ObjectId(document.eventId),
      transporterId: new ObjectId(document.transporterId),
      stops: (document.stops || []).map((stop) => ({
        ...stop,
        _id: new ObjectId(),
        itemIds: (stop.itemIds || []).map((id) => new ObjectId(id))
      }))
    };
    return super.create(doc);
  }

  async findByEvent(eventId, pagination = {}) {
    return this.findAll({ eventId: new ObjectId(eventId) }, pagination);
  }

  // Plannings de livraison assignes a un agent/transporteur (feuilles de route dont il est le transporteur)
  async findByTransporter(userId, pagination = {}) {
    return this.findAll({ transporterId: new ObjectId(userId) }, pagination);
  }

  // Validation d'un arret precis dans une feuille de route (sous-document)
  async validateStop(routeId, stopId) {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(routeId), 'stops._id': new ObjectId(stopId) },
      { $set: { 'stops.$.validated': true, updatedAt: new Date() }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Validation/cloture de la feuille de route entiere (verrouillage optimiste)
  async updateWithLock(id, currentVersion, data) {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id), version: currentVersion },
      { $set: { ...data, updatedAt: new Date() }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );
    return result.value;
  }
}

module.exports = new RouteRepository();
