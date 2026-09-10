const { ObjectId } = require('../config/database');
const BaseRepository = require('./BaseRepository');

class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  // Mise a jour avec verrouillage optimiste (utile en mode reconnexion apres offline)
  async updateWithLock(id, currentVersion, data) {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id), version: currentVersion },
      { $set: { ...data, updatedAt: new Date() }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  // Decoupage cartographique : ajoute une zone (polygone GeoJSON) a l'evenement
  async addZone(eventId, zoneDocument) {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(eventId) },
      { $push: { zones: { _id: new ObjectId(), ...zoneDocument } }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }
}

// Export en singleton : une seule instance partagee dans toute l'application
module.exports = new EventRepository();
